import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    // 1. Fetch and verify session
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
    }

    const cartData = session.cart_data;
    const subtotal = cartData.items.reduce((sum: number, item: any) => sum + item.price, 0);
    const discount = cartData.coupon ? (subtotal * cartData.coupon.discount) / 100 : 0;
    const total = subtotal - discount;

    // 2. Ensure total is 0 (security check)
    if (total > 0) {
      return NextResponse.json({ error: "This order is not free. Payment required." }, { status: 400 });
    }

    // 3. Mark session as completed
    await supabase
      .from("checkout_sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    // 4. Create Subscriptions / Purchases
    const now = new Date();
    
    // Calculate max expires_at from items
    let maxExpiresAt = now;
    cartData.items.forEach((item: any) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + item.duration_days);
      if (expiresAt > maxExpiresAt) {
        maxExpiresAt = expiresAt;
      }
    });

    // Create a master subscription record
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_type: "custom_free",
        amount: 0,
        currency: "BDT",
        payment_method: "coupon_free",
        status: "active",
        starts_at: now.toISOString(),
        expires_at: maxExpiresAt.toISOString(),
      })
      .select("id")
      .maybeSingle();

    if (subError) throw subError;

    // Create individual purchase records for each item
    const purchaseRecords = cartData.items.map((item: any) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + item.duration_days);
      
      return {
        user_id: user.id,
        item_type: item.item_type,
        module_slug: item.item_slug,
        duration_days: item.duration_days || 365,
        amount: 0,
        currency: "BDT",
        payment_method: "coupon_free",
        status: "completed",
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      };
    });

    const { error: purchaseError } = await supabase
      .from("user_purchases")
      .insert(purchaseRecords);

    if (purchaseError) throw purchaseError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error completing free checkout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
