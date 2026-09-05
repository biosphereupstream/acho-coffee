import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/store/orders";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "acho-coffee",
    time: new Date().toISOString(),
    demoMode: isDemoMode(),
    integrations: {
      supabase: env.supabaseConfigured(),
      doku: env.doku.configured() ? env.doku.env() : false,
      biteship: env.biteship.configured(),
      resend: Boolean(env.resendApiKey()),
      r2: env.r2.configured(),
    },
  });
}
