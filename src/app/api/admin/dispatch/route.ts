import { NextResponse } from "next/server";
import { assignTrackingNumber, getOrderByNumber, updateOrderStatus } from "@/lib/store/orders";
import { ensureShipment } from "@/lib/order-lifecycle";
import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";

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

  let body: {
    orderNumber?: string;
    mode?: "biteship" | "manual";
    trackingNo?: string;
    trackingUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  if (!body.orderNumber) {
    return NextResponse.json({ error: "orderNumber wajib diisi" }, { status: 400 });
  }

  const order = await getOrderByNumber(body.orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  if (body.mode === "biteship") {
    // Request Biteship pickup / shipment creation
    const shipmentOrder = await ensureShipment(order);
    const updated = await updateOrderStatus(
      order.orderNumber,
      "shipped",
      `Pickup kurir Biteship dijadwalkan. Resi: ${shipmentOrder.trackingNo ?? "Dalam proses"}`,
      {
        trackingNo: shipmentOrder.trackingNo,
        trackingUrl: shipmentOrder.trackingUrl,
      }
    );
    return NextResponse.json({
      success: true,
      order: updated ?? shipmentOrder,
      message: "Pickup kurir Biteship berhasil dijadwalkan",
    });
  }

  // Manual Tracking Number Input
  if (!body.trackingNo?.trim()) {
    return NextResponse.json({ error: "Nomor resi wajib diisi untuk mode manual" }, { status: 400 });
  }

  const trackingNo = body.trackingNo.trim();
  const trackingUrl =
    body.trackingUrl?.trim() ||
    `https://biteship.com/id/tracking?waybill=${encodeURIComponent(trackingNo)}`;

  const updated = await assignTrackingNumber(order.orderNumber, trackingNo, trackingUrl);

  return NextResponse.json({
    success: true,
    order: updated,
    message: `Resi kurir ${trackingNo} berhasil disimpan`,
  });
}
