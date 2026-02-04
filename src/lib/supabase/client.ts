"use client";

import { createBrowserClient } from "@supabase/ssr";

// Maintain a single instance of the Supabase client in the browser.
let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Create (or retrieve) a browser Supabase client. On the server a new
 * instance is created for each call, while in the browser the client
 * is cached to avoid re‑initialising Supabase and its auth lock logic.
 */
export function createClient() {
  // In a server context, simply return a new client instance. The server
  // instance does not need to persist across requests and avoids relying on
  // browser‑specific globals like localStorage.
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // In the browser, create and cache a single client instance. This avoids
  // creating multiple clients that may interfere with each other or share
  // stale auth state.
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
