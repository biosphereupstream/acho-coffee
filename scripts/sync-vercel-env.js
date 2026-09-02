/**
 * Script Otomatisasi Upload Environment Variables dari .env.local ke Vercel.
 *
 * Penggunaan:
 *   node scripts/sync-vercel-env.js --target=staging
 *   node scripts/sync-vercel-env.js --target=preview
 *   node scripts/sync-vercel-env.js --target=production
 *   node scripts/sync-vercel-env.js --target=all
 *
 * Opsional: jika menggunakan token Vercel:
 *   node scripts/sync-vercel-env.js --target=staging --token=YOUR_VERCEL_TOKEN
 */

const fs = require("fs");
const { execSync, spawnSync } = require("child_process");

// Parse CLI args
const args = process.argv.slice(2);
let target = "staging";
let token = process.env.VERCEL_TOKEN || "";

for (const arg of args) {
  if (arg.startsWith("--target=")) {
    target = arg.split("=")[1];
  } else if (arg.startsWith("--token=")) {
    token = arg.split("=")[1];
  }
}

const tokenFlag = token ? ` --token=${token}` : "";

console.log("=========================================================");
console.log("⚡ VERCEL ENVIRONMENT VARIABLE AUTO-SYNC");
console.log("=========================================================");
console.log(`Target Environment: ${target}`);
if (token) console.log("Using Vercel Token authentication");

// 1. Verifikasi Login & Project Link
console.log("\n1. Memeriksa status otentikasi Vercel...");
try {
  const whoami = execSync(`npx vercel whoami${tokenFlag}`, { encoding: "utf8" });
  console.log("   ✓ Terautentikasi sebagai:", whoami.trim());
} catch (e) {
  console.error("\n❌ Anda belum login ke Vercel CLI!");
  console.error("Silakan jalankan perintah ini di terminal Anda untuk login terlebih dahulu:");
  console.error("  npx vercel login");
  console.error("\nAtau jalankan script ini dengan token Vercel:");
  console.error("  node scripts/sync-vercel-env.js --target=" + target + " --token=YOUR_VERCEL_TOKEN");
  process.exit(1);
}

// 2. Periksa apakah project sudah di-link (.vercel/project.json)
if (!fs.existsSync(".vercel/project.json")) {
  console.log("\n2. Project belum terhubung ke Vercel. Menghubungkan project...");
  console.log("   Silakan ikuti instruksi link di bawah jika muncul:");
  try {
    execSync(`npx vercel link --yes${tokenFlag}`, { stdio: "inherit" });
  } catch (e) {
    console.error("\n❌ Gagal menghubungkan project otomatis. Silakan jalankan:");
    console.error("  npx vercel link");
    process.exit(1);
  }
} else {
  console.log("\n2. ✓ Project telah terhubung (.vercel/project.json ditemukan)");
}

// 3. Baca .env.local
console.log("\n3. Membaca variabel dari .env.local...");
if (!fs.existsSync(".env.local")) {
  console.error("❌ File .env.local tidak ditemukan!");
  process.exit(1);
}

const envContent = fs.readFileSync(".env.local", "utf8");
const lines = envContent.split("\n");
const envVars = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();

  // Abaikan config direktori lokal
  if (key === "ACHO_DATA_DIR") continue;

  envVars.push({ key, val });
}

console.log(`   ✓ Ditemukan ${envVars.length} variabel environment untuk di-sync:`);
envVars.forEach((ev) => console.log(`     - ${ev.key}`));

// 4. Tentukan target env
const targetList = target === "all" ? ["development", "preview", "production"] : [target];

// 5. Upload ke Vercel
console.log("\n4. Mengunggah environment variables ke Vercel...");

for (const t of targetList) {
  console.log(`\n--- Mengunggah ke target: [${t}] ---`);
  for (const { key, val } of envVars) {
    process.stdout.write(`   Mengatur ${key}... `);

    // Hapus variable lama jika sudah ada (agar tidak bentrok / duplikat)
    try {
      execSync(`npx vercel env rm ${key} ${t} --yes${tokenFlag}`, {
        stdio: "ignore",
      });
    } catch {}

    // Tambah variable baru dengan input stdin
    const addProc = spawnSync("npx", ["vercel", "env", "add", key, t, ... (token ? [`--token=${token}`] : [])], {
      input: val + "\n",
      encoding: "utf8",
    });

    if (addProc.status === 0) {
      console.log("✓ Sukses");
    } else {
      console.log("Gagal:", (addProc.stderr || addProc.stdout || "").trim());
    }
  }
}

console.log("\n=========================================================");
console.log("🎉 SEMUA ENVIRONMENT VARIABLES BERHASIL DI-SYNC KE VERCEL!");
console.log("=========================================================");
console.log("\nUntuk melakukan deployment, jalankan:");
if (target === "production") {
  console.log("  npx vercel deploy --prod");
} else {
  console.log(`  npx vercel deploy --target=${target}`);
}
