import { NextResponse } from "next/server";
import { createClient as getSupabaseServer } from "@/lib/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/akun";

  // Amankan redirect target agar selalu relative path (mencegah open redirect)
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/akun";

  // Tangani proxy/load balancer (Vercel, Cloudflare, dsb.)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectBase = isLocalEnv
    ? origin
    : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : origin;

  // Tangkap error langsung dari provider OAuth (mis. user menolak izin / access_denied)
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");
  if (errorParam || errorDesc) {
    const errorMsg = errorDesc || errorParam || "OAuth provider error";
    console.error("Supabase OAuth callback error:", { errorParam, errorDesc });
    return NextResponse.redirect(`${redirectBase}/masuk?error=${encodeURIComponent(errorMsg)}`);
  }

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${redirectBase}${safeNext}`);
      }
      console.error("Supabase exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(`${redirectBase}/masuk?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Tidak ada kode verifikasi atau Supabase belum siap
  return NextResponse.redirect(`${redirectBase}/masuk?error=auth`);
}
