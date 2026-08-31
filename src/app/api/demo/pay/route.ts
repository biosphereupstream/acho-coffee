import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/store/orders";
import { env } from "@/lib/env";
import { markOrderPaid } from "@/lib/order-lifecycle";

/** Simulasi pembayaran berhasil — hanya aktif di mode demo (Doku belum dikonfigurasi). */
export async function POST(req: Request) {
  if (env.doku.configured()) {
    return NextResponse.json({ error: "Tidak tersedia — Doku aktif" }, { status: 403 });
  }

  let body: { orderNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const order = await getOrderByNumber(body.orderNumber ?? "");
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Sudah dibayar" }, { status: 400 });
  }

  await markOrderPaid(order);
  return NextResponse.json({ ok: true });
}
