"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatIDR } from "@/lib/constants";
import { STATUS_LABELS, type OrderRecord, type OrderStatus } from "@/lib/types";

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  draft: [],
  pending_payment: ["paid"],
  paid: ["queued"],
  queued: ["roasting"],
  roasting: ["resting"],
  resting: ["ready_pickup", "shipped"],
  ready_pickup: ["completed"],
  shipped: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

export function AdminPanel({ orders, demo }: { orders: OrderRecord[]; demo: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function update(orderNumber: string, status: OrderStatus) {
    setBusy(orderNumber);
    try {
      const res = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast.success(orderNumber + " → " + STATUS_LABELS[status]);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal update status");
    } finally {
      setBusy("");
    }
  }

  const pickupQueue = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      if (o.fulfillment === "pickup" && o.pickupDate && o.status !== "cancelled") {
        map.set(o.pickupDate, (map.get(o.pickupDate) ?? 0) + o.items.reduce((s, it) => s + it.quantity, 0));
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [orders]);

  return (
    <div>
      {demo && (
        <div className="mb-5 rounded-lg border border-gold/40 bg-accent px-5 py-3 text-sm text-accent-foreground">
          🧪 <b>Mode demo:</b> Supabase belum dikonfigurasi, jadi panel admin terbuka untuk semua. Setelah Supabase aktif,
          hanya email di <code>ADMIN_EMAILS</code> yang bisa mengakses.
        </div>
      )}

      <div className="glossy-card mb-6 rounded-2xl border border-border p-5">
        <h3 className="text-sm font-bold text-green-deep">Antrian Pickup per Tanggal</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {pickupQueue.length === 0 && <p className="text-sm text-muted-foreground">Belum ada jadwal pickup.</p>}
          {pickupQueue.map(([date, qty]) => (
            <Badge key={date} variant="outline" className="gap-1.5 bg-white">
              {date} <span className="font-bold text-primary">{qty} bungkus</span>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 && (
          <div className="glossy-card rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground">
            Belum ada pesanan. Bagikan link katalog-mu! ☕
          </div>
        )}
        {orders.map((o) => (
          <div key={o.orderNumber} className="glossy-card rounded-2xl border border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-green-deep">{o.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {o.customerName} • {o.customerPhone} •{" "}
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(o.createdAt))}
                </p>
              </div>
              <Badge variant={o.paymentStatus === "paid" ? "default" : o.status === "cancelled" ? "destructive" : "gold"}>
                {STATUS_LABELS[o.status]}
              </Badge>
            </div>

            <Separator className="my-3" />

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                {o.items.map((it, i) => (
                  <p key={i} className="text-muted-foreground">
                    • {it.quantity}x {it.coffeeName} — {it.roastProfileName} / {it.grindSize}
                  </p>
                ))}
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-primary">{formatIDR(o.total)}</p>
                <p className="text-xs text-muted-foreground">
                  {o.fulfillment === "pickup"
                    ? "Pickup: " + (o.pickupDate ?? "-") + (o.pickupSlot ? " " + o.pickupSlot : "")
                    : "Kirim: " + (o.courierCompany ?? "-") + (o.trackingNo ? " • " + o.trackingNo : "")}
                </p>
                <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
              </div>
            </div>

            {NEXT[o.status].length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-3">
                {NEXT[o.status].map((s) => (
                  <Button key={s} size="sm" variant={s === "completed" ? "default" : "outline"} disabled={busy === o.orderNumber} onClick={() => update(o.orderNumber, s)}>
                    {busy === o.orderNumber ? <Loader2 className="animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" className="text-destructive" disabled={busy === o.orderNumber} onClick={() => update(o.orderNumber, "cancelled")}>
                  Batalkan
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => router.refresh()}>
          <RotateCw className="h-4 w-4" /> Muat Ulang Data
        </Button>
      </div>
    </div>
  );
}
