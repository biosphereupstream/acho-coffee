import { NextResponse } from "next/server";
import { getOrderByNumber, updateOrderStatus } from "@/lib/store/orders";
import { checkAdminAuth } from "@/lib/admin-auth";
import { emails } from "@/lib/email";
import { ensureShipment } from "@/lib/order-lifecycle";
import type { OrderStatus } from "@/lib/types";

const ALLOWED: OrderStatus[] = [
  "paid",
  "queued",
  "roasting",
  "resting",
  "ready_pickup",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
];

const NOTES: Record<string, string> = {
  paid: "Pembayaran diverifikasi manual oleh admin",
  queued: "Masuk antrian roasting hari ini",
  roasting: "Biji kopi sedang dipanggang 🔥",
  resting: "Kopi di-resting untuk degassing optimal",
  ready_pickup: "Kopi siap diambil di roastery — bawa nomor pesananmu!",
  shipped: "Paket diserahkan ke kurir",
  delivered: "Paket telah diterima",
  completed: "Pesanan selesai — selamat menikmati! ☕",
  cancelled: "Pesanan dibatalkan",
};

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  let body: { orderNumber?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const status = body.status as OrderStatus;
  if (!body.orderNumber || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const order = await getOrderByNumber(body.orderNumber);
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  let updated = await updateOrderStatus(order.orderNumber, status, NOTES[status]);
  if (!updated) return NextResponse.json({ error: "Gagal update" }, { status: 500 });

  if (status === "shipped") {
    updated = await ensureShipment(updated);
  }
  await emails.statusUpdate(updated, status, NOTES[status]).catch(() => {});

  return NextResponse.json({ order: updated });
}
