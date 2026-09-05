import { NextResponse } from "next/server";
import { findOrderByTracking, updateOrderStatus } from "@/lib/store/orders";
import { emails } from "@/lib/email";

const SHIPPED_STATUSES = ["picked", "on process", "on_process", "in transit", "in_transit", "processed"];
const DELIVERED_STATUSES = ["delivered", "completed"];

export async function POST(req: Request) {
  let body: {
    status?: string;
    waybill_id?: string;
    courier_waybill_id?: string;
    order_id?: string;
    courier_company?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const waybill = body.waybill_id ?? body.courier_waybill_id ?? "";
  const order = await findOrderByTracking(waybill);
  if (!order) return NextResponse.json({ ok: true, ignored: true });

  const status = (body.status ?? "").toLowerCase().trim();

  if (DELIVERED_STATUSES.includes(status) && order.status !== "delivered" && order.status !== "completed") {
    const updated = await updateOrderStatus(order.orderNumber, "delivered", "Paket diterima — terima kasih sudah memesan! ☕");
    if (updated) await emails.statusUpdate(updated, "delivered", "Paket kopimu sudah sampai. Selamat menikmati!").catch(() => {});
  } else if (SHIPPED_STATUSES.includes(status) && ["paid", "queued", "roasting", "resting"].includes(order.status)) {
    const updated = await updateOrderStatus(order.orderNumber, "shipped", "Paket dijemput kurir " + (body.courier_company ?? order.courierCompany ?? ""));
    if (updated) await emails.statusUpdate(updated, "shipped", "Paketmu sedang dalam perjalanan.").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
