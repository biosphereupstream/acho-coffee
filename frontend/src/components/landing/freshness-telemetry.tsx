"use client";

import { Flame, ShieldCheck, Truck, Sparkles, CheckCircle2, Clock, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FreshnessTelemetry() {
  return (
    <section className="border-y border-border/80 bg-gradient-to-b from-card via-background to-secondary/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Freshness & Batch Telemetry • Jaminan Kesegaran Mutlak</span>
            </div>
            <h2 className="font-[var(--font-display)] text-3xl font-extrabold text-green-deep sm:text-4xl">
              Bukan Kopi Stok Rak. <span className="text-gold-gradient">Dipanggang Setelah Kamu Bayar.</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Kopi komersial di supermarket sering kali sudah berbulan-bulan kehilangan aromanya. Biosphere beroperasi dengan prinsip *Zero Old Stock* — setiap batch diproses langsung secara segar.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-end bg-card border border-border px-4 py-2.5 rounded-2xl shadow-xs">
            <Gauge className="h-5 w-5 text-gold-deep" />
            <div className="text-xs">
              <p className="font-bold text-foreground">Status Roastery</p>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Siap Jadwal Batch Hari Ini
              </p>
            </div>
          </div>
        </div>

        {/* 4 Telemetry Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Roast On Demand */}
          <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-gold/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <Flame className="h-6 w-6" />
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                Batch: On-Demand
              </span>
            </div>
            <h3 className="mt-4 font-bold text-base text-green-deep">
              Fresh Roast Guarantee
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Biji mentah (green bean) baru masuk mesin sangrai setelah pesanan terverifikasi. Tidak ada stok lama yang mengendap di etalase.
            </p>
            <div className="mt-4 border-t border-border/50 pt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Roasting Segar
            </div>
          </div>

          {/* Card 2: Peak Flavor Window */}
          <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-gold/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Clock className="h-6 w-6" />
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                Window: 72 Jam
              </span>
            </div>
            <h3 className="mt-4 font-bold text-base text-green-deep">
              Degassing Optimal
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Kopi specialty butuh 48–72 jam untuk pelepasan gas CO2 alami pasca-sangrai. Paket sampai tepat saat profil rasa mencapai titik puncak (Peak Flavor).
            </p>
            <div className="mt-4 border-t border-border/50 pt-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Kejelasan Rasa Maksimal
            </div>
          </div>

          {/* Card 3: One-Way Valve Protection */}
          <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-gold/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                Valve Seal
              </span>
            </div>
            <h3 className="mt-4 font-bold text-base text-green-deep">
              One-Way Degassing Valve
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Kemasan premium dengan katup satu arah: gas karbon internal bisa keluar bebas, tetapi oksigen dari luar terhalang total agar aroma tidak teroksidasi.
            </p>
            <div className="mt-4 border-t border-border/50 pt-3 text-[11px] font-semibold text-primary flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Proteksi Aroma Tertutup
            </div>
          </div>

          {/* Card 4: Live Logistics Dispatch */}
          <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-gold/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <Truck className="h-6 w-6" />
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                Biteship API
              </span>
            </div>
            <h3 className="mt-4 font-bold text-base text-green-deep">
              Tracing Kurir Real-Time
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Terintegrasi langsung dengan ekspedisi instan & reguler (JNE, J&T, SiCepat, AnterAja). Pantau pergerakan kurir secara transparan hingga depan pintu rumahmu.
            </p>
            <div className="mt-4 border-t border-border/50 pt-3 text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Pelacakan Otomatis
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
