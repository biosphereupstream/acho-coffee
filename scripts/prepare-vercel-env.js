/**
 * Script untuk memformat Environment Variables dari frontend/.env.local
 * agar siap di-copy-paste langsung ke Vercel Dashboard ("Paste .env contents").
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", "frontend", ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("File frontend/.env.local tidak ditemukan di:", envPath);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const lines = raw.split("\n");

const filteredLines = [];
let count = 0;

for (const line of lines) {
  const trimmed = line.trim();
  // Lewati komentar dan baris kosong
  if (!trimmed || trimmed.startsWith("#")) continue;

  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;

  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();

  // Abaikan path direktori lokal mesin
  if (key === "ACHO_DATA_DIR") continue;

  // Pastikan URL situs di Vercel menggunakan domain live resmi
  if (key === "NEXT_PUBLIC_SITE_URL") {
    filteredLines.push(`${key}=https://biosphereroastery.vercel.app`);
    count++;
    continue;
  }

  filteredLines.push(`${key}=${val}`);
  count++;
}

console.log("======================================================================");
console.log("🚀 VERCEL ENVIRONMENT VARIABLES (Siap Copy-Paste ke Vercel Dashboard)");
console.log("======================================================================");
console.log(`Total Variabel: ${count}\n`);
console.log(filteredLines.join("\n"));
console.log("\n======================================================================");
console.log("Petunjuk:");
console.log("1. Buka Vercel Dashboard > Project Settings > Environment Variables");
console.log("2. Klik tombol 'Paste .env contents'");
console.log("3. Paste seluruh baris di atas, lalu centang Production, Preview, dan Development");
console.log("4. Simpan (Save)");
console.log("======================================================================");
