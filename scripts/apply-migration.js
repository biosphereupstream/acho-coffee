// Terapkan migrasi SQL ke Supabase via driver postgres (membaca .env.local)
const fs = require("fs");
const postgres = require("postgres");

const envText = fs.readFileSync(".env.local", "utf8");
function getEnv(key) {
  const m = envText.match(new RegExp("^" + key + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
}

(async () => {
  const url = getEnv("DIRECT_DATABASE_URL");
  const sqlText = fs.readFileSync("drizzle/0000_init.sql", "utf8");
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 20, idle_timeout: 10 });
    await sql.unsafe(sqlText);
    console.log("MIGRASI: BERHASIL diterapkan");
    const tables = await sql.unsafe("select tablename from pg_tables where schemaname = 'public' order by tablename");
    console.log("TABEL (" + tables.length + "): " + tables.map((t) => t.tablename).join(", "));
    const coffees = await sql.unsafe("select count(*)::int as n from coffees");
    const roasts = await sql.unsafe("select count(*)::int as n from roast_profiles");
    console.log("SEED: coffees=" + coffees[0].n + " roast_profiles=" + roasts[0].n);
    await sql.end();
  } catch (e) {
    console.log("MIGRASI GAGAL: " + e.message);
  }
  process.exit(0);
})();
