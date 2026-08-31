import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/store/orders";
import { verifyDokuNotification, type DokuNotifyPayload } from "@/lib/payments/doku";
import { env } from "@/lib/env";
import { markOrderPaid } from "@/lib/order-lifecycle";

export async function POST(req: Request) {
  const raw = await req.text();
  const clientId = req.headers.get("client-id") ?? "";
  const timestamp = req.headers.get("request-timestamp") ?? "";
  const signature = req.headers.get("signature") ?? "";

  // Verifikasi signature hanya bila Doku terkonfigurasi
  if (env.doku.configured()) {
    if (!verifyDokuNotification(clientId, timestamp, raw, signature)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let payload: DokuNotifyPayload;
  try {
    payload = JSON.parse(raw) as DokuNotifyPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const invoice = payload.order?.invoice_number;
  if (!invoice) return NextResponse.json({ error: "no invoice" }, { status: 400 });

  const order = await getOrderByNumber(invoice);
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.paymentStatus === "paid") return NextResponse.json({ ok: true });

  const status = (payload.transaction?.status ?? payload.order?.status ?? "").toUpperCase();
  const resultCode = (payload.order?.result_code ?? "").toUpperCase();

  if (["SUCCESS", "COMPLETED", "PAID", "0000"].includes(status) || resultCode === "SUCCESS") {
    await markOrderPaid(order);
  } else if (["FAILED", "EXPIRED", "CANCELED"].includes(status)) {
    const { updateOrderStatus } = await import("@/lib/store/orders");
    await updateOrderStatus(order.orderNumber, "pending_payment", "Pembayaran gagal/kedaluwarsa", {
      paymentStatus: "failed",
    });
  }

  return NextResponse.json({ ok: true });
}
