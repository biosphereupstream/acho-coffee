const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

let envFile = path.resolve('frontend/.env.local');
if (!fs.existsSync(envFile)) {
  envFile = path.resolve('.env.local');
}

let dbUrl = '';
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  for (const line of content.split('\n')) {
    if (line.startsWith('DATABASE_URL=')) {
      dbUrl = line.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    }
  }
}

if (!dbUrl) {
  console.error('No DATABASE_URL found.');
  process.exit(1);
}

const sql = postgres(dbUrl, { max: 1 });

async function runMigration() {
  console.log('Running migration...');
  const migrationSql = fs.readFileSync(path.resolve('frontend/drizzle/0003_site_config_and_inventory.sql'), 'utf8');
  
  await sql.unsafe(migrationSql);
  console.log('Migration executed successfully.');

  // Check if frontend_config exists in site_config
  const existingConfig = await sql`SELECT key FROM site_config WHERE key = 'frontend_config'`;
  if (existingConfig.length === 0) {
    const defaultConfig = {
      banner_enabled: true,
      banner_text: "Gratis Ongkir se-Kota Bandung untuk pesanan minimal Rp 150.000",
      banner_link: "/kopi",
      announcement_text: "Roasting batch segar setiap Selasa & Jumat. Biji kopi sangrai artisan & cold brew siap kirim.",
      shop_open: true,
      shop_notice: "Buka setiap hari 08.00 - 20.00 WIB",
      b2b_max_discount_percent: 10,
      operating_hours: "08:00 - 20:00 WIB",
      contact_whatsapp: "6281234567890",
      contact_email: "hello@acho.coffee",
      free_shipping_threshold: 150000,
      pickup_slots: ["10:00 - 12:00", "13:00 - 15:00", "16:00 - 18:00"],
      updated_at: new Date().toISOString(),
    };
    await sql`INSERT INTO site_config (key, value, updated_at) VALUES ('frontend_config', ${defaultConfig}, NOW())`;
    console.log('Default frontend_config seeded into site_config.');
  } else {
    console.log('frontend_config already exists in site_config.');
  }

  // Check if inventory_items has rows
  const existingInv = await sql`SELECT count(*) as count FROM inventory_items`;
  if (parseInt(existingInv[0].count, 10) === 0) {
    const initialInventory = [
      { id: "inv-gb-frinsa", code: "GB-FRN-01", name: "Green Bean Java Frinsa Anaerobic", category: "green_beans", current_stock: 85000, unit: "grams", min_threshold: 20000, cost_per_unit_idr: 120, location: "Gudang Utama - Rak A1", batch_number: "LOT-2026-08A" },
      { id: "inv-gb-gayo", code: "GB-GYO-02", name: "Green Bean Aceh Gayo Wine Lot", category: "green_beans", current_stock: 17000, unit: "grams", min_threshold: 15000, cost_per_unit_idr: 150, location: "Gudang Utama - Rak A2", batch_number: "LOT-2026-07W" },
      { id: "inv-gb-ciwidey", code: "GB-CWD-03", name: "Green Bean Ciwidey Semi-Washed", category: "green_beans", current_stock: 65000, unit: "grams", min_threshold: 25000, cost_per_unit_idr: 110, location: "Gudang Utama - Rak A3", batch_number: "LOT-2026-08C" },
      { id: "inv-pkg-kale", code: "PKG-BOT-250", name: "Botol Kale 250ml + Tutup Segel", category: "packaging_bottle", current_stock: 450, unit: "pcs", min_threshold: 100, cost_per_unit_idr: 1800, location: "Ruang Packaging - Rak P1", batch_number: "BTL-202608" },
      { id: "inv-pkg-can", code: "PKG-CAN-250", name: "Pet Can 250ml + Easy Open End Lid", category: "packaging_can", current_stock: 80, unit: "pcs", min_threshold: 150, cost_per_unit_idr: 2400, location: "Ruang Packaging - Rak P2", batch_number: "CAN-202607" },
      { id: "inv-pkg-bot1l", code: "PKG-BOT-1000", name: "Botol Kaca/PET 1 Liter", category: "packaging_bottle", current_stock: 120, unit: "pcs", min_threshold: 50, cost_per_unit_idr: 4500, location: "Ruang Packaging - Rak P3", batch_number: "B1L-202608" },
      { id: "inv-pkg-bag250", code: "PKG-BAG-250", name: "Kraft Coffee Bag 250g One-Way Valve", category: "packaging_pouch", current_stock: 340, unit: "pcs", min_threshold: 80, cost_per_unit_idr: 3200, location: "Ruang Roasting - Meja B", batch_number: "KRF-202606" },
      { id: "inv-pkg-bag1kg", code: "PKG-BAG-1000", name: "Wholesale Foil Bag 1kg (B2B)", category: "packaging_pouch", current_stock: 25, unit: "pcs", min_threshold: 30, cost_per_unit_idr: 6500, location: "Ruang Roasting - Meja B", batch_number: "BAG1K-202605" },
      { id: "inv-ing-milk", code: "ING-MILK-01", name: "Fresh Milk Pasteurisasi Greenfield 1L", category: "ingredient", current_stock: 35, unit: "bottles", min_threshold: 20, cost_per_unit_idr: 24000, location: "Chiller 01", batch_number: "EXP-20260912" },
      { id: "inv-ing-aren", code: "ING-AREN-01", name: "Sirup Gula Aren Organik Asli 5L", category: "ingredient", current_stock: 12, unit: "bottles", min_threshold: 5, cost_per_unit_idr: 95000, location: "Dapur Produksi - Rak D1", batch_number: "ARN-202608" },
    ];
    for (const item of initialInventory) {
      await sql`INSERT INTO inventory_items (id, code, name, category, current_stock, unit, min_threshold, cost_per_unit_idr, location, batch_number)
                VALUES (${item.id}, ${item.code}, ${item.name}, ${item.category}, ${item.current_stock}, ${item.unit}, ${item.min_threshold}, ${item.cost_per_unit_idr}, ${item.location}, ${item.batch_number})`;
    }
    console.log(`Seeded ${initialInventory.length} inventory items.`);
  } else {
    console.log('inventory_items already has data.');
  }

  // Check if admin_customers exists in site_config
  const existingCust = await sql`SELECT key FROM site_config WHERE key = 'admin_customers'`;
  if (existingCust.length === 0) {
    const initialCustomers = [
      { id: "cust-01", full_name: "Budi Santoso", email: "budi.santoso@gmail.com", phone: "081298765432", preferred_brew: "V60 / Pour Over", loyalty_tier: "retail", total_orders: 8, total_spent_idr: 760000, tags: ["coffee-enthusiast", "weekly-buyer"], notes: "Suka roast level light-to-medium", is_active: true, created_at: "2025-08-01T00:00:00Z" },
      { id: "cust-02", full_name: "Kopi Kenangan Senja Cafe", email: "purchasing@senjacafe.id", phone: "081388776655", preferred_brew: "Espresso Blend", loyalty_tier: "b2b_gold", total_orders: 24, total_spent_idr: 18500000, tags: ["cafe-partner", "b2b", "bulk-1kg"], notes: "Mitra Cafe Bandung Utara, diskon B2B max 10%", is_active: true, created_at: "2025-05-01T00:00:00Z" },
      { id: "cust-03", full_name: "Rina Wijaya", email: "rina.wijaya@outlook.com", phone: "081512345678", preferred_brew: "Cold Brew Botol", loyalty_tier: "retail", total_orders: 5, total_spent_idr: 390000, tags: ["ready-to-drink", "promo-seeker"], notes: "Langganan Botol Kale", is_active: true, created_at: "2025-11-01T00:00:00Z" },
      { id: "cust-04", full_name: "Klinik Kopi Harapan", email: "owner@klinikkopi.co.id", phone: "081776543210", preferred_brew: "Filter & Espresso", loyalty_tier: "b2b_silver", total_orders: 14, total_spent_idr: 9200000, tags: ["b2b", "recurring"], notes: "Jadwal kirim setiap Senin pagi", is_active: true, created_at: "2025-07-01T00:00:00Z" },
      { id: "cust-05", full_name: "Ahmad Fauzi", email: "ahmad.fauzi@yahoo.com", phone: "081911223344", preferred_brew: "Japanese Iced", loyalty_tier: "retail", total_orders: 2, total_spent_idr: 190000, tags: ["new-customer"], notes: "Pembeli baru", is_active: true, created_at: "2026-08-01T00:00:00Z" },
      { id: "cust-06", full_name: "Space Coworking Space", email: "fnb@spacework.id", phone: "081233445566", preferred_brew: "Cold Brew Literan", loyalty_tier: "b2b_bronze", total_orders: 9, total_spent_idr: 4500000, tags: ["office", "b2b"], notes: "Penyedia kopi kantor", is_active: true, created_at: "2025-09-01T00:00:00Z" },
    ];
    await sql`INSERT INTO site_config (key, value, updated_at) VALUES ('admin_customers', ${initialCustomers}, NOW())`;
    console.log('Seeded initial customers into site_config.');
  }

  // Verify all tables
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Updated public tables in Supabase:', tables.map(t => t.table_name));
  await sql.end();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
