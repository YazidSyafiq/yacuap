import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/**
 * Klien untuk Server Component, Server Action, dan Route Handler yang butuh sesi admin.
 * Membaca cookie, jadi halaman yang memakainya dirender per request.
 */
export async function createClient() {
  assertSupabaseConfigured();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component: cookie tidak bisa ditulis di sana.
          // Aman diabaikan karena proxy.ts yang menyegarkan sesi.
        }
      },
    },
  });
}
