const fs = require("fs");
const postgres = require("postgres");

const envText = fs.readFileSync(".env.local", "utf8");
function getEnv(key) {
  const m = envText.match(new RegExp("^" + key + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
}

(async () => {
  const url = getEnv("DIRECT_DATABASE_URL") || getEnv("DATABASE_URL");
  const sqlText = fs.readFileSync("drizzle/0002_user_addresses.sql", "utf8");
  try {
    console.log("Menerapkan migrasi 0002_user_addresses.sql ke Supabase...");
    const sql = postgres(url, { max: 1, connect_timeout: 20, idle_timeout: 10 });
    await sql.unsafe(sqlText);
    console.log("✅ MIGRASI 0002: BERHASIL diterapkan ke database Supabase!");

    const tables = await sql.unsafe("select tablename from pg_tables where schemaname = 'public' order by tablename");
    console.log("TABEL (" + tables.length + "): " + tables.map((t) => t.tablename).join(", "));
    await sql.end();
  } catch (e) {
    console.error("❌ MIGRASI GAGAL: " + e.message);
  }
  process.exit(0);
})();
