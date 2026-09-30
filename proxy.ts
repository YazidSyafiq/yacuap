import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Hanya area admin. Halaman publik tidak menyentuh sesi supaya tetap statis.
  matcher: ["/admin/:path*"],
};
