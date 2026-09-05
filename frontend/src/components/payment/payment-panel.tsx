"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FlaskConical,
  Landmark,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DOKU_CHANNELS, type DokuChannel, type DokuPaymentResult } from "@/lib/payments/doku-shared";
import { formatIDR } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const VA_CHANNELS = DOKU_CHANNELS.filter((c) => c.group === "va");
const WALLET_CHANNELS = DOKU_CHANNELS.filter((c) => c.group === "ewallet");
const RETAIL_CHANNELS = DOKU_CHANNELS.filter((c) => c.group === "retail");

export function PaymentPanel({ order }: { order: OrderRecord }) {
  const router = useRouter();
  const [channel, setChannel] = useState<DokuChannel>("QRIS");
  const [creating, setCreating] = useState(false);
  const [payment, setPayment] = useState<DokuPaymentResult | null>(null);
  const [error, setError] = useState("");

  const { data: liveOrder } = useQuery({
    queryKey: ["order", order.orderNumber],
    queryFn: async () => {
      const res = await fetch("/api/orders/" + order.orderNumber, { cache: "no-store" });
      if (!res.ok) throw new Error("gagal");
      const json = await res.json();
      return json.order as OrderRecord;
    },
    initialData: order,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (liveOrder.paymentStatus === "paid") {
      toast.success("Pembayaran diterima! Kopimu masuk antrian roasting 🎉");
      router.push("/status/" + liveOrder.orderNumber);
    }
  }, [liveOrder.paymentStatus, liveOrder.orderNumber, router]);

  const channelFee = DOKU_CHANNELS.find((c) => c.id === channel)?.fee ?? 0;

  async function handleCreatePayment() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat pembayaran");
      const result = data.payment as DokuPaymentResult;
      setPayment(result);

      if (result.paymentUrl) {
        // Redirect directly if hosted checkout was requested
        window.location.href = result.paymentUrl;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat pembayaran");
    } finally {
      setCreating(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Nomor tersalin ke clipboard"),
      () => toast.error("Gagal menyalin")
    );
  }

  return (
    <div className="glossy-card rounded-2xl border border-border p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-[var(--font-display)] text-lg sm:text-xl font-bold text-green-deep">
            Pilih Metode Pembayaran
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transaksi aman dan terverifikasi otomatis via DOKU Payment Gateway
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 font-semibold text-xs border border-primary/20 self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> DOKU Secure
        </Badge>
      </div>

      {/* QRIS & Hosted Option */}
      <div className="mt-5 sm:mt-6 space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <QrCode className="h-3.5 w-3.5 text-gold-deep" /> Rekomendasi Instan
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ChannelButton
            active={channel === "QRIS"}
            label="QRIS (Semua E-Wallet & M-Banking)"
            badge="Tercepat"
            fee={0}
            onClick={() => setChannel("QRIS")}
          />
          <ChannelButton
            active={channel === "DOKU_HOSTED"}
            label="DOKU Hosted Checkout"
            badge="Semua Metode"
            fee={0}
            onClick={() => setChannel("DOKU_HOSTED")}
          />
        </div>
      </div>

      {/* Virtual Accounts */}
      <div className="mt-5 sm:mt-6 space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Landmark className="h-3.5 w-3.5 text-primary" /> Virtual Account Bank
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {VA_CHANNELS.map((c) => (
            <ChannelButton
              key={c.id}
              active={channel === c.id}
              label={c.label}
              fee={c.fee}
              onClick={() => setChannel(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Retail Gerai (Indomaret / Alfamart) */}
      <div className="mt-5 space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Store className="h-3.5 w-3.5 text-muted-foreground" /> Gerai Retail
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RETAIL_CHANNELS.map((c) => (
            <ChannelButton
              key={c.id}
              active={channel === c.id}
              label={c.label}
              fee={c.fee}
              onClick={() => setChannel(c.id)}
            />
          ))}
        </div>
      </div>

      {/* E-Wallets */}
      <div className="mt-5 space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" /> E-Wallet
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WALLET_CHANNELS.map((c) => (
            <ChannelButton
              key={c.id}
              active={channel === c.id}
              label={c.label}
              fee={c.fee}
              onClick={() => setChannel(c.id)}
            />
          ))}
        </div>
      </div>

      <Separator className="my-5 sm:my-6" />

      {/* Bill Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Total Tagihan Pesanan</span>
        <span className="font-[var(--font-display)] text-2xl font-black text-green-deep">
          {formatIDR(order.total)}
        </span>
      </div>
      {channelFee > 0 && (
        <p className="mt-1 text-right text-xs text-muted-foreground">
          Biaya transaksi kanal {formatIDR(channelFee)} <span className="font-semibold text-emerald-600">ditanggung Biosphere Roast Works 🎁</span>
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Action Trigger Button */}
      {!payment && (
        <Button
          size="lg"
          variant="gold"
          className="mt-5 w-full font-bold shadow-sm"
          onClick={handleCreatePayment}
          disabled={creating}
        >
          {creating ? <Loader2 className="animate-spin mr-2" /> : null}
          {channel === "QRIS"
            ? "Tampilkan Kode QRIS"
            : channel === "DOKU_HOSTED"
            ? "Lanjut ke DOKU Checkout"
            : "Buat Kode Pembayaran"}
        </Button>
      )}

      {/* Payment Output: QRIS Card */}
      {payment && !payment.paymentUrl && (payment.qrContent || payment.channel === "QRIS") && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          {/* QRIS Header Badge */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="rounded bg-rose-600 px-2 py-0.5 font-bold text-white text-xs tracking-wider">
              QRIS
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Standar Pembayaran Nasional
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Scan dengan BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, atau aplikasi apa pun
          </p>

          {/* QR Code Image */}
          <div className="mx-auto w-56 h-56 rounded-2xl border-2 border-border bg-white p-3 shadow-inner flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                payment.qrContent || `https://biosphereroastery.vercel.app/status/${order.orderNumber}`
              )}`}
              alt="QRIS Biosphere Roast Works"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="mt-4 space-y-1">
            <p className="font-[var(--font-display)] text-xl font-black text-green-deep">
              {formatIDR(order.total)}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              NMID: ID1020038918231 • BIOSPHERE ROAST WORKS
            </p>
          </div>

          {payment.demo && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-bold text-gold-deep">
                <FlaskConical className="h-4 w-4" /> MODE PENGUJIAN / DEMO
              </p>
              <Button
                size="sm"
                variant="gold"
                className="font-bold gap-1.5"
                onClick={async () => {
                  const res = await fetch("/api/demo/pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderNumber: order.orderNumber }),
                  });
                  if (res.ok) {
                    toast.success("Simulasi scan QRIS berhasil!");
                    router.push("/status/" + order.orderNumber);
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Simulasikan Scan QRIS Berhasil
              </Button>
            </div>
          )}

          <p className="mt-4 text-[11px] text-muted-foreground">
            Halaman mengecek pembayaran otomatis setiap 5 detik. Setelah scan sukses, kamu langsung diarahkan ke halaman pelacakan sangrai.
          </p>
        </div>
      )}

      {/* Payment Output: Virtual Account Card */}
      {payment && !payment.paymentUrl && payment.virtualAccount && payment.channel !== "QRIS" && (
        <div className="mt-6 rounded-2xl border border-gold/40 bg-accent/40 p-6 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {channel.startsWith("VIRTUAL_ACCOUNT")
              ? "Nomor Virtual Account Pembayaran"
              : "Kode Pembayaran Gerai"}
          </p>

          <div className="my-3 flex items-center justify-center gap-3">
            <p className="font-mono text-3xl font-black tracking-widest text-green-deep">
              {payment.virtualAccount}
            </p>
            <Button size="sm" variant="outline" onClick={() => copy(payment.virtualAccount ?? "")}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <p className="font-[var(--font-display)] text-lg font-bold text-primary">
            Nominal Pas: {formatIDR(order.total)}
          </p>

          {payment.howToPay && (
            <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {payment.howToPay}
            </p>
          )}

          {payment.demo && (
            <div className="mt-5 border-t border-gold/30 pt-4">
              <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-bold text-gold-deep">
                <FlaskConical className="h-4 w-4" /> MODE PENGUJIAN / DEMO
              </p>
              <Button
                size="sm"
                variant="gold"
                className="font-bold gap-1.5"
                onClick={async () => {
                  const res = await fetch("/api/demo/pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderNumber: order.orderNumber }),
                  });
                  if (res.ok) {
                    toast.success("Simulasi transfer VA berhasil!");
                    router.push("/status/" + order.orderNumber);
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Simulasikan Transfer Berhasil
              </Button>
            </div>
          )}

          <p className="mt-4 text-[11px] text-muted-foreground">
            Status diperbarui otomatis setiap 5 detik. Setelah transfer, kamu akan langsung dialihkan ke status pesanan.
          </p>
        </div>
      )}

      {/* Payment Output: DOKU Hosted Link */}
      {payment && payment.paymentUrl && (
        <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center shadow-sm space-y-3">
          <p className="text-sm font-bold text-green-deep">Halaman Pembayaran DOKU Telah Siap</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Klik tombol di bawah untuk membuka portal pembayaran resmi DOKU (Virtual Account, Kartu Kredit, Gerai Retail).
          </p>
          <Button size="lg" variant="gold" className="font-bold gap-1.5 shadow-sm" asChild>
            <a href={payment.paymentUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Buka Portal Pembayaran DOKU
            </a>
          </Button>
          <p className="text-[11px] text-muted-foreground pt-1">
            Setelah menyelesaikan pembayaran di DOKU, status akan otomatis diperbarui.
          </p>
        </div>
      )}
    </div>
  );
}

function ChannelButton({
  active,
  label,
  fee,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  fee: number;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl border-2 px-3 py-3 text-left transition-all",
        active
          ? "border-gold bg-accent/60 shadow-sm"
          : "border-border bg-card hover:border-gold/50"
      )}
    >
      {badge && (
        <span className="absolute -top-2 right-2 rounded bg-gold px-1.5 py-0.2 font-mono text-[9px] font-bold text-neutral-900 shadow-xs">
          {badge}
        </span>
      )}
      <p className="text-xs font-bold leading-tight text-foreground">{label}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {fee > 0 ? "fee " + formatIDR(fee) : "tanpa biaya"}
      </p>
    </button>
  );
}
