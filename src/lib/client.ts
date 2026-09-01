import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/** Klien Supabase sisi browser (blok resmi Supabase/shadcn + env-guard). */
export function createClient() {
  if (!env.supabaseConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient(env.supabaseUrl(), env.supabaseKey());
  }
  return cached;
}

/** Alias untuk kompatibilitas pemanggil lama. */
export const getSupabaseBrowser = createClient;
