import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const testId = searchParams.get("testId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (testId) {
      // Get test details to know if it's practice or mock
      const { data: test } = await supabaseAdmin
        .from("mock_tests")
        .select("test_type")
        .eq("id", testId)
        .maybeSingle();

      const { data: purchase } = await supabaseAdmin
        .from("purchases")
        .select("id, created_at, expires_at")
        .eq("user_id", userId)
        .eq("test_id", testId)
        .eq("status", "completed")
        .maybeSingle();

      if (purchase) {
        // If it's a practice test, check if it's expired
        if (test?.test_type === "practice") {
          const isExpired = purchase.expires_at && new Date(purchase.expires_at) < new Date();
          if (!isExpired) {
            return NextResponse.json({
              hasAccess: true,
              accessType: "purchase",
              purchase: {
                purchasedAt: purchase.created_at,
                expiresAt: purchase.expires_at,
              },
            });
          }
        } else {
          // If it's a mock test, check if the user has already finished it
          const { data: result } = await supabaseAdmin
            .from("user_results")
            .select("id")
            .eq("user_id", userId)
            .eq("test_id", testId)
            .maybeSingle();

          if (!result) {
            return NextResponse.json({
              hasAccess: true,
              accessType: "purchase",
              purchase: {
                purchasedAt: purchase.created_at,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      hasAccess: false,
      accessType: null,
    });
  } catch (error: unknown) {
    console.error("Access check error:", error);
    const message = error instanceof Error ? error.message : "Access check error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
