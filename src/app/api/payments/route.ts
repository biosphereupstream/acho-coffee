import { NextResponse } from "next/server";
import { getOrderByNumber, updateOrderStatus } from "@/lib/store/orders";
import { createDokuPayment, DOKU_CHANNELS, type DokuChannel } from "@/lib/payments/doku";

export async function POST(req: Request) {
  let body: { orderNumber?: string; channel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const channel = DOKU_CHANNELS.find((c) => c.id === body.channel)?.id as DokuChannel | undefined;
  if (!body.orderNumber || !channel) {
    return NextResponse.json({ error: "orderNumber & channel wajib diisi" }, { status: 400 });
  }

  const order = await getOrderByNumber(body.orderNumber);
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Pesanan ini sudah dibayar" }, { status: 400 });
  }

  let result;
  try {
    result = await createDokuPayment({
      invoiceNumber: order.orderNumber,
      amount: order.total,
      channel,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      lineItems: order.items.map((it) => ({
        name: it.coffeeName + " (" + it.roastProfileName + ", " + it.grindSize + ")",
        quantity: it.quantity,
        price: it.unitPriceIdr,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal membuat pembayaran. Coba lagi sebentar." },
      { status: 502 }
    );
  }

  await updateOrderStatus(order.orderNumber, order.status, "Metode pembayaran dipilih: " + channel, {
    dokuPaymentId: result.paymentId,
    dokuChannel: channel,
  });

  return NextResponse.json({ payment: result });
}
