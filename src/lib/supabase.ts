// Expose a single shared Supabase client instance and the factory for
// on‑demand clients. Client components should import `supabase` for
// convenience, while server components can call `createClient()` directly.

import { createClient } from "./supabase/client";

// Export the factory so server code can instantiate a fresh client when
// needed.  In the browser we reuse a single instance to maintain auth
// state.
export { createClient };

// Instantiate a single client immediately. This can be safely imported from
// client components. Avoid importing this in server code, where a fresh
// instance should be created instead.
export const supabase = createClient();
