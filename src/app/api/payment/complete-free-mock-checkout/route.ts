import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testId, couponCode } = await req.json();

    if (!testId) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
    }

    // 1. Verify the test exists and get price
    const { data: mockTest, error: testError } = await supabase
      .from("mock_tests")
      .select("id, price")
      .eq("id", testId)
      .maybeSingle();

    if (testError || !mockTest) {
      return NextResponse.json({ error: "Mock test not found" }, { status: 404 });
    }

    let finalPrice = mockTest.price;

    // 2. If coupon provided, verify it and check if it makes the price 0
    if (couponCode) {
      const { data: coupon, error: couponErr } = await supabase
        .from("coupons")
        .select("discount_percent, is_active, valid_until, max_uses, used_count")
        .eq("code", couponCode.toUpperCase())
        .maybeSingle();

      if (!couponErr && coupon && coupon.is_active) {
        const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
        const isExhausted = coupon.max_uses && coupon.used_count >= coupon.max_uses;

        if (!isExpired && !isExhausted) {
          finalPrice = mockTest.price * (1 - coupon.discount_percent / 100);
          
          // Increment coupon usage
          await supabase.rpc('increment_coupon_usage', { coupon_code: couponCode.toUpperCase() });
        }
      }
    }

    // 3. Security check: Ensure final price is 0
    if (finalPrice > 0) {
      return NextResponse.json({ error: "This test is not free. Payment required." }, { status: 400 });
    }

      // 4. Create Purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("user_purchases")
        .insert({
          user_id: user.id,
          item_id: testId,
          item_type: "mock_test",
          amount: 0,
          status: "completed",
          payment_method: "coupon_free",
          duration_days: 365
        })
        .select()
        .maybeSingle();

      if (purchaseError) throw purchaseError;

      // 5. Create Mock Registration record (Crucial for UI to recognize enrollment)
      const { error: regError } = await supabase
        .from("mock_registrations")
        .insert({
          user_id: user.id,
          test_id: testId,
          status: "completed",
          payment_id: purchase.id
        });

      if (regError) throw regError;

      return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error completing free mock checkout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
