export type CoffeeType = "single_origin" | "blend";
export type GrindSize = "bean" | "fine" | "medium" | "coarse";
export type RoastLevel = "light" | "medium" | "medium_dark" | "dark";
export type FulfillmentType = "pickup" | "delivery";

export const ORDER_STATUSES = [
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
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface CatalogCoffee {
  slug: string;
  name: string;
  type: CoffeeType;
  origin: string;
  region: string;
  process: string;
  altitude: string;
  varietal: string;
  tastingNotes: string[];
  description: string;
  story: string;
  priceIdr: number;
  weightGrams: number;
  imageUrl: string | null;
  badge?: string;
  art: { bg: string; accent: string; bean: string };
}

export interface RoastProfileOption {
  code: string;
  name: string;
  level: RoastLevel;
  description: string;
  notes: string[];
  bestFor: string[];
}

export interface BrewMethod {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export interface TasteProfile {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export interface OrderItemInput {
  coffeeSlug: string;
  coffeeName: string;
  roastProfileCode: string;
  roastProfileName: string;
  grindSize: GrindSize;
  quantity: number;
  unitPriceIdr: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  areaId?: string;
}

export interface OrderItemRecord {
  coffeeSlug?: string;
  coffeeName: string;
  roastProfileCode?: string;
  roastProfileName: string;
  grindSize: GrindSize;
  quantity: number;
  unitPriceIdr: number;
  subtotalIdr: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId?: string | null;
  guestEmail?: string | null;
  guestToken?: string | null;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  pickupDate?: string | null;
  pickupSlot?: string | null;
  shippingAddress?: ShippingAddress | null;
  courierCompany?: string | null;
  shippingFee: number;
  subtotal: number;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string | null;
  dokuPaymentId?: string | null;
  dokuChannel?: string | null;
  paymentStatus: "pending" | "paid" | "failed" | "expired" | "refunded";
  paidAt?: string | null;
  trackingNo?: string | null;
  trackingUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemRecord[];
}

export interface OrderInput {
  userId?: string;
  guestEmail?: string;
  guestToken?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string;
  fulfillment: FulfillmentType;
  pickupDate?: string;
  pickupSlot?: string;
  shippingAddress?: ShippingAddress;
  courierCompany?: string;
  shippingFee: number;
  subtotal: number;
  total: number;
  items: OrderItemInput[];
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  pending_payment: "Menunggu Pembayaran",
  paid: "Pembayaran Diterima",
  queued: "Dalam Antrian Roasting",
  roasting: "Sedang Di-roasting",
  resting: "Degassing / Resting",
  ready_pickup: "Siap Diambil",
  shipped: "Dalam Pengiriman",
  delivered: "Terkirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};
