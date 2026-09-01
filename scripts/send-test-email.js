// ============================================================
// Uji kirim email Resend (adaptasi contoh onboarding Resend).
// Membaca RESEND_API_KEY & RESEND_FROM_EMAIL dari .env.local.
//
//   node scripts/send-test-email.js
//
// Catatan: dari "onboarding@resend.dev" hanya bisa kirim ke email
// akun Resend Anda sendiri sampai domain terverifikasi.
// ============================================================
const fs = require("fs");
const { Resend } = require("resend");

const envText = fs.readFileSync(".env.local", "utf8");
function getEnv(key, fallback) {
  const m = envText.match(new RegExp("^" + key + "=(.*)$", "m"));
  const v = m ? m[1].trim() : "";
  return v || fallback;
}

const apiKey = getEnv("RESEND_API_KEY", "");
const from = getEnv("RESEND_FROM_EMAIL", "onboarding@resend.dev");
const to = process.argv[2] || "biosphere.upstream@gmail.com";

if (!apiKey || apiKey.startsWith("re_") === false) {
  console.log("ERROR: isi RESEND_API_KEY di .env.local dulu (format re_...)");
  process.exit(1);
}

const resend = new Resend(apiKey);

resend.emails
  .send({
    from: from,
    to: to,
    subject: "Hello dari ACHO Coffee ☕",
    html:
      "<p>Congrats on sending your <strong>first email</strong>!</p>" +
      "<p>Integrasi Resend ACHO Coffee aktif — email transaksional pesanan akan tampil seperti ini.</p>",
  })
  .then((r) => {
    if (r.error) {
      console.log("GAGAL: " + r.error.message);
      process.exit(1);
    }
    console.log("TERKIRIM ✓ id=" + (r.data ? r.data.id : "?") + " dari=" + from + " ke=" + to);
  })
  .catch((e) => {
    console.log("GAGAL: " + e.message);
    process.exit(1);
  });
