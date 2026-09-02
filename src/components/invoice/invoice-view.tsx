"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Coffee, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDateID, GRIND_LABELS } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";

export function InvoiceView({ order }: { order: OrderRecord }) {
  function handlePrint() {
    window.print();
  }

  const isPaid = order.paymentStatus === "paid" || ["paid", "queued", "roasting", "resting", "ready_pickup", "shipped", "delivered", "completed"].includes(order.status);
  const formattedOrderDate = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  const statusUrl = typeof window !== "undefined"
    ? `${window.location.origin}/status/${order.orderNumber}`
    : `/status/${order.orderNumber}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Top Action Bar (Hidden during Print) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-semibold">
          <Link href={`/status/${order.orderNumber}`}>
            <ArrowLeft className="h-4 w-4" /> Kembali ke Status Pesanan
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="gold" size="sm" className="gap-1.5 font-bold shadow-sm">
            <Printer className="h-4 w-4" /> Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document Container */}
      <div
        id="invoice-document"
        className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm print:border-none print:p-0 print:shadow-none print:bg-white text-foreground"
      >
        {/* Header: Brand & Invoice Meta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-border/80 pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg">
                A
              </div>
              <span className="font-[var(--font-display)] text-2xl font-black tracking-wider text-green-deep">
                ACHO COFFEE
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Micro Roastery & Specialty Coffee Artisans
            </p>
            <p className="text-xs text-muted-foreground">
              Jl. Dago No. 128, Bandung • roastery@acho.coffee
            </p>
          </div>

          <div className="sm:text-right">
            <Badge variant="outline" className="text-xs tracking-wider uppercase font-bold px-2.5 py-0.5 border-primary/40 text-primary">
              Faktur Resmi
            </Badge>
            <p className="mt-2 font-mono text-xl font-black text-green-deep">
              {order.orderNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tanggal: {formattedOrderDate}
            </p>
            <div className="mt-2 flex items-center sm:justify-end gap-1.5">
              {isPaid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> LUNAS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  MENUNGGU PEMBAYARAN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer & Fulfillment Info */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs border-b border-border/80 pb-6">
          <div>
            <p className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
              Dipesan Oleh
            </p>
            <p className="mt-1.5 font-bold text-sm text-foreground">{order.customerName}</p>
            <p className="text-muted-foreground">{order.customerEmail}</p>
            <p className="text-muted-foreground">{order.customerPhone}</p>
            {order.note && (
              <p className="mt-2 text-muted-foreground italic bg-secondary/50 p-2 rounded-lg text-[11px]">
                Catatan: &ldquo;{order.note}&rdquo;
              </p>
            )}
          </div>

          <div>
            <p className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
              {order.fulfillment === "pickup" ? "Metode Pengambilan" : "Alamat Pengiriman"}
            </p>
            {order.fulfillment === "pickup" ? (
              <div className="mt-1.5 space-y-1">
                <p className="font-bold text-sm text-foreground">Ambil Sendiri di Roastery</p>
                <p className="text-muted-foreground">
                  Tanggal:{" "}
                  <span className="font-semibold text-foreground">
                    {order.pickupDate ? formatDateID(new Date(order.pickupDate)) : "Sesuai jadwal"}
                  </span>
                </p>
                <p className="text-muted-foreground">Slot: {order.pickupSlot ?? "14:00 - 17:00 WIB"}</p>
                <p className="text-[11px] text-muted-foreground">Lokasi: ACHO Roastery Lab, Bandung</p>
              </div>
            ) : (
              <div className="mt-1.5 space-y-1">
                <p className="font-bold text-sm text-foreground">
                  {order.shippingAddress?.name} ({order.shippingAddress?.phone})
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {order.shippingAddress?.address}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                </p>
                <p className="text-primary font-medium text-[11px]">
                  Kurir: {order.courierCompany ?? "Kurir Reguler"}
                  {order.trackingNo ? ` • Resi: ${order.trackingNo}` : ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-6">
          <p className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] mb-3">
            Rincian Pesanan
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">No.</th>
                  <th className="py-2.5 px-3">Item & Kustomisasi</th>
                  <th className="py-2.5 px-3 text-center">Gilingan</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-3 text-muted-foreground font-medium">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <Coffee className="h-3.5 w-3.5 text-gold-deep shrink-0" />
                        {it.coffeeName}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Profil Sangrai: <span className="font-medium text-foreground">{it.roastProfileName}</span>
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="outline" className="text-[10px] font-medium px-2 py-0">
                        {GRIND_LABELS[it.grindSize] || it.grindSize}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-foreground">{it.quantity}</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">{formatIDR(it.unitPriceIdr)}</td>
                    <td className="py-3 px-3 text-right font-bold text-foreground">
                      {formatIDR(it.subtotalIdr ?? it.unitPriceIdr * it.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Financial Breakdown */}
        <div className="mt-6 flex flex-col sm:flex-row items-start justify-between gap-6 pt-4 border-t border-border/80">
          {/* Roastery Seal & Live QR */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl border border-dashed border-primary/40 bg-accent/30 p-1 flex items-center justify-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(statusUrl)}`}
                alt="QR Code Status"
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 font-bold text-green-deep">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Authentic Specialty Roast</span>
              </div>
              <p className="text-[11px] leading-relaxed max-w-[240px]">
                Scan QR untuk memantau proses sangrai dan pelacakan kurir real-time.
              </p>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal Produk</span>
              <span className="font-semibold text-foreground">{formatIDR(order.subtotal)}</span>
            </div>

            {Boolean(order.discountAmount && order.discountAmount > 0) && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>
                  Diskon Voucher {order.voucherCode ? `(${order.voucherCode})` : ""}
                </span>
                <span>-{formatIDR(order.discountAmount!)}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Ongkos Kirim</span>
              <span className="font-semibold text-foreground">
                {order.shippingFee === 0 ? "GRATIS" : formatIDR(order.shippingFee)}
              </span>
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-baseline">
              <span className="text-sm font-bold text-foreground">Total Akhir</span>
              <span className="font-[var(--font-display)] text-lg font-black text-green-deep">
                {formatIDR(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-10 pt-4 border-t border-border/50 text-center text-[11px] text-muted-foreground">
          <p>
            Terima kasih telah memesan kopi artisan dari ACHO Coffee. Biji kopi di-roasting dengan dedikasi tinggi
            dan siap menghasilkan seduhan berkarakter terbaik.
          </p>
          <p className="mt-1">
            Pertanyaan seputar pesanan? Hubungi Barista ACHO di{" "}
            <span className="font-semibold text-foreground">roastery@acho.coffee</span> atau WhatsApp{" "}
            <span className="font-semibold text-foreground">0812-3456-7890</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
