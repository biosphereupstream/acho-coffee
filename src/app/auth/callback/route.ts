import { NextResponse } from "next/server";
import { createClient as getSupabaseServer } from "@/lib/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/akun";

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(origin + next);
      }
    }
  }

  // gagal: kembali ke halaman masuk
  return NextResponse.redirect(origin + "/masuk?error=auth");
}
