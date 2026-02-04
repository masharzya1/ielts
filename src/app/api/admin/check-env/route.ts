import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (optional, but good practice)
    // For now, we assume if they can hit this route they have some level of access, 
    // but in a real app you'd check the user role.

    const envStatus = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      POE_API_KEY: !!process.env.POE_API_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    };

    return NextResponse.json(envStatus);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
