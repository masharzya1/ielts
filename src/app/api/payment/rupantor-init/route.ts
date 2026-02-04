import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { testId, sessionId, amount, customerName, customerEmail, type } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Rupantor Pay settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_settings")
      .maybeSingle();

    const rupantorSettings = settingsData?.value?.rupantor_pay;

    if (!rupantorSettings?.enabled || !rupantorSettings?.api_key) {
      return NextResponse.json({ error: "Rupantor Pay is not configured" }, { status: 500 });
    }

    let purchaseId;
    if (type === "subscription") {
      purchaseId = sessionId; // Using sessionId as purchaseId for tracking in webhook
    } else if (type === "prebook") {
      // Create a pending pre-booking record
      const { data: prebooking, error: prebookingError } = await supabase
        .from("pre_bookings")
        .insert({
          user_id: user.id,
          email: user.email,
          test_id: testId || null,
          amount_paid: amount,
          status: "pending",
          payment_status: "pending"
        })
        .select()
        .maybeSingle();

      if (prebookingError) throw prebookingError;
      purchaseId = prebooking.id;
    } else {
      // Create a pending purchase record for tests
      const { data: purchase, error: purchaseError } = await supabase
        .from("user_purchases")
        .insert({
          user_id: user.id,
          item_id: testId,
          item_type: "mock_test",
          amount: amount,
          status: "pending",
          payment_method: "rupantor_pay",
          duration_days: 365
        })
        .select()
        .maybeSingle();

      if (purchaseError) throw purchaseError;
      purchaseId = purchase.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    // Call Rupantor Pay API
    const response = await fetch("https://rupantorpay.com/api/v1/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        api_key: rupantorSettings.api_key,
        amount: amount,
        customer_name: customerName,
        customer_email: customerEmail,
        order_id: purchaseId,
        success_url: `${baseUrl}/api/payment/rupantor-callback?status=success&purchaseId=${purchaseId}&type=${type || 'test'}`,
        cancel_url: `${baseUrl}/api/payment/rupantor-callback?status=cancel&purchaseId=${purchaseId}&type=${type || 'test'}`,
        webhook_url: `${baseUrl}/api/payment/rupantor-webhook`
      }),
    });

    const data = await response.json();

    if (data.status === "success" && data.payment_url) {
      return NextResponse.json({ paymentUrl: data.payment_url });
    } else {
      console.error("Rupantor Pay Error:", data);
      return NextResponse.json({ error: data.message || "Failed to initialize payment" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Payment Init Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
