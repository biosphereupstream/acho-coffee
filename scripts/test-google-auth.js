/**
 * Test script untuk memverifikasi kesiapan Google OAuth Supabase.
 * Jalankan: node scripts/test-google-auth.js
 */

const fs = require("fs");
const path = require("path");

// Baca .env.local secara manual bila ada
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("==================================================");
console.log("🔍 DIAGNOSIS GOOGLE OAUTH SUPABASE");
console.log("==================================================");
console.log("Supabase URL:", supabaseUrl || "❌ KOSONG");
console.log("Supabase Key:", supabaseKey ? `${supabaseKey.slice(0, 16)}...` : "❌ KOSONG");

if (!supabaseUrl || !supabaseKey) {
  console.error("\n❌ Gagal: Supabase URL dan Key harus diisi di .env.local!");
  process.exit(1);
}

async function run() {
  const { createClient } = require("@supabase/supabase-js");
  const sb = createClient(supabaseUrl, supabaseKey);

  console.log("\n1. Memanggil supabase.auth.signInWithOAuth({ provider: 'google' })...");
  const testRedirect = "http://localhost:3000/auth/callback";

  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: testRedirect,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) {
    console.error("❌ Error dari Supabase signInWithOAuth:", error.message);
    process.exit(1);
  }

  if (!data || !data.url) {
    console.error("❌ Tidak ada URL yang dikembalikan oleh Supabase.");
    process.exit(1);
  }

  console.log("✅ Supabase berhasil membuat authorize URL:");
  console.log("   ", data.url);

  console.log("\n2. Menguji respon dari endpoint authorize Supabase...");
  const authRes = await fetch(data.url, { redirect: "manual" });
  console.log("   HTTP Status:", authRes.status);
  const location = authRes.headers.get("location");

  if (authRes.status === 302 && location) {
    console.log("✅ Supabase meredirect (302) ke provider:");
    console.log("   ", location.slice(0, 120) + "...");

    if (location.includes("accounts.google.com")) {
      console.log("\n3. Memverifikasi Client ID Google di Google Accounts...");
      const googleRes = await fetch(location, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      console.log("   HTTP Status dari Google:", googleRes.status);
      const text = await googleRes.text();
      const titleMatch = text.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : "Tidak diketahui";
      console.log("   Judul Halaman Google:", title);

      if (title.toLowerCase().includes("sign in") || title.toLowerCase().includes("masuk")) {
        console.log("\n🎉 GOOGLE OAUTH BERHASIL TERHUBUNG & SIAP!");
        console.log("   Google Client ID aktif dan mengenali callback Supabase.");
      } else {
        console.warn("⚠️ Periksa apakah consent screen Google sudah dikonfigurasi dengan benar.");
      }
    } else {
      console.warn("⚠️ Redirect bukan ke Google Accounts, periksa konfigurasi provider.");
    }
  } else {
    const body = await authRes.text();
    console.error("❌ Endpoint authorize tidak meredirect. Respon body:", body);
  }
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
