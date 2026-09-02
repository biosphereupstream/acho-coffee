const fs = require("fs");
const postgres = require("postgres");

const envText = fs.readFileSync(".env.local", "utf8");
const url = envText.match(/^DIRECT_DATABASE_URL=(.*)$/m)[1].trim();

(async () => {
  const sql = postgres(url);
  const rows = await sql.unsafe(
    "select id, order_number, status, tracking_no, guest_token, subtotal, discount_amount, voucher_code, shipping_fee, total, customer_name, customer_email from orders where order_number = 'ACHO-20260902-J6F9'"
  );
  console.log("==========================================");
  console.log("ORDER IN SUPABASE POSTGRES:");
  console.log(rows[0]);

  if (rows[0]) {
    const items = await sql.unsafe(
      `select coffee_name, roast_profile_name, grind_size, quantity, unit_price_idr, subtotal_idr from order_items where order_id = '${rows[0].id}'`
    );
    console.log("\nORDER ITEMS IN SUPABASE POSTGRES (" + items.length + "):");
    items.forEach((i) =>
      console.log(`  - ${i.coffee_name} (${i.roast_profile_name}, ${i.grind_size}) x${i.quantity} = Rp ${i.subtotal_idr}`)
    );
  }

  const addrs = await sql.unsafe("select id, label, recipient_name, city, is_default, area_name from user_addresses");
  console.log("\nUSER ADDRESSES IN SUPABASE POSTGRES (" + addrs.length + "):");
  addrs.forEach((a) =>
    console.log(`  - [${a.label}] ${a.recipient_name} (${a.city}) | Default: ${a.is_default} | Area: ${a.area_name}`)
  );
  console.log("==========================================");
  await sql.end();
  process.exit(0);
})();
