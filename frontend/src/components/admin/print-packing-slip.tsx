"use client";

import Link from "next/link";
import { ArrowLeft, Printer, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GRIND_LABELS } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";

export function PrintPackingSlipView({ order }: { order: OrderRecord }) {
  function handlePrint() {
    window.print();
  }

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  const totalBags = order.items.reduce((s, it) => s + it.quantity, 0);
  const totalWeightGram = totalBags * 250;
  const trackingNumber = order.trackingNo || `RESI-PENDING-${order.orderNumber}`;

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 print:bg-white print:p-0">
      {/* Top Action Bar */}
      <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between print:hidden">
        <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-semibold">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Admin
          </Link>
        </Button>
        <Button onClick={handlePrint} variant="gold" size="sm" className="gap-1.5 font-bold shadow-sm">
          <Printer className="h-4 w-4" /> Cetak Surat Jalan / Packing Slip
        </Button>
      </div>

      {/* Slip Container */}
      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-neutral-300 bg-white p-6 sm:p-8 shadow-sm print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none text-black">
        {/* Header with Expedition Badge */}
        <div className="flex flex-wrap items-start justify-between border-b-2 border-black pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-[var(--font-display)] text-xl font-black tracking-wider text-black">
                BIOSPHERE ROAST WORKS
              </span>
              <span className="rounded bg-black px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                SURAT JALAN / RESI
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Jl. Dago No. 128, Bandung • 0812-3456-7890
            </p>
          </div>

          <div className="text-right">
            <span className="rounded border-2 border-black px-3 py-1 font-mono text-sm font-black uppercase">
              {order.courierCompany?.toUpperCase() ?? "KURIR REGULER"}
            </span>
            <p className="text-[11px] font-bold text-neutral-800 mt-1">
              ONGKIR LUNAS (CASHLESS)
            </p>
          </div>
        </div>

        {/* Barcode & Tracking Box */}
        <div className="my-5 rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-center">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            Nomor Resi / Waybill
          </p>
          <p className="font-mono text-xl font-black tracking-wider text-black mt-0.5">
            {trackingNumber}
          </p>
          {/* Simulated Courier Barcode */}
          <div className="mx-auto my-2 flex h-10 w-64 items-center justify-center space-x-1">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="h-full bg-black"
                style={{
                  width: i % 3 === 0 ? "3px" : i % 5 === 0 ? "4px" : "1.5px",
                  opacity: i % 7 === 0 ? 0.4 : 1,
                }}
              />
            ))}
          </div>
          <p className="text-[10px] font-mono text-neutral-500">
            Order Ref: {order.orderNumber} • {formattedDate}
          </p>
        </div>

        {/* Sender & Recipient Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-neutral-300 pb-5 text-xs">
          <div className="rounded-lg border border-neutral-200 p-3">
            <p className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">
              Pengirim:
            </p>
            <p className="font-bold text-sm text-black mt-1">Biosphere Roast Works</p>
            <p className="text-neutral-700">0812-3456-7890</p>
            <p className="text-neutral-600 mt-1">
              Sumur Bandung, Kota Bandung, Jawa Barat 40111
            </p>
          </div>

          <div className="rounded-lg border-2 border-black p-3 bg-neutral-50/50">
            <p className="font-black text-black uppercase tracking-wider text-[10px]">
              Penerima:
            </p>
            <p className="font-black text-base text-black mt-1">
              {order.shippingAddress?.name || order.customerName}
            </p>
            <p className="font-bold text-neutral-900">
              {order.shippingAddress?.phone || order.customerPhone}
            </p>
            <p className="text-neutral-800 font-medium mt-1 leading-relaxed">
              {order.shippingAddress?.address || "Alamat belum diatur"}
            </p>
            <p className="text-neutral-700 font-semibold">
              {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
            </p>
          </div>
        </div>

        {/* Package Checklist for Warehouse Packer */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-black uppercase tracking-wider text-xs flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4" /> Checklist Isi Paket ({totalBags} Kantong / {totalWeightGram}g)
            </p>
            <span className="text-[10px] text-neutral-500 font-medium">Beri centang saat packing</span>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-neutral-300">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 font-bold">
                <th className="py-2 px-3 w-10 text-center">Cek</th>
                <th className="py-2 px-3">Item Kopi</th>
                <th className="py-2 px-3">Profil Sangrai</th>
                <th className="py-2 px-3">Gilingan</th>
                <th className="py-2 px-3 text-center">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-block h-4 w-4 rounded border-2 border-black" />
                  </td>
                  <td className="py-2.5 px-3 font-bold">{it.coffeeName}</td>
                  <td className="py-2.5 px-3 font-medium">{it.roastProfileName}</td>
                  <td className="py-2.5 px-3">{GRIND_LABELS[it.grindSize] || it.grindSize}</td>
                  <td className="py-2.5 px-3 text-center font-black">{it.quantity}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Special Instructions & Signature */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-neutral-300 pt-4 text-xs">
          <div>
            <p className="font-bold text-neutral-500 text-[10px] uppercase">Catatan Khusus:</p>
            <p className="text-neutral-800 italic mt-0.5">
              {order.note ? `"${order.note}"` : "Kopi segar roasted to order. Jauhkan dari panas berlebih."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-500">Petugas Roastery / Packer:</p>
            <div className="mt-4 border-b border-dashed border-neutral-400 w-32 ml-auto" />
            <p className="text-[10px] text-neutral-400 mt-1">Tanda Tangan & Nama Terang</p>
          </div>
        </div>
      </div>
    </div>
  );
}
