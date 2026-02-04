import { NextResponse } from "next/server";
import SSLCommerzPayment from "sslcommerz-lts";
// Use server-side supabase client within the route handler
import { createClient } from "@/lib/supabase/server";

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = false; // true for live, false for sandbox

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get("testId");

  if (!testId) {
    return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
  }

  // Fetch test details for price
  const supabase = await createClient();
  const { data: test, error } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("id", testId)
    .maybeSingle();

  if (error || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const trans_id = `TRAN_${Date.now()}`;
  const data = {
    total_amount: test.price,
    currency: "BDT",
    tran_id: trans_id,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/success?tran_id=${trans_id}&testId=${testId}`,
    fail_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/fail`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/cancel`,
    ipn_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/ipn`,
    shipping_method: "NO",
    product_name: test.title,
    product_category: "Education",
    product_profile: "digital-goods",
    cus_name: "Customer Name",
    cus_email: "cust@example.com",
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: "01711111111",
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  
  try {
    const apiResponse = await sslcz.init(data);
    let GatewayPageURL = apiResponse.GatewayPageURL;
    if (GatewayPageURL) {
      return NextResponse.redirect(GatewayPageURL, 303);
    } else {
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Payment error" }, { status: 500 });
  }
}
