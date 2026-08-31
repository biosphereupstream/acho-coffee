-- =====================================================
-- ACHO COFFEE — skema awal (PostgreSQL / Supabase)
-- =====================================================

CREATE TYPE "coffee_type" AS ENUM ('single_origin', 'blend');
CREATE TYPE "roast_level" AS ENUM ('light', 'medium', 'medium_dark', 'dark');
CREATE TYPE "grind_size" AS ENUM ('bean', 'fine', 'medium', 'coarse');
CREATE TYPE "order_status" AS ENUM ('draft','pending_payment','paid','queued','roasting','resting','ready_pickup','shipped','delivered','completed','cancelled');
CREATE TYPE "fulfillment_type" AS ENUM ('pickup', 'delivery');
CREATE TYPE "payment_status" AS ENUM ('pending','paid','failed','expired','refunded');

CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY,
  "full_name" text NOT NULL,
  "phone" varchar(20),
  "preferred_brew" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "coffees" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(100) NOT NULL UNIQUE,
  "name" varchar(120) NOT NULL,
  "type" "coffee_type" NOT NULL,
  "origin" varchar(120) NOT NULL,
  "region" varchar(120),
  "process" varchar(60),
  "altitude_meters" varchar(60),
  "varietal" varchar(120),
  "tasting_notes" jsonb NOT NULL DEFAULT '[]',
  "description" text NOT NULL,
  "story" text,
  "price_idr" integer NOT NULL,
  "weight_grams" integer NOT NULL DEFAULT 250,
  "image_url" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "roast_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(30) NOT NULL UNIQUE,
  "name" varchar(60) NOT NULL,
  "level" "roast_level" NOT NULL,
  "description" text NOT NULL,
  "notes" jsonb NOT NULL DEFAULT '[]',
  "best_for" jsonb NOT NULL DEFAULT '[]',
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_number" varchar(40) NOT NULL UNIQUE,
  "user_id" uuid,
  "guest_email" text,
  "guest_token" text,
  "status" "order_status" NOT NULL DEFAULT 'draft',
  "fulfillment" "fulfillment_type" NOT NULL,
  "pickup_date" date,
  "pickup_slot" varchar(10),
  "shipping_address" jsonb,
  "courier_company" varchar(30),
  "shipping_fee" integer NOT NULL DEFAULT 0,
  "subtotal" integer NOT NULL DEFAULT 0,
  "total" integer NOT NULL DEFAULT 0,
  "customer_name" varchar(120) NOT NULL,
  "customer_email" varchar(160) NOT NULL,
  "customer_phone" varchar(20) NOT NULL,
  "note" text,
  "doku_payment_id" text,
  "doku_channel" text,
  "payment_status" "payment_status" NOT NULL DEFAULT 'pending',
  "paid_at" timestamp,
  "tracking_no" text,
  "tracking_url" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "orders_status_idx" ON "orders" ("status");
CREATE INDEX "orders_pickup_date_idx" ON "orders" ("pickup_date");
CREATE INDEX "orders_user_idx" ON "orders" ("user_id");

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
  "coffee_id" uuid REFERENCES "coffees" ("id"),
  "coffee_name" varchar(120) NOT NULL,
  "roast_profile_id" uuid REFERENCES "roast_profiles" ("id"),
  "roast_profile_name" varchar(60) NOT NULL,
  "grind_size" "grind_size" NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price_idr" integer NOT NULL,
  "subtotal_idr" integer NOT NULL
);

CREATE TABLE "order_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
  "status" "order_status" NOT NULL,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
  "provider" varchar(30) NOT NULL DEFAULT 'doku',
  "provider_payment_id" text,
  "channel" varchar(60),
  "amount" integer NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'IDR',
  "status" "payment_status" NOT NULL DEFAULT 'pending',
  "request_json" jsonb,
  "notify_json" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "shipments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
  "provider" varchar(30) NOT NULL DEFAULT 'biteship',
  "provider_order_id" text,
  "waybill_id" text,
  "tracking_id" text,
  "courier_company" varchar(30),
  "courier_type" varchar(30),
  "status" varchar(40),
  "cost" integer NOT NULL DEFAULT 0,
  "payload" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "pickup_schedule" (
  "slot_date" date PRIMARY KEY,
  "capacity_bags" integer NOT NULL DEFAULT 120,
  "note" text
);

-- Seed profil roasting
INSERT INTO "roast_profiles" ("code", "name", "level", "description", "notes", "best_for", "sort_order") VALUES
('light', 'Light Roast', 'light', 'Dipanggang hingga first crack. Keasaman cerah, aroma floral & fruity paling terasa.', '["Floral","Fruity","Keasaman cerah"]', '["V60","Pour Over","Aeropress"]', 1),
('medium', 'Medium Roast', 'medium', 'Keseimbangan sempurna antara keasaman dan body dengan manis karamel.', '["Karamel","Kacang","Seimbang"]', '["V60","Aeropress","French Press","Tubruk"]', 2),
('medium_dark', 'Medium Dark Roast', 'medium_dark', 'Body lebih tebal, rasa cokelat pekat dengan manis gula aren.', '["Cokelat pekat","Gula aren","Body tebal"]', '["Espresso","Moka Pot"]', 3),
('dark', 'Dark Roast', 'dark', 'Bold, smokey, pahit legit tanpa keasaman. Kuat untuk susu dan tubruk.', '["Bold","Smokey","Pahit legit"]', '["Espresso","French Press","Tubruk"]', 4);

-- Seed katalog kopi
INSERT INTO "coffees" ("slug", "name", "type", "origin", "region", "process", "altitude_meters", "varietal", "tasting_notes", "description", "story", "price_idr") VALUES
('gayo-natural', 'Gayo Natural', 'single_origin', 'Aceh', 'Dataran Tinggi Gayo, Takengon', 'Natural', '1.300 - 1.600 mdpl', 'Ateng, Tim-Tim', '["Blackberry","Dark Chocolate","Brown Sugar"]', 'Single origin andalan dengan profil manis seperti buah beri matang, body tebal, finish cokelat panjang.', 'Ditanam petani kecil di lereng Pegunungan Gayo, dikeringkan perlahan 21 hari di raised bed.', 95000),
('toraja-sapan', 'Toraja Sapan', 'single_origin', 'Sulawesi', 'Sapan, Toraja Utara', 'Giling Basah (Wet Hulled)', '1.400 - 1.800 mdpl', 'S795, Typica', '["Caramel","Rempah","Jeruk Nipis"]', 'Body penuh khas Toraja dengan karamel manis dan keasaman jeruk menyegarkan.', 'Metode giling basah warisan turun-temurun memberi karakter earthy nan elegan.', 105000),
('java-preanger-honey', 'Java Preanger Honey', 'single_origin', 'Jawa Barat', 'Pangalengan, Bandung', 'Honey', '1.350 - 1.550 mdpl', 'Lini S, Sigararutang', '["Madu","Aprikot","Floral"]', 'Manis seperti madu dan aprikot dengan aroma bunga harum. Juicy dan bersih.', 'Kebun di kaki Gunung Tilu, dijemur bersama mucilage untuk rasa honey khas.', 98000),
('flores-bajawa', 'Flores Bajawa', 'single_origin', 'NTT', 'Ngada, Bajawa', 'Semi Washed', '1.200 - 1.600 mdpl', 'Juria, S795', '["Cokelat","Walnut","Vanilla"]', 'Karakter cokelat dan walnut lembut dengan sentuhan vanilla.', 'Tanah vulkanik kaya mineral di kaki Gunung Inerie, Flores.', 92000),
('kintamani-bali', 'Kintamani Bali', 'single_origin', 'Bali', 'Kintamani, Bangli', 'Natural', '1.200 - 1.600 mdpl', 'Kopyol, Bourbon', '["Jeruk","Serai","Madu"]', 'Aroma citrus cerah, nuansa serai, dan manis madu. Pilihan pour over.', 'Sistem subak abian menjaga kebun Kintamani lestari turun-temurun.', 100000),
('nusantara-house-blend', 'Nusantara House Blend', 'blend', 'Indonesia', 'Gayo + Toraja + Flores', 'Blend Signature', '1.200 - 1.800 mdpl', 'Multi Varietal', '["Cokelat","Hazelnut","Karamel"]', 'Blend signature ACHO: seimbang, manis, konsisten — pas untuk espresso harian.', 'Disempurnakan lewat puluhan kali cupping hingga menemukan keseimbangan ideal.', 85000),
('golden-morning-blend', 'Golden Morning Blend', 'blend', 'Indonesia', 'Kintamani + Preanger', 'Blend Signature', '1.200 - 1.550 mdpl', 'Multi Varietal', '["Citrus","Madu","Floral"]', 'Blend ringan penyuka kopi cerah: citrus Kintamani berpadu manisnya honey Preanger.', 'Dibuat untuk memulai hari dengan secangkir kopi cerah dan ringan.', 88000);
