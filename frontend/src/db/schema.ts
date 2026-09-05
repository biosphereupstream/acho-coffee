import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  date,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/* ============ ENUMS ============ */
export const coffeeTypeEnum = pgEnum("coffee_type", ["single_origin", "blend"]);
export const roastLevelEnum = pgEnum("roast_level", ["light", "medium", "medium_dark", "dark"]);
export const grindSizeEnum = pgEnum("grind_size", ["bean", "fine", "medium", "coarse"]);
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending_payment",
  "paid",
  "queued",
  "roasting",
  "resting",
  "ready_pickup",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
]);
export const fulfillmentEnum = pgEnum("fulfillment_type", ["pickup", "delivery"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded",
]);

/* ============ TABLES ============ */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: varchar("phone", { length: 20 }),
  preferredBrew: text("preferred_brew"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const coffees = pgTable("coffees", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  type: coffeeTypeEnum("type").notNull(),
  origin: varchar("origin", { length: 120 }).notNull(),
  region: varchar("region", { length: 120 }),
  process: varchar("process", { length: 60 }),
  altitudeMeters: varchar("altitude_meters", { length: 60 }),
  varietal: varchar("varietal", { length: 120 }),
  tastingNotes: jsonb("tasting_notes").$type<string[]>().notNull().default([]),
  description: text("description").notNull(),
  story: text("story"),
  priceIdr: integer("price_idr").notNull(),
  weightGrams: integer("weight_grams").notNull().default(250),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

export const roastProfiles = pgTable("roast_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  level: roastLevelEnum("level").notNull(),
  description: text("description").notNull(),
  notes: jsonb("notes").$type<string[]>().notNull().default([]),
  bestFor: jsonb("best_for").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", { length: 40 }).notNull().unique(),
    userId: uuid("user_id"),
    guestEmail: text("guest_email"),
    guestToken: text("guest_token"),
    status: orderStatusEnum("status").notNull().default("draft"),
    fulfillment: fulfillmentEnum("fulfillment").notNull(),
    pickupDate: date("pickup_date"),
    pickupSlot: varchar("pickup_slot", { length: 30 }),
    shippingAddress: jsonb("shipping_address").$type<{
      name: string;
      phone: string;
      address: string;
      city: string;
      areaId?: string;
      postalCode?: string;
    }>(),
    courierCompany: varchar("courier_company", { length: 30 }),
    shippingFee: integer("shipping_fee").notNull().default(0),
    subtotal: integer("subtotal").notNull().default(0),
    discountAmount: integer("discount_amount").notNull().default(0),
    voucherCode: varchar("voucher_code", { length: 40 }),
    total: integer("total").notNull().default(0),
    customerName: varchar("customer_name", { length: 120 }).notNull(),
    customerEmail: varchar("customer_email", { length: 160 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
    note: text("note"),
    dokuPaymentId: text("doku_payment_id"),
    dokuChannel: text("doku_channel"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { mode: "string" }),
    trackingNo: text("tracking_no"),
    trackingUrl: text("tracking_url"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_pickup_date_idx").on(t.pickupDate),
    index("orders_user_idx").on(t.userId),
  ]
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  coffeeId: uuid("coffee_id").references(() => coffees.id),
  coffeeName: varchar("coffee_name", { length: 120 }).notNull(),
  roastProfileId: uuid("roast_profile_id").references(() => roastProfiles.id),
  roastProfileName: varchar("roast_profile_name", { length: 60 }).notNull(),
  grindSize: grindSizeEnum("grind_size").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceIdr: integer("unit_price_idr").notNull(),
  subtotalIdr: integer("subtotal_idr").notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 30 }).notNull().default("doku"),
  providerPaymentId: text("provider_payment_id"),
  channel: varchar("channel", { length: 60 }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  requestJson: jsonb("request_json"),
  notifyJson: jsonb("notify_json"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 30 }).notNull().default("biteship"),
  providerOrderId: text("provider_order_id"),
  waybillId: text("waybill_id"),
  trackingId: text("tracking_id"),
  courierCompany: varchar("courier_company", { length: 30 }),
  courierType: varchar("courier_type", { length: 30 }),
  status: varchar("status", { length: 40 }),
  cost: integer("cost").notNull().default(0),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const pickupSchedule = pgTable("pickup_schedule", {
  slotDate: date("slot_date").primaryKey(),
  capacityBags: integer("capacity_bags").notNull().default(120),
  note: text("note"),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    guestId: varchar("guest_id", { length: 64 }),
    coffeeSlug: varchar("coffee_slug", { length: 100 }).notNull(),
    coffeeName: varchar("coffee_name", { length: 120 }).notNull(),
    roastProfileCode: varchar("roast_profile_code", { length: 30 }).notNull(),
    roastProfileName: varchar("roast_profile_name", { length: 60 }).notNull(),
    grindSize: grindSizeEnum("grind_size").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceIdr: integer("unit_price_idr").notNull(),
    weightGrams: integer("weight_grams").notNull().default(250),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => [
    index("cart_items_user_idx").on(t.userId),
    index("cart_items_guest_idx").on(t.guestId),
  ]
);

export const userAddresses = pgTable(
  "user_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    label: varchar("label", { length: 50 }).notNull().default("Rumah"),
    recipientName: varchar("recipient_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 25 }).notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 10 }).notNull(),
    areaId: varchar("area_id", { length: 64 }),
    areaName: text("area_name"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => [
    index("user_addresses_user_idx").on(t.userId),
  ]
);

/* ============ INFERRED TYPES ============ */
export type Coffee = typeof coffees.$inferSelect;
export type NewCoffee = typeof coffees.$inferInsert;
export type RoastProfile = typeof roastProfiles.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type UserAddress = typeof userAddresses.$inferSelect;
export type NewUserAddress = typeof userAddresses.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type RoastLevel = (typeof roastLevelEnum.enumValues)[number];
export type GrindSize = (typeof grindSizeEnum.enumValues)[number];
export type FulfillmentType = (typeof fulfillmentEnum.enumValues)[number];
