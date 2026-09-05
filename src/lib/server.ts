import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Klien Supabase untuk Server Component / Route Handler (blok resmi Supabase/shadcn).
 * Selalu buat klien baru per pemanggilan; null bila env belum dikonfigurasi.
 */
export async function createClient() {
  if (!env.supabaseConfigured()) return null;
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl(), env.supabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component — middleware/proxy yang menangani session.
        }
      },
    },
  });
}

/**
 * Fast helper to get the authenticated user without making network requests
 * when the visitor is a guest (no auth cookies present).
 */
export async function getAuthenticatedUser() {
  if (!env.supabaseConfigured()) return null;
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some(
    (c) => c.name.startsWith("sb-") || c.name.includes("auth-token")
  );
  if (!hasAuthCookie) return null;

  const supabase = await createClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}
