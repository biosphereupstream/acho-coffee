"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/order/status-timeline";
import { formatIDR } from "@/lib/constants";
import { STATUS_LABELS, type OrderRecord } from "@/lib/types";
import { toast } from "sonner";

export function StatusClient({
  orderNumber,
  order: initialOrder,
  authorized,
}: {
  orderNumber: string;
  order?: OrderRecord;
  authorized: boolean;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");

  const { data: order } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: async () => {
      const res = await fetch("/api/orders/" + orderNumber, { cache: "no-store" });
      if (!res.ok) throw new Error("unauthorized");
      const json = await res.json();
      return json.order as OrderRecord;
    },
    initialData: authorized ? initialOrder : undefined,
    refetchInterval: (query) => {
      const o = query.state.data;
      if (!o) return false;
      return ["completed", "cancelled", "delivered"].includes(o.status) ? false : 8000;
    },
    retry: false,
    enabled: authorized,
  });

  const { data: tracking } = useQuery({
    queryKey: ["tracking", order?.trackingNo],
    queryFn: async () => {
      const res = await fetch("/api/shipping/track?waybill=" + encodeURIComponent(order?.trackingNo ?? ""));
      if (!res.ok) throw new Error("gagal");
      return res.json() as Promise<{ status: string; history: { note: string; updatedAt: string; status: string }[] }>;
    },
    enabled: authorized && Boolean(order?.trackingNo),
    refetchInterval: 30000,
  });

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Tersalin ke clipboard"),
      () => toast.error("Gagal menyalin")
    );
  }

  if (!authorized || !order) {
    return (
      <div className="glossy-card mx-auto max-w-md rounded-2xl border border-border p-8 text-center">
        <KeyRound className="mx-auto h-10 w-10 text-gold-deep" />
        <h2 className="mt-4 font-[var(--font-display)] text-xl font-bold text-green-deep">Verifikasi Akses</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Untuk melihat pesanan <b>{orderNumber}</b>, masukkan token yang kami kirim ke emailmu saat memesan.
        </p>
        <div className="mt-5 flex gap-2">
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token dari email" />
          <Button
            variant="gold"
            onClick={() => token.trim() && router.push("/status/" + orderNumber + "?t=" + encodeURIComponent(token.trim()))}
          >
            Buka
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Atau <Link href="/masuk" className="font-semibold text-primary underline">masuk</Link> dengan akun yang dipakai saat memesan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="glossy-card rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nomor Pesanan</p>
            <p className="text-lg font-extrabold text-green-deep">{order.orderNumber}</p>
          </div>
          <Badge variant={order.paymentStatus === "paid" ? "default" : order.status === "cancelled" ? "destructive" : "gold"}>
            {STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {order.paymentStatus !== "paid" && order.status === "pending_payment" && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/40 bg-accent/60 px-4 py-3">
            <p className="text-sm font-semibold text-accent-foreground">Pesanan menunggu pembayaran sebesar {formatIDR(order.total)}</p>
            <Button size="sm" variant="gold" asChild>
              <Link href={"/pembayaran/" + order.orderNumber}>Bayar Sekarang</Link>
            </Button>
          </div>
        )}

        <div className="mt-6">
          <StatusTimeline order={order} />
        </div>

        {order.trackingNo && (
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-green-deep">🚚 Tracing Kurir — {order.courierCompany?.toUpperCase() ?? "Kurir"}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyText(order.trackingNo ?? "")}>
                  <Copy className="h-3.5 w-3.5" /> {order.trackingNo}
                </Button>
                {order.trackingUrl && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Lacak
                    </a>
                  </Button>
                )}
              </div>
            </div>
            {tracking && tracking.history.length > 0 && (
              <ol className="mt-3 space-y-2">
                {tracking.history.slice(0, 5).map((h, i) => (
                  <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full metal-gold" />
                    <span>
                      {h.note} —{" "}
                      {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(
                        new Date(h.updatedAt)
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="glossy-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-bold text-green-deep">Detail Pesanan</h3>
          <div className="mt-3 space-y-3 text-sm">
            {order.items.map((it, i) => (
              <div key={i} className="rounded-lg border border-border bg-white p-3">
                <p className="font-semibold">{it.coffeeName}</p>
                <p className="text-xs text-muted-foreground">
                  {it.roastProfileName} • {it.grindSize} • {it.quantity} x {formatIDR(it.unitPriceIdr)}
                </p>
              </div>
            ))}
            <div className="flex justify-between border-t border-border/70 pt-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatIDR(order.subtotal)}</span>
            </div>
            {order.shippingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ongkir</span>
                <span className="font-semibold">{formatIDR(order.shippingFee)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-border/70 pt-3">
              <span className="font-bold text-green-deep">Total</span>
              <span className="text-lg font-extrabold text-primary">{formatIDR(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="glossy-card rounded-2xl border border-border p-5 text-sm">
          <h3 className="text-sm font-bold text-green-deep">Informasi</h3>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>👤 {order.customerName}</p>
            {order.fulfillment === "pickup" ? (
              <p>
                🏠 Ambil:{" "}
                <b className="text-foreground">
                  {order.pickupDate
                    ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(
                        new Date(order.pickupDate + "T00:00:00")
                      )
                    : "-"}
                  {order.pickupSlot ? ", " + order.pickupSlot : ""}
                </b>
              </p>
            ) : (
              <p>
                🚚 Kirim ke: <b className="text-foreground">{order.shippingAddress?.address}, {order.shippingAddress?.city}</b>
              </p>
            )}
            <p>
              📅 Dibuat:{" "}
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}
            </p>
            {order.note && <p>📝 “{order.note}”</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
