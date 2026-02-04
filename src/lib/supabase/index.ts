// Re-export the browser Supabase client and factory from the root supabase module.  This avoids
// confusion between the file (`src/lib/supabase.ts`) and this directory module.  Any code
// importing `@/lib/supabase` will receive the same instance and types.

import { createClient, supabase } from "../supabase";

// Export the factory function so server code can create its own client.  The
// `supabase` constant is a pre-created browser client for convenience in
// client components.
export { createClient, supabase };
