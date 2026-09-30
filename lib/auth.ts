import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Memastikan pemanggil adalah admin. Dipakai di layout admin dan di setiap Server Action admin.
 * Proxy hanya pengecekan awal; ini pengecekan yang sebenarnya.
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=bukan-admin");
  }

  return { supabase, user };
}
