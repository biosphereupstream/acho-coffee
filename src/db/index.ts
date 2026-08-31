import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/**
 * Drizzle client (PostgreSQL via Supabase / Neon / Postgres lokal).
 * Bernilai null bila DATABASE_URL belum diset — lapisan store otomatis
 * memakai fallback in-memory (demo mode) supaya aplikasi tetap jalan.
 */
export const db = connectionString
  ? drizzle(postgres(connectionString, { max: 5, onnotice: () => {} }), { schema })
  : null;

export type DB = NonNullable<typeof db>;
export { schema };
