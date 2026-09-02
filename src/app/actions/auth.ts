"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";

export interface AuthActionResult {
  error?: string;
  success?: string;
  url?: string;
}

export async function signInWithEmail(formData: FormData): Promise<AuthActionResult> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { error: "Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL & PUBLISHABLE_KEY di .env.local" };

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email dan kata sandi wajib diisi" };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau kata sandi salah. Coba lagi." };
  return { success: "Berhasil masuk! Selamat datang kembali ☕" };
}

export async function signUpWithEmail(formData: FormData): Promise<AuthActionResult> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { error: "Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL & PUBLISHABLE_KEY di .env.local" };

  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) return { error: "Semua kolom wajib diisi" };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter" };

  const headerList = await headers();
  const origin = headerList.get("origin") || env.siteUrl();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: "Gagal mendaftar: " + error.message };
  return { success: "Pendaftaran berhasil! Cek email untuk verifikasi, lalu masuk." };
}

export async function signInWithGoogle(returnOrigin?: string): Promise<AuthActionResult> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { error: "Supabase belum dikonfigurasi" };

  const headerList = await headers();
  const origin = returnOrigin || headerList.get("origin") || env.siteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error || !data.url) {
    const reason = error?.message ?? "tidak ada URL redirect";
    return {
      error:
        "Google OAuth belum aktif: " +
        reason +
        ". Aktifkan di Supabase Dashboard > Authentication > Providers > Google (perlu Client ID & Secret dari Google Cloud Console).",
    };
  }
  return { url: data.url };
}

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
