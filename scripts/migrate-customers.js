const postgres = require('c:/Users/Anindya/acho/node_modules/postgres');
const fs = require('fs');

const envContent = fs.readFileSync('c:/Users/Anindya/acho/frontend/.env.local', 'utf8');
let dbUrl = '';
envContent.split('\n').forEach(line => {
  const m = line.match(/^DATABASE_URL=(.*)$/);
  if (m) dbUrl = m[1].trim().replace(/^["']|["']$/g, '');
});

const sql = postgres(dbUrl, { max: 1 });

async function main() {
  console.log("1. Creating tables 'customers' and 'customer_broadcasts' in PostgreSQL...");

  await sql`
    CREATE TABLE IF NOT EXISTS public.customers (
      id VARCHAR(64) PRIMARY KEY,
      user_id UUID,
      full_name VARCHAR(160) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(30) NOT NULL DEFAULT '',
      preferred_brew TEXT DEFAULT 'V60 / Pour Over',
      loyalty_tier VARCHAR(30) NOT NULL DEFAULT 'retail',
      total_orders INTEGER NOT NULL DEFAULT 0,
      total_spent_idr INTEGER NOT NULL DEFAULT 0,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      notes TEXT DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_order_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS customers_email_idx ON public.customers (email);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers (user_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS customers_tier_idx ON public.customers (loyalty_tier);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS customers_is_active_idx ON public.customers (is_active);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS public.customer_broadcasts (
      id VARCHAR(64) PRIMARY KEY,
      promo_code VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      discount_percent INTEGER NOT NULL DEFAULT 10,
      recipients_count INTEGER NOT NULL DEFAULT 0,
      channel VARCHAR(30) NOT NULL DEFAULT 'whatsapp',
      message_preview TEXT NOT NULL,
      valid_until VARCHAR(60),
      status VARCHAR(30) NOT NULL DEFAULT 'sent',
      sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS customer_broadcasts_promo_code_idx ON public.customer_broadcasts (promo_code);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS customer_broadcasts_sent_at_idx ON public.customer_broadcasts (sent_at);
  `;

  console.log("✅ Tables and indexes created successfully!");

  // 2. Sync registered users from auth.users into public.customers
  console.log("2. Syncing registered users from auth.users...");
  const authUsers = await sql`
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users;
  `;

  let syncedCount = 0;
  for (const u of authUsers) {
    const meta = u.raw_user_meta_data || {};
    const fullName = meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : 'Customer');
    const existing = await sql`SELECT id FROM public.customers WHERE email = ${u.email} LIMIT 1`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO public.customers (
          id, user_id, full_name, email, phone, preferred_brew, loyalty_tier, total_orders, total_spent_idr, tags, notes, is_active, created_at, updated_at
        ) VALUES (
          ${'cust_' + u.id.replace(/-/g, '').slice(0, 16)},
          ${u.id},
          ${fullName},
          ${u.email},
          ${meta.phone || ''},
          ${'V60 / Pour Over'},
          ${'retail'},
          0,
          0,
          ${JSON.stringify(['registered-user', 'web-member'])},
          ${'Terdaftar via Google / Web Auth'},
          true,
          ${u.created_at || new Date().toISOString()},
          ${new Date().toISOString()}
        )
      `;
      syncedCount++;
    } else {
      // Pastikan user_id terpasang
      await sql`
        UPDATE public.customers 
        SET user_id = ${u.id}, full_name = COALESCE(NULLIF(full_name, ''), ${fullName})
        WHERE email = ${u.email}
      `;
    }
  }
  console.log(`✅ Synced ${syncedCount} users from auth.users!`);

  // 3. Migrate existing mock B2B customers from site_config so no data is lost
  console.log("3. Migrating B2B partners from site_config if present...");
  const siteConfigRows = await sql`
    SELECT value FROM public.site_config WHERE key = 'admin_customers' LIMIT 1
  `;
  if (siteConfigRows.length > 0 && Array.isArray(siteConfigRows[0].value)) {
    const mockList = siteConfigRows[0].value;
    let b2bCount = 0;
    for (const c of mockList) {
      if (!c.email) continue;
      const existing = await sql`SELECT id FROM public.customers WHERE email = ${c.email} LIMIT 1`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO public.customers (
            id, user_id, full_name, email, phone, preferred_brew, loyalty_tier, total_orders, total_spent_idr, tags, notes, is_active, created_at, updated_at
          ) VALUES (
            ${c.id || 'cust_' + Math.random().toString(36).slice(2, 10)},
            NULL,
            ${c.full_name || 'Mitra'},
            ${c.email},
            ${c.phone || ''},
            ${c.preferred_brew || 'Espresso Blend'},
            ${c.loyalty_tier || 'retail'},
            ${c.total_orders || 0},
            ${c.total_spent_idr || 0},
            ${JSON.stringify(c.tags || [])},
            ${c.notes || ''},
            ${c.is_active !== false},
            ${c.created_at || new Date().toISOString()},
            ${new Date().toISOString()}
          )
        `;
        b2bCount++;
      }
    }
    console.log(`✅ Migrated ${b2bCount} B2B customers from site_config!`);
  }

  // 4. Verification summary
  const allCust = await sql`SELECT id, full_name, email, phone, loyalty_tier, is_active FROM public.customers ORDER BY created_at DESC;`;
  console.log("\n--- DAFTAR PELANGGAN DI DATABASE POSTGRESQL ---");
  console.table(allCust);

  await sql.end();
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
