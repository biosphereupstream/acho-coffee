import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { DAILY_CAPACITY_BAGS, ROAST_LEAD_DAYS } from "@/lib/constants";
import type { OrderInput, OrderRecord, OrderStatus, ShippingAddress } from "@/lib/types";

/* =========================================================
   Store pesanan: Drizzle (Postgres/Supabase) bila DATABASE_URL
   tersedia; selain itu fallback demo berbasis FILE JSON
   (aman dibagi lintas route runtime/worker di mode demo).
   ========================================================= */

// Path absolut via env agar konsisten antar worker/route runtime (cwd tiap worker bisa berbeda).
// Default: <project>/.data — cukup untuk dev lokal biasa.
const DATA_DIR = process.env.ACHO_DATA_DIR
  ? path.resolve(process.env.ACHO_DATA_DIR)
  : path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "demo-orders.json");

async function readStore(): Promise<Map<string, OrderRecord>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const arr = JSON.parse(raw) as OrderRecord[];
    return new Map(arr.map((o) => [o.orderNumber, o]));
  } catch {
    return new Map();
  }
}

async function writeStore(map: Map<string, OrderRecord>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify([...map.values()]), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

function generateOrderNumber(): string {
  const d = new Date();
  const ymd =
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  return "ACHO-" + ymd + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function isDemoMode() {
  return !db;
}

/* ---------- core ---------- */
export async function createOrder(input: OrderInput): Promise<OrderRecord> {
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();

  if (db) {
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber,
        userId: input.userId ?? null,
        guestEmail: input.guestEmail ?? null,
        guestToken: input.guestToken ?? null,
        status: "pending_payment",
        fulfillment: input.fulfillment,
        pickupDate: input.pickupDate ?? null,
        pickupSlot: input.pickupSlot ?? null,
        shippingAddress: input.shippingAddress ?? null,
        courierCompany: input.courierCompany ?? null,
        shippingFee: input.shippingFee,
        subtotal: input.subtotal,
        discountAmount: input.discountAmount ?? 0,
        voucherCode: input.voucherCode ?? null,
        total: input.total,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        note: input.note ?? null,
        paymentStatus: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(schema.orderItems).values(
      input.items.map((it) => ({
        orderId: order.id,
        coffeeName: it.coffeeName,
        roastProfileName: it.roastProfileName,
        grindSize: it.grindSize,
        quantity: it.quantity,
        unitPriceIdr: it.unitPriceIdr,
        subtotalIdr: it.unitPriceIdr * it.quantity,
      }))
    );
    await db.insert(schema.orderStatusHistory).values({
      orderId: order.id,
      status: "pending_payment",
      note: "Pesanan dibuat, menunggu pembayaran",
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      guestEmail: order.guestEmail,
      guestToken: order.guestToken,
      status: order.status as OrderStatus,
      fulfillment: order.fulfillment,
      pickupDate: order.pickupDate,
      pickupSlot: order.pickupSlot,
      shippingAddress: order.shippingAddress as OrderRecord["shippingAddress"],
      courierCompany: order.courierCompany,
      shippingFee: order.shippingFee,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount ?? 0,
      voucherCode: order.voucherCode ?? null,
      total: order.total,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      note: order.note,
      dokuPaymentId: order.dokuPaymentId,
      dokuChannel: order.dokuChannel,
      paymentStatus: order.paymentStatus as OrderRecord["paymentStatus"],
      paidAt: order.paidAt,
      trackingNo: order.trackingNo,
      trackingUrl: order.trackingUrl,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: input.items.map((it) => ({
        coffeeSlug: it.coffeeSlug,
        coffeeName: it.coffeeName,
        roastProfileCode: it.roastProfileCode,
        roastProfileName: it.roastProfileName,
        grindSize: it.grindSize,
        quantity: it.quantity,
        unitPriceIdr: it.unitPriceIdr,
        subtotalIdr: it.unitPriceIdr * it.quantity,
      })),
    };
  }

  // Demo mode (file store)
  const store = await readStore();
  const record: OrderRecord = {
    id: randomUUID(),
    orderNumber,
    userId: input.userId ?? null,
    guestEmail: input.guestEmail ?? null,
    guestToken: input.guestToken ?? null,
    status: "pending_payment",
    fulfillment: input.fulfillment,
    pickupDate: input.pickupDate ?? null,
    pickupSlot: input.pickupSlot ?? null,
    shippingAddress: input.shippingAddress ?? null,
    courierCompany: input.courierCompany ?? null,
    shippingFee: input.shippingFee,
    subtotal: input.subtotal,
    discountAmount: input.discountAmount ?? 0,
    voucherCode: input.voucherCode ?? null,
    total: input.total,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    note: input.note ?? null,
    paymentStatus: "pending",
    createdAt: now,
    updatedAt: now,
    items: input.items.map((it) => ({ ...it, subtotalIdr: it.unitPriceIdr * it.quantity })),
  };
  store.set(orderNumber, record);
  await writeStore(store);
  return record;
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderRecord | null> {
  const key = orderNumber.trim().toUpperCase();
  if (db) {
    const rows = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, key)).limit(1);
    if (rows.length === 0) return null;
    const o = rows[0];
    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, o.id));
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      guestEmail: o.guestEmail,
      guestToken: o.guestToken,
      status: o.status as OrderStatus,
      fulfillment: o.fulfillment,
      pickupDate: o.pickupDate,
      pickupSlot: o.pickupSlot,
      shippingAddress: o.shippingAddress as OrderRecord["shippingAddress"],
      courierCompany: o.courierCompany,
      shippingFee: o.shippingFee,
      subtotal: o.subtotal,
      discountAmount: o.discountAmount ?? 0,
      voucherCode: o.voucherCode ?? null,
      total: o.total,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      note: o.note,
      dokuPaymentId: o.dokuPaymentId,
      dokuChannel: o.dokuChannel,
      paymentStatus: o.paymentStatus as OrderRecord["paymentStatus"],
      paidAt: o.paidAt,
      trackingNo: o.trackingNo,
      trackingUrl: o.trackingUrl,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      items: items.map((it) => ({
        coffeeName: it.coffeeName,
        roastProfileName: it.roastProfileName,
        grindSize: it.grindSize,
        quantity: it.quantity,
        unitPriceIdr: it.unitPriceIdr,
        subtotalIdr: it.subtotalIdr,
      })),
    };
  }
  const store = await readStore();
  return store.get(key) ?? null;
}

export async function findOrderByTracking(trackingNo: string): Promise<OrderRecord | null> {
  if (!trackingNo) return null;
  if (db) {
    const rows = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.trackingNo, trackingNo))
      .limit(1);
    if (rows.length === 0) return null;
    return getOrderByNumber(rows[0].orderNumber);
  }
  const store = await readStore();
  for (const o of store.values()) {
    if (o.trackingNo === trackingNo) return o;
  }
  return null;
}

export async function listOrdersByUser(userId: string): Promise<OrderRecord[]> {
  if (db) {
    const rows = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt));
    const out: OrderRecord[] = [];
    for (const o of rows) {
      const full = await getOrderByNumber(o.orderNumber);
      if (full) out.push(full);
    }
    return out;
  }
  const store = await readStore();
  return [...store.values()]
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listOrdersByGuestEmail(email: string): Promise<OrderRecord[]> {
  const key = email.trim().toLowerCase();
  if (db) {
    const rows = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.guestEmail, key))
      .orderBy(desc(schema.orders.createdAt));
    const out: OrderRecord[] = [];
    for (const o of rows) {
      const full = await getOrderByNumber(o.orderNumber);
      if (full) out.push(full);
    }
    return out;
  }
  const store = await readStore();
  return [...store.values()]
    .filter((o) => (o.guestEmail ?? "").toLowerCase() === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
  note?: string,
  extra?: Partial<
    Pick<
      OrderRecord,
      "paymentStatus" | "paidAt" | "trackingNo" | "trackingUrl" | "dokuPaymentId" | "dokuChannel"
    >
  >
): Promise<OrderRecord | null> {
  const key = orderNumber.trim().toUpperCase();
  if (db) {
    const rows = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, key)).limit(1);
    if (rows.length === 0) return null;
    const o = rows[0];
    const patch: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
    if (extra?.paymentStatus) patch.paymentStatus = extra.paymentStatus;
    if (extra?.paidAt) patch.paidAt = extra.paidAt;
    if (extra?.trackingNo) patch.trackingNo = extra.trackingNo;
    if (extra?.trackingUrl) patch.trackingUrl = extra.trackingUrl;
    if (extra?.dokuPaymentId) patch.dokuPaymentId = extra.dokuPaymentId;
    if (extra?.dokuChannel) patch.dokuChannel = extra.dokuChannel;
    await db.update(schema.orders).set(patch as never).where(eq(schema.orders.id, o.id));
    await db.insert(schema.orderStatusHistory).values({ orderId: o.id, status, note: note ?? null });
    return getOrderByNumber(key);
  }
  const store = await readStore();
  const rec = store.get(key);
  if (!rec) return null;
  rec.status = status;
  rec.updatedAt = new Date().toISOString();
  if (extra?.paymentStatus) rec.paymentStatus = extra.paymentStatus;
  if (extra?.paidAt) rec.paidAt = extra.paidAt;
  if (extra?.trackingNo) rec.trackingNo = extra.trackingNo;
  if (extra?.trackingUrl) rec.trackingUrl = extra.trackingUrl;
  if (extra?.dokuPaymentId) rec.dokuPaymentId = extra.dokuPaymentId;
  if (extra?.dokuChannel) rec.dokuChannel = extra.dokuChannel;
  store.set(key, rec);
  await writeStore(store);
  return rec;
}

export async function batchUpdateOrderStatus(
  orderNumbers: string[],
  status: OrderStatus,
  note?: string
): Promise<{ updatedCount: number; orders: OrderRecord[] }> {
  const updatedOrders: OrderRecord[] = [];
  for (const on of orderNumbers) {
    const res = await updateOrderStatus(on, status, note);
    if (res) updatedOrders.push(res);
  }
  return { updatedCount: updatedOrders.length, orders: updatedOrders };
}

export async function assignTrackingNumber(
  orderNumber: string,
  trackingNo: string,
  trackingUrl?: string
): Promise<OrderRecord | null> {
  const note = `Pesanan diserahkan ke kurir. No. Resi: ${trackingNo}`;
  return updateOrderStatus(orderNumber, "shipped", note, {
    trackingNo,
    trackingUrl: trackingUrl || undefined,
  });
}

/* ---------- jadwal antrian pickup ---------- */
export interface PickupDayInfo {
  date: string; // YYYY-MM-DD
  weekday: string;
  bookedBags: number;
  remainingBags: number;
  available: boolean;
}

async function bookedBagsFor(date: string): Promise<number> {
  if (db) {
    const rows = await db
      .select({ qty: schema.orderItems.quantity, status: schema.orders.status })
      .from(schema.orders)
      .innerJoin(schema.orderItems, eq(schema.orders.id, schema.orderItems.orderId))
      .where(eq(schema.orders.pickupDate, date));
    let total = 0;
    for (const r of rows) {
      if (r.status !== "cancelled" && r.status !== "draft") total += r.qty;
    }
    return total;
  }
  const store = await readStore();
  let total = 0;
  for (const o of store.values()) {
    if (o.pickupDate === date && o.status !== "cancelled" && o.status !== "draft") {
      total += o.items.reduce((s, it) => s + it.quantity, 0);
    }
  }
  return total;
}

export async function getPickupAvailability(days = 14): Promise<PickupDayInfo[]> {
  const out: PickupDayInfo[] = [];
  const today = new Date();
  const weekdayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  for (let i = 0; i < days + ROAST_LEAD_DAYS + 1; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) continue; // roastery tutup hari Minggu
    if (i < ROAST_LEAD_DAYS) continue; // butuh waktu roasting + resting
    const dateStr = d.toISOString().slice(0, 10);
    const booked = await bookedBagsFor(dateStr);
    const remaining = Math.max(0, DAILY_CAPACITY_BAGS - booked);
    out.push({
      date: dateStr,
      weekday: weekdayNames[d.getDay()],
      bookedBags: booked,
      remainingBags: remaining,
      available: remaining > 0,
    });
  }
  return out;
}

/** Untuk admin: daftar pesanan (maks 100 terbaru). */
export async function listOrdersForAdmin(): Promise<OrderRecord[]> {
  if (db) {
    const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(100);
    const out: OrderRecord[] = [];
    for (const o of rows) {
      const full = await getOrderByNumber(o.orderNumber);
      if (full) out.push(full);
    }
    return out;
  }
  const store = await readStore();
  return [...store.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface UpdateOrderDetailsInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: ShippingAddress | string | null;
  note?: string;
  status?: OrderStatus;
}

export async function updateOrderDetails(
  orderNumber: string,
  patch: UpdateOrderDetailsInput
): Promise<OrderRecord | null> {
  const key = orderNumber.trim().toUpperCase();
  const now = new Date().toISOString();

  if (db) {
    const rows = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, key)).limit(1);
    if (rows.length === 0) return null;
    const o = rows[0];

    const dbPatch: Record<string, unknown> = { updatedAt: now };
    if (patch.customerName !== undefined) dbPatch.customerName = patch.customerName;
    if (patch.customerPhone !== undefined) dbPatch.customerPhone = patch.customerPhone;
    if (patch.customerEmail !== undefined) dbPatch.customerEmail = patch.customerEmail;
    if (patch.shippingAddress !== undefined) {
      if (typeof patch.shippingAddress === "string") {
        const prev = (o.shippingAddress as ShippingAddress | null) || {
          name: o.customerName,
          phone: o.customerPhone,
          city: "Bandung",
          address: patch.shippingAddress,
        };
        dbPatch.shippingAddress = { ...prev, address: patch.shippingAddress };
      } else {
        dbPatch.shippingAddress = patch.shippingAddress;
      }
    }
    if (patch.note !== undefined) dbPatch.note = patch.note;
    if (patch.status !== undefined) dbPatch.status = patch.status;

    await db.update(schema.orders).set(dbPatch as never).where(eq(schema.orders.id, o.id));
    if (patch.status && patch.status !== o.status) {
      await db.insert(schema.orderStatusHistory).values({
        orderId: o.id,
        status: patch.status,
        note: patch.note || "Detail pesanan diperbarui oleh admin",
      });
    }
    return getOrderByNumber(key);
  }

  const store = await readStore();
  const rec = store.get(key);
  if (!rec) return null;

  if (patch.customerName !== undefined) rec.customerName = patch.customerName;
  if (patch.customerPhone !== undefined) rec.customerPhone = patch.customerPhone;
  if (patch.customerEmail !== undefined) rec.customerEmail = patch.customerEmail;
  if (patch.shippingAddress !== undefined) {
    if (typeof patch.shippingAddress === "string") {
      const prev = rec.shippingAddress || {
        name: rec.customerName,
        phone: rec.customerPhone,
        city: "Bandung",
        address: patch.shippingAddress,
      };
      rec.shippingAddress = { ...prev, address: patch.shippingAddress };
    } else {
      rec.shippingAddress = patch.shippingAddress;
    }
  }
  if (patch.note !== undefined) rec.note = patch.note;
  if (patch.status !== undefined) rec.status = patch.status;
  rec.updatedAt = now;

  store.set(key, rec);
  await writeStore(store);
  return rec;
}

export async function deleteOrder(orderNumber: string): Promise<boolean> {
  const key = orderNumber.trim().toUpperCase();
  if (db) {
    const rows = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, key)).limit(1);
    if (rows.length === 0) return false;
    const o = rows[0];
    await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
    await db.delete(schema.orderStatusHistory).where(eq(schema.orderStatusHistory.orderId, o.id));
    await db.delete(schema.orders).where(eq(schema.orders.id, o.id));
    return true;
  }

  const store = await readStore();
  const existed = store.delete(key);
  if (existed) {
    await writeStore(store);
  }
  return existed;
}

export async function bulkDeleteOrders(orderNumbers: string[]): Promise<{ deletedCount: number }> {
  let count = 0;
  for (const num of orderNumbers) {
    const ok = await deleteOrder(num);
    if (ok) count++;
  }
  return { deletedCount: count };
}
