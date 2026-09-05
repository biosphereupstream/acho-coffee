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

  const lineItems: { name: string; quantity: number; price: number }[] = [];
  let itemsSum = 0;

  for (const it of order.items) {
    const rawName = `${it.coffeeName} (${it.roastProfileName}, ${it.grindSize})`
      .replace(/&/g, "dan")
      .replace(/#/g, "No. ")
      .replace(/["“”„]/g, "'");
    lineItems.push({
      name: rawName,
      quantity: it.quantity,
      price: it.unitPriceIdr,
    });
    itemsSum += it.unitPriceIdr * it.quantity;
  }

  if (order.shippingFee > 0) {
    lineItems.push({
      name: `Ongkos Kirim (${order.courierCompany?.toUpperCase() ?? "Kurir"})`
        .replace(/&/g, "dan")
        .replace(/#/g, "No. "),
      quantity: 1,
      price: order.shippingFee,
    });
    itemsSum += order.shippingFee;
  }

  // Jika terdapat diskon voucher atau rincian item tidak persis sama dengan total:
  if (itemsSum !== order.total || lineItems.length === 0) {
    lineItems.length = 0;
    lineItems.push({
      name: `Pesanan Kopi ${order.orderNumber}`,
      quantity: 1,
      price: order.total,
    });
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
      lineItems,
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
