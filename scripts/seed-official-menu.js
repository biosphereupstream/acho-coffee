/**
 * Synchronize Supabase PostgreSQL coffees table with the official Biosphere Roast Works menu.
 * Run: node scripts/seed-official-menu.js
 */

const fs = require("fs");
const postgres = require("postgres");

// Read env
const envText = fs.readFileSync(".env.local", "utf8");
const dbUrl =
  envText.match(/^DIRECT_DATABASE_URL=(.*)$/m)?.[1]?.trim() ||
  envText.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();

if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

// Read COFFEES from src/data/coffees.ts
// We will import or read compiled list
async function main() {
  console.log("=========================================================");
  console.log("☕ SEEDING OFFICIAL BIOSPHERE ROAST WORKS MENU TO DB");
  console.log("=========================================================");

  const sql = postgres(dbUrl);

  // Read the COFFEES list by requiring the module via tsx or dynamic require
  let COFFEES;
  try {
    const mod = await import("../frontend/src/data/coffees.ts");
    COFFEES = mod.COFFEES;
  } catch {
    const mod = await import("../src/data/coffees.ts");
    COFFEES = mod.COFFEES;
  }

  console.log(`Found ${COFFEES.length} official menu items to sync.`);

  let inserted = 0;
  let updated = 0;

  for (const c of COFFEES) {
    const existing = await sql`select id from coffees where slug = ${c.slug}`;
    if (existing.length > 0) {
      await sql`
        update coffees set
          name = ${c.name},
          type = ${c.type},
          origin = ${c.origin},
          region = ${c.region},
          process = ${c.process},
          altitude_meters = ${c.altitude},
          varietal = ${c.varietal},
          tasting_notes = ${JSON.stringify(c.tastingNotes)},
          description = ${c.description},
          story = ${c.story},
          price_idr = ${c.priceIdr},
          weight_grams = ${c.weightGrams},
          is_active = true
        where slug = ${c.slug}
      `;
      updated++;
    } else {
      await sql`
        insert into coffees (
          id, slug, name, type, origin, region, process, altitude_meters, varietal,
          tasting_notes, description, story, price_idr, weight_grams, is_active
        ) values (
          gen_random_uuid(),
          ${c.slug},
          ${c.name},
          ${c.type},
          ${c.origin},
          ${c.region},
          ${c.process},
          ${c.altitude},
          ${c.varietal},
          ${JSON.stringify(c.tastingNotes)},
          ${c.description},
          ${c.story},
          ${c.priceIdr},
          ${c.weightGrams},
          true
        )
      `;
      inserted++;
    }
  }

  console.log(`✓ Synchronized: ${inserted} new products inserted, ${updated} existing updated.`);

  const allRows = await sql`select count(*) as count from coffees where is_active = true`;
  console.log(`Total active products in database: ${allRows[0].count}`);

  await sql.end();
  console.log("=========================================================");
  console.log("🎉 DATABASE MENU SYNCHRONIZATION COMPLETE!");
  console.log("=========================================================");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
