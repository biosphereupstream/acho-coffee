-- =====================================================
-- ACHO COFFEE — Migrasi Buku Alamat (User Addresses)
-- =====================================================

CREATE TABLE IF NOT EXISTS "user_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "label" varchar(50) NOT NULL DEFAULT 'Rumah',
  "recipient_name" varchar(120) NOT NULL,
  "phone" varchar(25) NOT NULL,
  "address" text NOT NULL,
  "city" varchar(100) NOT NULL,
  "postal_code" varchar(10) NOT NULL,
  "area_id" varchar(64),
  "area_name" text,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "user_addresses_user_idx" ON "user_addresses" ("user_id");
