import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh sesi Supabase di proxy (blok resmi Supabase/shadcn).
 * Aplikasi ini publik (storefront), jadi TIDAK ada redirect paksa ke login —
 * proteksi halaman dilakukan per-route di /akun dan /admin.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse; // Supabase belum dikonfigurasi

  // Fast-path: jika pengunjung adalah tamu (tidak punya cookie auth Supabase),
  // jangan lakukan remote getClaims() yang membebani latensi
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") || c.name.includes("auth-token")
  );
  if (!hasAuthCookie) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Jangan sisipkan kode lain di antara createServerClient dan getClaims
  await supabase.auth.getClaims();

  return supabaseResponse;
}
