import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cartData } = await req.json();

    if (!cartData || !cartData.items || cartData.items.length === 0) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("checkout_sessions")
      .insert({
        user_id: user.id,
        cart_data: cartData,
        status: "pending"
      })
      .select("id")
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ sessionId: data.id });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
