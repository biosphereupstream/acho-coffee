import { NextResponse } from "next/server";
import { batchUpdateOrderStatus } from "@/lib/store/orders";
import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";
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
  paid: "Pembayaran diverifikasi manual oleh roaster",
  queued: "Batch masuk antrian roasting",
  roasting: "Batch biji kopi sedang dipanggang 🔥",
  resting: "Batch kopi masuk fase resting untuk degassing optimal ❄️",
  ready_pickup: "Batch kopi selesai dikemas dan siap diambil / diserahkan",
  shipped: "Batch diserahkan ke kurir pengiriman 🚚",
  delivered: "Paket pesanan telah sampai di tujuan",
  completed: "Batch pesanan selesai",
  cancelled: "Pesanan dibatalkan",
};

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const isAdmin = user?.email ? env.adminEmails().includes(user.email.toLowerCase()) : false;
  const isDevBypass =
    process.env.NODE_ENV === "development" &&
    (req.headers.get("x-admin") === "true" || !env.supabaseConfigured());

  if (!isAdmin && !isDevBypass && env.supabaseConfigured()) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  let body: { orderNumbers?: string[]; status?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  if (!Array.isArray(body.orderNumbers) || body.orderNumbers.length === 0) {
    return NextResponse.json({ error: "orderNumbers harus berupa array dan tidak boleh kosong" }, { status: 400 });
  }

  if (!body.status || !ALLOWED.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const targetStatus = body.status as OrderStatus;
  const note = body.note || NOTES[targetStatus] || "Status diperbarui via Batch Roasting Planner";

  const result = await batchUpdateOrderStatus(body.orderNumbers, targetStatus, note);

  return NextResponse.json({
    success: true,
    updatedCount: result.updatedCount,
    status: targetStatus,
  });
}
