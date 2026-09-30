import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/** Klien untuk Client Component. */
export function createClient() {
  assertSupabaseConfigured();
  return createBrowserClient(supabaseUrl, supabaseKey);
}
