// Konfigurasi Drizzle (CommonJS agar tidak perlu bundling esbuild saat dijalankan)
module.exports = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrasi sebaiknya memakai direct connection; runtime aplikasi memakai transaction pooler.
    url:
      process.env.DIRECT_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/acho",
  },
  strict: true,
  verbose: true,
};
