// Buat/verifikasi akun admin di Supabase Auth (auth.users + auth.identities)
// Pemakaian: node scripts/create-admin-user.js <email> <password>
const fs = require("fs");
const crypto = require("crypto");
const postgres = require("postgres");
const bcrypt = require("bcryptjs");

const env = fs.readFileSync(".env.local", "utf8");
const m = env.match(/^DIRECT_DATABASE_URL=(.*)$/m);
const email = process.argv[2] || "biosphere.upstream@gmail.com";
const password = process.argv[3] || "AchoAdmin@2026";

(async () => {
  if (!m) {
    console.log("ERROR: DIRECT_DATABASE_URL tidak ditemukan di .env.local");
    process.exit(1);
  }
  const sql = postgres(m[1].trim(), { max: 1, connect_timeout: 20 });
  const now = new Date().toISOString();

  try {
    const exists = await sql.unsafe(
      "select id, email, (email_confirmed_at is not null) as confirmed, last_sign_in_at from auth.users where email = '" + email.replace(/'/g, "''") + "'"
    );

    if (exists.length > 0) {
      const u = exists[0];
      if (u.confirmed) {
        console.log("AKUN SUDAH ADA & TERKONFIRMASI ✓ " + u.email + " | terakhir login: " + (u.last_sign_in_at ?? "belum pernah"));
      } else {
        await sql.unsafe("update auth.users set email_confirmed_at = '" + now + "' where id = '" + u.id + "'");
        console.log("AKUN ADA tapi belum terkonfirmasi -> SUDAH SAYA KONFIRMASI ✓ " + u.email + " (kini bisa langsung login)");
      }
    } else {
      const userId = crypto.randomUUID();
      const hash = bcrypt.hashSync(password, 10);
      await sql.unsafe(
        "insert into auth.users " +
          "(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) " +
          "values (" +
          "'00000000-0000-0000-0000-000000000000', '" + userId + "', 'authenticated', 'authenticated', '" + email + "', '" + hash + "', '" + now + "', " +
          "'{\"provider\":\"email\",\"providers\":[\"email\"]}', '{\"full_name\":\"ACHO Admin\"}', '" + now + "', '" + now + "')"
      );
      await sql.unsafe(
        "insert into auth.identities (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) " +
          "values ('" + userId + "', '{\"sub\":\"" + userId + "\",\"email\":\"" + email + "\"}', 'email', '" + userId + "', '" + now + "', '" + now + "', '" + now + "')"
      );
      console.log("AKUN DIBUAT ✓ " + email + " | PASSWORD: " + password + "  <-- simpan & ganti setelah login pertama");
    }
  } catch (e) {
    console.log("GAGAL: " + e.message);
  }
  await sql.end();
  process.exit(0);
})();
