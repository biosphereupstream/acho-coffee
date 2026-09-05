"use client";

import { useState } from "react";
import { Calculator, Sparkles, TrendingUp, Coffee, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/constants";

export function SavingsCalculator() {
  const [kgPerMonth, setKgPerMonth] = useState(15);

  // Asumsi rata-rata harga biji kopi specialty 1kg di Biosphere (rata-rata Rp 550.000 / kg)
  const AVG_RETAIL_PER_KG = 550000;
  // 1kg biji menghasilkan ~55 cup double espresso (dose 18g)
  const CUPS_PER_KG = 55;

  let discountPercent = 0;
  let tierLabel = "Retail (Tanpa Diskon Grosir)";
  if (kgPerMonth >= 11) {
    discountPercent = 10;
    tierLabel = "Roastery Partner (Diskon 10%)";
  } else if (kgPerMonth >= 6) {
    discountPercent = 7.5;
    tierLabel = "Busy Coffee Shop (Diskon 7.5%)";
  } else if (kgPerMonth >= 3) {
    discountPercent = 5;
    tierLabel = "Starter Cafe (Diskon 5%)";
  }

  const estimatedCups = kgPerMonth * CUPS_PER_KG;
  const normalCost = kgPerMonth * AVG_RETAIL_PER_KG;
  const savingsAmount = (normalCost * discountPercent) / 100;
  const wholesaleCost = normalCost - savingsAmount;
  const savingsPerCup = estimatedCups > 0 ? Math.round(savingsAmount / estimatedCups) : 0;

  return (
    <div className="glossy-card relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-card via-background to-secondary/30 p-4 sm:p-10 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5 sm:pb-6">
        <div>
          <Badge variant="gold" className="text-primary font-bold gap-1.5">
            <Calculator className="h-3.5 w-3.5" /> Simulasi Keuntungan Kafe
          </Badge>
          <h3 className="mt-2 font-[var(--font-display)] text-xl sm:text-2xl lg:text-3xl font-black text-green-deep">
            Kalkulator Penghematan Grosir
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Geser slider sesuai estimasi kebutuhan biji kopi kedai Anda tiap bulan.
          </p>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-secondary/50 px-3.5 py-2 sm:px-4 sm:py-2 text-left sm:text-right self-start sm:self-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tier Kemitraan</span>
          <p className="font-[var(--font-display)] text-xs sm:text-sm font-extrabold text-gold-deep">{tierLabel}</p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 space-y-6">
        {/* Slider input */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-foreground">Kebutuhan per Bulan:</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-green-deep">{kgPerMonth} <span className="text-xs sm:text-sm font-semibold text-muted-foreground">kg/bulan</span></span>
          </div>

          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={kgPerMonth}
            onChange={(e) => setKgPerMonth(Number(e.target.value))}
            className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer accent-amber-600 dark:accent-amber-500"
          />

          <div className="flex justify-between text-[10px] sm:text-[11px] text-muted-foreground font-mono mt-1.5">
            <span>1 kg</span>
            <span className="text-gold-deep font-bold">Tier 1 (5%)</span>
            <span className="text-gold-deep font-bold hidden sm:inline">Tier 2 (7.5%)</span>
            <span className="text-gold-deep font-bold">Tier 3 (10%)</span>
            <span>60 kg</span>
          </div>
        </div>

        {/* Results cards */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3 pt-2 sm:pt-4">
          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase">
              <Coffee className="h-4 w-4 text-gold-deep" /> Estimasi Cup Yield
            </div>
            <p className="mt-2 font-mono text-2xl font-black text-green-deep sm:text-3xl">
              ~{estimatedCups.toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Cup espresso (dosis 18g double shot)
            </p>
          </div>

          <div className="rounded-2xl border border-gold/40 bg-accent/30 p-5 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-gold-deep text-xs font-bold uppercase">
              <Sparkles className="h-4 w-4" /> Diskon Diperoleh
            </div>
            <p className="mt-2 font-mono text-2xl font-black text-gold-deep sm:text-3xl">
              {discountPercent > 0 ? `${discountPercent}%` : "0%"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {discountPercent > 0
                ? "Diterapkan otomatis pada harga wholesale"
                : "Minimal 3 kg untuk mengaktifkan diskon 5%"}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase">
              <TrendingUp className="h-4 w-4" /> Penghematan Bulanan
            </div>
            <p className="mt-2 font-mono text-2xl font-black text-green-deep sm:text-3xl">
              {formatIDR(savingsAmount)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Hemat {formatIDR(savingsPerCup)} per cangkir kopi
            </p>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="rounded-2xl border border-border/80 bg-secondary/40 p-4 sm:p-5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-bold text-foreground">Ringkasan Estimasi Biaya Kopi Kedai Anda:</p>
            <p>Harga normal retail: <span className="line-through">{formatIDR(normalCost)}</span></p>
            <p>Biaya setelah diskon wholesale: <span className="font-bold text-green-deep">{formatIDR(wholesaleCost)}</span></p>
          </div>

          <div className="flex items-center gap-2 text-green-deep font-semibold">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span>Garansi sangrai segar &lt; 48 jam sebelum pengiriman</span>
          </div>
        </div>
      </div>
    </div>
  );
}
