"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/** Klien Supabase untuk komponen browser. null bila env belum diset. */
export function getSupabaseBrowser() {
  if (!env.supabaseConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient(env.supabaseUrl(), env.supabaseAnonKey());
  }
  return cached;
}
