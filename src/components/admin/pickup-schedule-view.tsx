"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Tag,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateID, GRIND_LABELS } from "@/lib/constants";
import { STATUS_LABELS, type OrderRecord } from "@/lib/types";
import { toast } from "sonner";

const DAILY_CAPACITY = 120; // 120 bags per day capacity

interface PickupDayGroup {
  date: string;
  formattedDate: string;
  totalBags: number;
  orders: OrderRecord[];
}

export function PickupScheduleView({
  orders,
  onOrderUpdated,
}: {
  orders: OrderRecord[];
  onOrderUpdated?: () => void;
}) {
  const [busyOrder, setBusyOrder] = useState<string | null>(null);

  const groups: PickupDayGroup[] = useMemo(() => {
    const map = new Map<string, PickupDayGroup>();

    const pickupOrders = orders.filter(
      (o) => o.fulfillment === "pickup" && o.pickupDate && o.status !== "cancelled"
    );

    for (const o of pickupOrders) {
      const d = o.pickupDate!;
      let g = map.get(d);
      if (!g) {
        g = {
          date: d,
          formattedDate: formatDateID(new Date(d)),
          totalBags: 0,
          orders: [],
        };
        map.set(d, g);
      }
      const bagCount = o.items.reduce((s, it) => s + it.quantity, 0);
      g.totalBags += bagCount;
      g.orders.push(o);
    }

    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  async function markCompleted(orderNumber: string) {
    setBusyOrder(orderNumber);
    try {
      const res = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status: "completed" }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      toast.success(`Pesanan ${orderNumber} ditandai selesai diambil!`);
      if (onOrderUpdated) onOrderUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glossy-card rounded-2xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-green-deep flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold-deep" /> Jadwal Pengambilan di Roastery
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pelanggan yang memilih self-pickup langsung di ACHO Roastery Lab Bandung.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-bold px-3 py-1">
            Kapasitas Harian: {DAILY_CAPACITY} Kantong
          </Badge>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glossy-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="font-bold text-base text-foreground">Belum Ada Jadwal Pickup</p>
          <p className="text-xs mt-1">
            Pesanan dengan metode ambil di tempat akan otomatis terjadwal di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const usagePercent = Math.min(Math.round((group.totalBags / DAILY_CAPACITY) * 100), 100);

            return (
              <div key={group.date} className="glossy-card rounded-2xl border border-border p-5 sm:p-6">
                {/* Day Header & Capacity Meter */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4 gap-3">
                  <div>
                    <span className="font-[var(--font-display)] text-lg font-black text-green-deep">
                      {group.formattedDate}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Total Pesanan: <b>{group.orders.length} pesanan</b> ({group.totalBags} kantong kopi)
                    </p>
                  </div>

                  {/* Quota Progress Bar */}
                  <div className="w-full sm:w-56 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-muted-foreground">Kuota Terpakai:</span>
                      <span className="text-primary">{group.totalBags} / {DAILY_CAPACITY} ({usagePercent}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full transition-all ${
                          usagePercent > 80 ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Orders List for This Day */}
                <div className="mt-4 divide-y divide-border/50">
                  {group.orders.map((o) => {
                    const isBusy = busyOrder === o.orderNumber;
                    const isCompleted = o.status === "completed";

                    return (
                      <div
                        key={o.orderNumber}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold text-foreground">
                              {o.orderNumber}
                            </span>
                            <Badge
                              variant={
                                isCompleted
                                  ? "default"
                                  : o.status === "ready_pickup"
                                  ? "gold"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {STATUS_LABELS[o.status]}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 text-foreground font-semibold">
                              <User className="h-3.5 w-3.5 text-muted-foreground" /> {o.customerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {o.customerPhone}
                            </span>
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <Clock className="h-3.5 w-3.5 text-primary" /> {o.pickupSlot || "14:00 - 17:00"}
                            </span>
                          </div>

                          <div className="text-xs text-muted-foreground pt-0.5">
                            {o.items.map((it, idx) => (
                              <span key={idx} className="mr-2 inline-block">
                                • {it.quantity}x {it.coffeeName} ({GRIND_LABELS[it.grindSize] || it.grindSize})
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button variant="outline" size="sm" asChild className="gap-1 text-xs h-7">
                            <Link href={`/admin/print/bag-labels?order=${o.orderNumber}`}>
                              <Tag className="h-3 w-3 text-gold-deep" /> Stiker
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs h-7 text-muted-foreground">
                            <Link href={`/faktur/${o.orderNumber}`}>
                              <FileText className="h-3 w-3" /> Faktur
                            </Link>
                          </Button>

                          {!isCompleted && (
                            <Button
                              size="sm"
                              variant="gold"
                              disabled={isBusy}
                              onClick={() => markCompleted(o.orderNumber)}
                              className="gap-1 text-xs h-7 font-bold"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Sudah Diambil
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
