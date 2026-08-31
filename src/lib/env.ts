/** Helper kecil untuk membaca env dengan aman. */
export const env = {
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseConfigured: () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  databaseUrl: () => process.env.DATABASE_URL ?? "",
  resendApiKey: () => process.env.RESEND_API_KEY ?? "",
  resendFrom: () => process.env.RESEND_FROM_EMAIL ?? "ACHO Coffee <hello@acho.coffee>",
  doku: {
    configured: () => Boolean(process.env.DOKU_CLIENT_ID && process.env.DOKU_SHARED_KEY),
    env: () => (process.env.DOKU_ENV === "production" ? "production" : "sandbox"),
    clientId: () => process.env.DOKU_CLIENT_ID ?? "",
    sharedKey: () => process.env.DOKU_SHARED_KEY ?? "",
    merchantName: () => process.env.DOKU_MERCHANT_NAME ?? "ACHO Coffee",
    baseUrl: () =>
      process.env.DOKU_ENV === "production"
        ? "https://api.doku.com"
        : "https://api-sandbox.doku.com",
  },
  biteship: {
    configured: () => Boolean(process.env.BITESHIP_API_KEY),
    apiKey: () => process.env.BITESHIP_API_KEY ?? "",
    originAreaId: () => process.env.BITESHIP_ORIGIN_AREA_ID ?? "",
    originAddress: () => process.env.BITESHIP_ORIGIN_ADDRESS ?? "Jl. Kopi No. 1, Bandung",
  },
  r2: {
    configured: () =>
      Boolean(
        process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET
      ),
  },
  adminEmails: () => (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
};
