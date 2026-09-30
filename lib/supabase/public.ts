import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/**
 * Klien anonim tanpa cookie untuk halaman publik.
 * Tidak menyentuh sesi, jadi halaman yang memakainya tetap bisa statis dan di-revalidate.
 */
export function createPublicClient() {
  assertSupabaseConfigured();
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
