import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOrderByNumber } from "@/lib/store/orders";
import { createClient as getSupabaseServer } from "@/lib/server";
import { PaymentPanel } from "@/components/payment/payment-panel";
import { StatusClient } from "@/components/order/status-client";
import { GUEST_COOKIE, canAccessOrder, parseGuestCookie } from "@/lib/order-access";
import { formatIDR } from "@/lib/constants";

export const metadata: Metadata = { title: "Pembayaran" };

export default async function PembayaranPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  if (order.paymentStatus === "paid") {
    redirect("/status/" + order.orderNumber);
  }

  const supabase = await getSupabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const cookieStore = await cookies();
  const tokens = parseGuestCookie(cookieStore.get(GUEST_COOKIE)?.value);
  const authorized = canAccessOrder(order, { userId: user?.id, guestTokens: tokens });

  if (!authorized) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <StatusClient orderNumber={order.orderNumber} authorized={false} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-deep">Pembayaran</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
          Selesaikan Pembayaran
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nomor pesanan <b className="text-primary">{order.orderNumber}</b> — bayar sebelum 60 menit agar slot roastingmu terkunci.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="glossy-card h-fit rounded-2xl border border-border p-5">
          <h3 className="text-sm font-bold text-green-deep">Ringkasan Pesanan</h3>
          <div className="mt-3 space-y-2.5 text-sm">
            {order.items.map((it, i) => (
              <div key={i} className="rounded-lg border border-border bg-white p-3">
                <p className="font-semibold">{it.coffeeName}</p>
                <p className="text-xs text-muted-foreground">
                  {it.roastProfileName} • {it.grindSize} • {it.quantity} pcs
                </p>
                <p className="mt-1 text-right text-sm font-bold">{formatIDR(it.subtotalIdr)}</p>
              </div>
            ))}
            {order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkir</span>
                <span className="font-semibold">{formatIDR(order.shippingFee)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-border/70 pt-3">
              <span className="font-bold text-green-deep">Total</span>
              <span className="text-xl font-extrabold text-primary">{formatIDR(order.total)}</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Kopi diroasting <b>setelah pembayaran terverifikasi</b>. Email konfirmasi dikirim otomatis ke{" "}
            <b>{order.customerEmail}</b>.
          </p>
        </div>

        <PaymentPanel order={order} />
      </div>
    </div>
  );
}
