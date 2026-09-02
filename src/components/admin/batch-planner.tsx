"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Coffee,
  Flame,
  Snowflake,
  PackageCheck,
  Tag,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GRIND_LABELS } from "@/lib/constants";
import { STATUS_LABELS, type OrderRecord, type OrderStatus } from "@/lib/types";
import { toast } from "sonner";

interface RoastingBatch {
  key: string;
  coffeeName: string;
  roastProfileName: string;
  totalBags: number;
  totalWeightKg: number;
  grindCounts: Record<string, number>;
  orders: {
    orderNumber: string;
    customerName: string;
    quantity: number;
    status: OrderStatus;
  }[];
  dominantStatus: OrderStatus;
}

export function BatchPlanner({
  orders,
  onBatchUpdated,
}: {
  orders: OrderRecord[];
  onBatchUpdated?: () => void;
}) {
  const [busyBatchKey, setBusyBatchKey] = useState<string | null>(null);

  // Group active orders by Coffee Name + Roast Profile
  const batches: RoastingBatch[] = useMemo(() => {
    const map = new Map<string, RoastingBatch>();

    // We focus on orders that are in production / queue: paid, queued, roasting, resting
    const activeOrders = orders.filter((o) =>
      ["paid", "queued", "roasting", "resting"].includes(o.status)
    );

    for (const o of activeOrders) {
      for (const it of o.items) {
        const key = `${it.coffeeName}__${it.roastProfileName}`;
        let b = map.get(key);
        if (!b) {
          b = {
            key,
            coffeeName: it.coffeeName,
            roastProfileName: it.roastProfileName,
            totalBags: 0,
            totalWeightKg: 0,
            grindCounts: {},
            orders: [],
            dominantStatus: o.status,
          };
          map.set(key, b);
        }

        b.totalBags += it.quantity;
        b.totalWeightKg += (it.quantity * 250) / 1000;
        b.grindCounts[it.grindSize] = (b.grindCounts[it.grindSize] ?? 0) + it.quantity;

        // Add order info if not already present
        const existingOrder = b.orders.find((ord) => ord.orderNumber === o.orderNumber);
        if (existingOrder) {
          existingOrder.quantity += it.quantity;
        } else {
          b.orders.push({
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            quantity: it.quantity,
            status: o.status,
          });
        }
      }
    }

    // Determine dominant status for each batch
    for (const b of map.values()) {
      if (b.orders.some((o) => o.status === "roasting")) {
        b.dominantStatus = "roasting";
      } else if (b.orders.every((o) => o.status === "resting")) {
        b.dominantStatus = "resting";
      } else {
        b.dominantStatus = "queued";
      }
    }

    return [...map.values()].sort((a, b) => b.totalBags - a.totalBags);
  }, [orders]);

  async function updateBatchStatus(batch: RoastingBatch, targetStatus: OrderStatus) {
    setBusyBatchKey(batch.key);
    try {
      const orderNumbers = batch.orders.map((o) => o.orderNumber);
      const res = await fetch("/api/admin/batch-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumbers,
          status: targetStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui status batch");

      toast.success(
        `Batch ${batch.coffeeName} berhasil diubah ke '${STATUS_LABELS[targetStatus]}' (${json.updatedCount} pesanan)`
      );
      if (onBatchUpdated) onBatchUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusyBatchKey(null);
    }
  }

  const totalBagsInRoastery = batches.reduce((s, b) => s + b.totalBags, 0);
  const totalKgInRoastery = batches.reduce((s, b) => s + b.totalWeightKg, 0);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glossy-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Batch Produksi
          </p>
          <p className="font-[var(--font-display)] text-3xl font-black text-green-deep mt-1">
            {batches.length} Batch
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dikelompokkan menurut varietas & sangrai
          </p>
        </div>

        <div className="glossy-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Kantong Kopi
          </p>
          <p className="font-[var(--font-display)] text-3xl font-black text-gold-deep mt-1">
            {totalBagsInRoastery} Kantong
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estimasi biji hijau: ~{(totalKgInRoastery * 1.18).toFixed(1)} kg
          </p>
        </div>

        <div className="glossy-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Roasted Weight
          </p>
          <p className="font-[var(--font-display)] text-3xl font-black text-primary mt-1">
            {totalKgInRoastery.toFixed(1)} kg
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kapasitas batch sangrai harian: 30.0 kg
          </p>
        </div>
      </div>

      {/* Batch Cards Grid */}
      {batches.length === 0 ? (
        <div className="glossy-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
          <p className="font-bold text-base text-foreground">Semua Batch Roasting Selesai!</p>
          <p className="text-xs mt-1">Tidak ada pesanan baru yang menunggu antrean sangrai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {batches.map((batch) => {
            const isBusy = busyBatchKey === batch.key;
            const batchOrderQuery = batch.orders.map((o) => o.orderNumber).join(",");

            return (
              <div
                key={batch.key}
                className="glossy-card rounded-2xl border border-border p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Coffee & Profile */}
                  <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-gold-deep shrink-0" />
                        <h4 className="font-[var(--font-display)] text-lg font-extrabold text-green-deep">
                          {batch.coffeeName}
                        </h4>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground mt-0.5">
                        Profil: <span className="text-foreground">{batch.roastProfileName}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant={
                          batch.dominantStatus === "roasting"
                            ? "gold"
                            : batch.dominantStatus === "resting"
                            ? "outline"
                            : "default"
                        }
                        className="text-xs font-bold"
                      >
                        {batch.dominantStatus === "roasting" && "🔥 Sedang Di-Roast"}
                        {batch.dominantStatus === "resting" && "❄️ Fase Resting"}
                        {batch.dominantStatus === "queued" && "⏳ Antrean Sangrai"}
                      </Badge>
                      <p className="font-mono text-xs font-extrabold text-foreground mt-1">
                        {batch.totalBags} bags ({batch.totalWeightKg.toFixed(2)} kg)
                      </p>
                    </div>
                  </div>

                  {/* Grind Size Distribution */}
                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Rincian Gilingan untuk Batch Ini:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(batch.grindCounts).map(([grind, count]) => (
                        <span
                          key={grind}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-xs font-semibold"
                        >
                          <span className="text-muted-foreground">{GRIND_LABELS[grind] || grind}:</span>
                          <b className="text-primary">{count} bungkus</b>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Associated Orders List */}
                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Daftar Pesanan ({batch.orders.length} pemesan):
                    </p>
                    <div className="max-h-28 overflow-y-auto space-y-1 text-xs pr-1">
                      {batch.orders.map((ord) => (
                        <div
                          key={ord.orderNumber}
                          className="flex items-center justify-between py-1 border-b border-border/40 text-muted-foreground"
                        >
                          <span className="font-mono font-bold text-foreground">{ord.orderNumber}</span>
                          <span>{ord.customerName}</span>
                          <span className="font-semibold text-primary">{ord.quantity}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Batch Action Buttons */}
                <div className="mt-6 pt-4 border-t border-border/80 flex flex-wrap items-center justify-between gap-3">
                  <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-bold">
                    <Link href={`/admin/print/bag-labels?orders=${encodeURIComponent(batchOrderQuery)}`}>
                      <Tag className="h-3.5 w-3.5 text-gold-deep" /> Cetak Stiker Batch
                    </Link>
                  </Button>

                  <div className="flex items-center gap-2">
                    {batch.dominantStatus !== "roasting" && (
                      <Button
                        size="sm"
                        variant="gold"
                        disabled={isBusy}
                        onClick={() => updateBatchStatus(batch, "roasting")}
                        className="gap-1.5 text-xs font-bold"
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
                        Mulai Roasting Batch
                      </Button>
                    )}

                    {batch.dominantStatus === "roasting" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => updateBatchStatus(batch, "resting")}
                        className="gap-1.5 text-xs font-bold border-cyan-500/50 text-cyan-700 bg-cyan-50/50 hover:bg-cyan-100"
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Snowflake className="h-3.5 w-3.5" />}
                        Pindah ke Resting
                      </Button>
                    )}

                    {batch.dominantStatus === "resting" && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isBusy}
                        onClick={() => updateBatchStatus(batch, "ready_pickup")}
                        className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
                        Selesai Resting & Siap Kemas
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
