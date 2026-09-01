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
