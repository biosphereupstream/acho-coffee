"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GRIND_LABELS } from "@/lib/constants";
import { COFFEES } from "@/data/coffees";
import type { OrderRecord } from "@/lib/types";

interface BagLabelItem {
  orderNumber: string;
  customerName: string;
  coffeeName: string;
  roastProfileName: string;
  grindSize: string;
  roastDate: string;
  origin?: string;
  process?: string;
  tastingNotes?: string[];
  labelIndex: number;
  totalForBatch: number;
}

export function PrintBagLabelsView({ orders }: { orders: OrderRecord[] }) {
  const items: BagLabelItem[] = [];

  for (const o of orders) {
    const roastDate = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(o.createdAt));

    for (const it of o.items) {
      const match = COFFEES.find(
        (c) => c.name.toLowerCase().includes(it.coffeeName.toLowerCase()) || it.coffeeName.toLowerCase().includes(c.name.toLowerCase())
      );

      for (let i = 0; i < it.quantity; i++) {
        items.push({
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          coffeeName: it.coffeeName,
          roastProfileName: it.roastProfileName,
          grindSize: it.grindSize,
          roastDate,
          origin: match ? `${match.region}, ${match.origin}` : "Indonesia Single Origin",
          process: match?.process ?? "Specialty Process",
          tastingNotes: match?.tastingNotes ?? ["Rich Body", "Sweet Caramel", "Balanced"],
          labelIndex: i + 1,
          totalForBatch: it.quantity,
        });
      }
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 print:bg-white print:p-0">
      {/* Top Action Bar */}
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
        <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-semibold">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Admin
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">
            Total Label: <b>{items.length} stiker</b>
          </span>
          <Button onClick={handlePrint} variant="gold" size="sm" className="gap-1.5 font-bold shadow-sm">
            <Printer className="h-4 w-4" /> Cetak Stiker (100x75mm)
          </Button>
        </div>
      </div>

      {/* Printable Stickers Container */}
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 print:m-0 print:block print:w-full">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="w-[380px] h-[285px] rounded-xl border-2 border-dashed border-neutral-300 bg-white p-5 shadow-sm print:m-0 print:h-[75mm] print:w-[100mm] print:rounded-none print:border-none print:p-4 print:shadow-none print:break-after-page text-black flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-300 pb-2">
              <div>
                <p className="font-[var(--font-display)] text-sm font-black tracking-wider text-black">
                  ACHO COFFEE ROASTERY
                </p>
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                  Micro-Roast Specialty • 250g
                </p>
              </div>
              <div className="text-right">
                <span className="rounded bg-black px-1.5 py-0.5 font-mono text-[9px] font-bold text-white uppercase">
                  {it.orderNumber}
                </span>
                <p className="text-[9px] text-neutral-500 mt-0.5">
                  Bag {it.labelIndex} / {it.totalForBatch}
                </p>
              </div>
            </div>

            {/* Coffee Info */}
            <div className="py-2 space-y-1">
              <h2 className="font-[var(--font-display)] text-lg font-black leading-tight tracking-tight uppercase text-black">
                {it.coffeeName}
              </h2>
              <p className="text-[10px] text-neutral-600 font-medium">
                {it.origin} • {it.process}
              </p>

              {/* Badges for Roast & Grind */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="rounded-md border border-black bg-neutral-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  {it.roastProfileName}
                </span>
                <span className="rounded-md border border-neutral-400 px-2 py-0.5 text-[10px] font-bold text-neutral-800">
                  {GRIND_LABELS[it.grindSize] || it.grindSize}
                </span>
              </div>

              {/* Tasting Notes */}
              {it.tastingNotes && it.tastingNotes.length > 0 && (
                <p className="text-[10px] text-neutral-700 italic pt-1 font-serif">
                  Notes: {it.tastingNotes.join(" • ")}
                </p>
              )}
            </div>

            {/* Footer / QR & Roast Date */}
            <div className="flex items-end justify-between border-t border-neutral-300 pt-2 text-[9px]">
              <div>
                <p className="font-semibold text-neutral-900">
                  Tgl Sangrai: <span className="font-black underline">{it.roastDate}</span>
                </p>
                <p className="text-neutral-500">
                  Untuk: <b>{it.customerName}</b>
                </p>
                <p className="text-[8px] text-neutral-400">Best consumed: 7 - 45 hari dari tgl sangrai</p>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="text-right text-[8px] text-neutral-500">
                  <span>Scan Status</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    `https://acho.coffee/status/${it.orderNumber}`
                  )}`}
                  alt="QR Code"
                  className="h-9 w-9 border border-neutral-200 rounded"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
