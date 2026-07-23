import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Bypasses RLS entirely — never import this into a client component, and
// only use it for the specific privileged operations that genuinely need
// it (e.g. linking an invite claim, where the claimant has no
// committee_members row yet for RLS to key off of).
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
