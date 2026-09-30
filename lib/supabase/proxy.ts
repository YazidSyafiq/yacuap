import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

const LOGIN_PATH = "/admin/login";

/**
 * Menyegarkan sesi Supabase dan menjaga /admin.
 * Ini pengecekan optimistis; otorisasi sebenarnya tetap dicek ulang di layout admin dan di tiap Server Action.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === LOGIN_PATH;

  if (!isSupabaseConfigured()) {
    return isLogin ? NextResponse.next({ request }) : redirectTo(request, LOGIN_PATH);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // header anti-cache dari @supabase/ssr: respons yang membawa cookie sesi tidak boleh di-cache CDN
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Jangan taruh kode lain di antara createServerClient dan getClaims.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  if (!signedIn && !isLogin) return redirectTo(request, LOGIN_PATH, response);
  if (signedIn && isLogin) return redirectTo(request, "/admin", response);
  return response;
}

function redirectTo(request: NextRequest, path: string, from?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  // bawa cookie sesi yang baru disegarkan supaya tidak hilang saat redirect
  from?.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
