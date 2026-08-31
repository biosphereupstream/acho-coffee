"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  FlaskConical,
  Landmark,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DOKU_CHANNELS, type DokuChannel, type DokuPaymentResult } from "@/lib/payments/doku-shared";
import { formatIDR } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const VA_CHANNELS = DOKU_CHANNELS.filter((c) => c.id.startsWith("VIRTUAL_ACCOUNT"));
const WALLET_CHANNELS = DOKU_CHANNELS.filter((c) => c.id.startsWith("EWALLET"));

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
      setPayment(data.payment as DokuPaymentResult);
      if (data.payment.paymentUrl) {
        window.location.href = data.payment.paymentUrl;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat pembayaran");
    } finally {
      setCreating(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Nomor tersalin"),
      () => toast.error("Gagal menyalin")
    );
  }

  return (
    <div className="glossy-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Pilih Metode Pembayaran</h2>
        <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Aman via Doku</Badge>
      </div>

      {/* grup VA */}
      <p className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Landmark className="h-3.5 w-3.5" /> Virtual Account
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {VA_CHANNELS.map((c) => (
          <ChannelButton key={c.id} active={channel === c.id} label={c.label} fee={c.fee} onClick={() => setChannel(c.id)} />
        ))}
      </div>

      {/* grup e-wallet */}
      <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Smartphone className="h-3.5 w-3.5" /> E-Wallet
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {WALLET_CHANNELS.map((c) => (
          <ChannelButton key={c.id} active={channel === c.id} label={c.label} fee={c.fee} onClick={() => setChannel(c.id)} />
        ))}
      </div>

      {/* QRIS */}
      <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <QrCode className="h-3.5 w-3.5" /> QRIS
      </p>
      <div className="mt-2">
        <ChannelButton active={channel === "QRIS"} label="QRIS (semua aplikasi)" fee={0} onClick={() => setChannel("QRIS")} />
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total tagihan</span>
        <span className="text-2xl font-extrabold text-primary">{formatIDR(order.total)}</span>
      </div>
      {channelFee > 0 && (
        <p className="mt-1 text-right text-xs text-muted-foreground">
          Biaya kanal {formatIDR(channelFee)} ditanggung kami 🎁
        </p>
      )}

      {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">{error}</p>}

      {!payment && (
        <Button size="lg" variant="gold" className="mt-5 w-full" onClick={handleCreatePayment} disabled={creating}>
          {creating ? <Loader2 className="animate-spin" /> : null}
          {channel === "QRIS" ? "Bayar dengan QRIS" : "Buat Pembayaran"}
        </Button>
      )}

      {payment && !payment.paymentUrl && payment.virtualAccount && (
        <div className="mt-5 rounded-xl border border-gold/40 bg-accent/50 p-5 text-center">
          <p className="text-sm font-semibold text-accent-foreground">
            {channel.startsWith("VIRTUAL_ACCOUNT") ? "Nomor Virtual Account Kamu" : "Selesaikan via aplikasi"}
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <p className="text-2xl font-extrabold tracking-widest text-green-deep">{payment.virtualAccount}</p>
            <Button size="sm" variant="outline" onClick={() => copy(payment.virtualAccount ?? "")}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          {payment.howToPay && (
            <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">{payment.howToPay}</p>
          )}
          {payment.demo && (
            <div className="mt-5 border-t border-gold/30 pt-4">
              <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-bold text-gold-deep">
                <FlaskConical className="h-3.5 w-3.5" /> MODE DEMO — simulasi pembayaran
              </p>
              <Button
                size="sm"
                variant="gold"
                onClick={async () => {
                  const res = await fetch("/api/demo/pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderNumber: order.orderNumber }),
                  });
                  if (res.ok) {
                    toast.success("Pembayaran simulasi berhasil!");
                    router.push("/status/" + order.orderNumber);
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Simulasikan Pembayaran Berhasil
              </Button>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Halaman ini mengecek status otomatis setiap 5 detik — setelah bayar kamu langsung diarahkan ke status pesanan.
          </p>
        </div>
      )}

      {payment && payment.paymentUrl && (
        <div className="mt-5 rounded-xl border border-border bg-secondary/50 p-5 text-center">
          <p className="text-sm text-muted-foreground">Kamu akan diarahkan ke halaman pembayaran Doku…</p>
          <Button className="mt-3" variant="gold" asChild>
            <a href={payment.paymentUrl}>Buka Halaman Pembayaran</a>
          </Button>
        </div>
      )}
    </div>
  );
}

function ChannelButton({
  active,
  label,
  fee,
  onClick,
}: {
  active: boolean;
  label: string;
  fee: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 px-3 py-3 text-left transition-all",
        active ? "border-gold bg-accent/60" : "border-border bg-white hover:border-gold/50"
      )}
    >
      <p className="text-xs font-bold leading-tight text-green-deep">{label}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{fee > 0 ? "fee " + formatIDR(fee) : "tanpa biaya"}</p>
    </button>
  );
}
