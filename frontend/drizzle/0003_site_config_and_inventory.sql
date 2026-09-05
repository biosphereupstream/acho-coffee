-- =====================================================
-- ACHO COFFEE — Migrasi Site Config & Inventaris
-- =====================================================

CREATE TABLE IF NOT EXISTS "site_config" (
  "key" varchar(100) PRIMARY KEY,
  "value" jsonb NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" varchar(40) PRIMARY KEY,
  "code" varchar(40) NOT NULL,
  "name" varchar(200) NOT NULL,
  "category" varchar(60) NOT NULL,
  "current_stock" integer NOT NULL DEFAULT 0,
  "unit" varchar(30) NOT NULL DEFAULT 'pcs',
  "min_threshold" integer NOT NULL DEFAULT 0,
  "cost_per_unit_idr" integer NOT NULL DEFAULT 0,
  "location" text,
  "batch_number" varchar(60),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "inventory_logs" (
  "id" varchar(40) PRIMARY KEY,
  "inventory_item_id" varchar(40) NOT NULL,
  "item_name" varchar(200),
  "change_amount" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "action_type" varchar(40) NOT NULL,
  "reason" text,
  "created_by" varchar(120),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "inventory_logs_item_idx" ON "inventory_logs" ("inventory_item_id");
