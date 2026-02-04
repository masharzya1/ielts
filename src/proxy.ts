import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 100;

const ipRequestCount = new Map<
  string,
  { count: number; lastReset: number }
>();

export async function proxy(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const rateLimit =
    ipRequestCount.get(ip) || { count: 0, lastReset: now };

  if (now - rateLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimit.count = 1;
    rateLimit.lastReset = now;
  } else {
    rateLimit.count++;
  }

  ipRequestCount.set(ip, rateLimit);

  if (rateLimit.count > MAX_REQUESTS) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getSession();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
