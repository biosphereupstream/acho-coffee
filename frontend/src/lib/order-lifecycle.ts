import "server-only";
import { updateOrderStatus } from "@/lib/store/orders";
import { createShipment, defaultCourierCode } from "@/lib/shipping/biteship";
import { emails } from "@/lib/email";
import type { OrderRecord } from "@/lib/types";

/** Pastikan order pengiriman (Biteship) dibuat untuk pesanan delivery. */
export async function ensureShipment(order: OrderRecord): Promise<OrderRecord> {
  if (order.fulfillment !== "delivery" || order.trackingNo || !order.shippingAddress) return order;
  try {
    const dest = order.shippingAddress;
    const ship = await createShipment({
      orderNumber: order.orderNumber,
      destination: {
        name: dest.name,
        phone: dest.phone,
        email: order.customerEmail,
        address: dest.address,
        city: dest.city,
        postalCode: dest.postalCode,
        areaId: dest.areaId ?? "IDJKTBES0000",
      },
      courierCompany: order.courierCompany ?? "jne",
      courierCode: defaultCourierCode(order.courierCompany ?? "jne"),
      items: order.items.map((it) => ({
        name: it.coffeeName,
        value: it.unitPriceIdr,
        weight: 250,
        quantity: it.quantity,
      })),
    });
    const updated = await updateOrderStatus(order.orderNumber, order.status, "Kurir dipesan: " + ship.courierCompany, {
      trackingNo: ship.trackingNo,
      trackingUrl: ship.trackingUrl,
    });
    return updated ?? order;
  } catch (e) {
    console.error("[shipment] gagal membuat order Biteship:", e);
    return order;
  }
}

/** Tandai pesanan lunas + email + booking kurir untuk pengiriman. */
export async function markOrderPaid(order: OrderRecord): Promise<OrderRecord> {
  const updated = await updateOrderStatus(
    order.orderNumber,
    "paid",
    "Pembayaran diterima — masuk antrian roasting",
    { paymentStatus: "paid", paidAt: new Date().toISOString() }
  );
  if (!updated) return order;
  await emails.paymentSuccess(updated).catch(() => {});
  await ensureShipment(updated);
  return updated;
}
