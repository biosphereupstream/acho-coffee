-- =====================================================
-- ACHO COFFEE — Migrasi Cart & Voucher
-- =====================================================

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" integer NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "voucher_code" varchar(40);

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "guest_id" varchar(64),
  "coffee_slug" varchar(100) NOT NULL,
  "coffee_name" varchar(120) NOT NULL,
  "roast_profile_code" varchar(30) NOT NULL,
  "roast_profile_name" varchar(60) NOT NULL,
  "grind_size" "grind_size" NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price_idr" integer NOT NULL,
  "weight_grams" integer NOT NULL DEFAULT 250,
  "image_url" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cart_items_user_idx" ON "cart_items" ("user_id");
CREATE INDEX IF NOT EXISTS "cart_items_guest_idx" ON "cart_items" ("guest_id");
