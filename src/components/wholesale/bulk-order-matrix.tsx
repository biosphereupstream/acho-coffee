"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingBag, Sparkles, Flame, Award } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-context";
import { formatIDR } from "@/lib/constants";
import type { CatalogCoffee, GrindSize } from "@/lib/types";

interface BulkItemState {
  quantity: number;
  roastCode: string;
  roastName: string;
  grindSize: GrindSize;
}

export function BulkOrderMatrix({ beans }: { beans: CatalogCoffee[] }) {
  const { addItem, openCart } = useCart();

  // State untuk tiap kopi 1kg
  const [itemsState, setItemsState] = useState<Record<string, BulkItemState>>(() => {
    const init: Record<string, BulkItemState> = {};
    for (const b of beans) {
      init[b.slug] = {
        quantity: b.slug === "ciwidey-bio-natural" ? 2 : b.slug === "ciwidey-semi-washed" ? 1 : 0,
        roastCode: "medium",
        roastName: "Medium Roast (Sweet & Balanced)",
        grindSize: "bean",
      };
    }
    return init;
  });

  const updateQuantity = (slug: string, delta: number) => {
    setItemsState((prev) => {
      const current = prev[slug]?.quantity || 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [slug]: {
          ...prev[slug],
          quantity: next,
        },
      };
    });
  };

  const updateRoast = (slug: string, roastCode: string, roastName: string) => {
    setItemsState((prev) => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        roastCode,
        roastName,
      },
    }));
  };

  const updateGrind = (slug: string, grindSize: GrindSize) => {
    setItemsState((prev) => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        grindSize,
      },
    }));
  };

  // Hitung total kg dan harga
  let totalKg = 0;
  let rawSubtotal = 0;

  for (const b of beans) {
    const qty = itemsState[b.slug]?.quantity || 0;
    // Cari harga 1kg dari packageVariants jika ada, atau fallback priceIdr
    const variant1kg = b.packageVariants?.find((v) => v.size === "1kg");
    const price1kg = variant1kg ? variant1kg.priceIdr : b.priceIdr;

    totalKg += qty;
    rawSubtotal += qty * price1kg;
  }

  // Tiering diskon
  let discountPercent = 0;
  let nextGoalKg = 3;
  let tierBadgeText = "Belum Ada Diskon";

  if (totalKg >= 11) {
    discountPercent = 35;
    tierBadgeText = "Tier 3: Diskon 35% Roastery Partner";
    nextGoalKg = 0;
  } else if (totalKg >= 6) {
    discountPercent = 25;
    tierBadgeText = "Tier 2: Diskon 25% Busy Coffee Shop";
    nextGoalKg = 11;
  } else if (totalKg >= 3) {
    discountPercent = 15;
    tierBadgeText = "Tier 1: Diskon 15% Starter Cafe";
    nextGoalKg = 6;
  }

  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const finalTotal = rawSubtotal - discountAmount;

  const handleAddAllToCart = async () => {
    if (totalKg === 0) {
      toast.error("Pilih minimal 1 kg biji kopi untuk dimasukkan ke keranjang.");
      return;
    }

    let addedCount = 0;
    for (const b of beans) {
      const state = itemsState[b.slug];
      if (state && state.quantity > 0) {
        const variant1kg = b.packageVariants?.find((v) => v.size === "1kg");
        const price1kg = variant1kg ? variant1kg.priceIdr : b.priceIdr;

        await addItem({
          coffeeSlug: b.slug,
          coffeeName: `${b.name} (1kg Bulk)`,
          roastProfileCode: state.roastCode,
          roastProfileName: state.roastName,
          grindSize: state.grindSize,
          quantity: state.quantity,
          unitPriceIdr: price1kg,
          weightGrams: 1000,
          imageUrl: b.imageUrl,
        });
        addedCount += state.quantity;
      }
    }

    toast.success(`Berhasil menambahkan ${addedCount} kg biji kopi ke keranjang!`, {
      description: discountPercent > 0 ? `Diskon wholesale ${discountPercent}% aktif!` : undefined,
    });
    openCart();
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-[var(--font-display)] text-2xl font-black text-green-deep sm:text-3xl">
            Quick Bulk Order Matrix (1kg Bags)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Tentukan jumlah pesanan per varian kopi Classic Origin Ciwidey & Garut.
          </p>
        </div>

        {/* Live Tier Status Indicator */}
        <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-accent/40 px-4 py-2.5 shadow-xs">
          <Sparkles className="h-5 w-5 text-gold-deep shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Status Grosir</span>
              <Badge variant="gold" className="text-[10px] font-bold py-0">{tierBadgeText}</Badge>
            </div>
            <p className="text-xs text-foreground mt-0.5">
              Total Dipilih: <b className="text-green-deep font-mono">{totalKg} kg</b>
              {nextGoalKg > 0 && (
                <span className="text-muted-foreground ml-1.5 font-medium">
                  (Butuh {nextGoalKg - totalKg} kg lagi untuk diskon {nextGoalKg === 3 ? "15%" : nextGoalKg === 6 ? "25%" : "35%"})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Beans */}
      <div className="grid gap-6 md:grid-cols-2">
        {beans.map((coffee) => {
          const state = itemsState[coffee.slug] || {
            quantity: 0,
            roastCode: "medium",
            roastName: "Medium Roast",
            grindSize: "bean",
          };
          const variant1kg = coffee.packageVariants?.find((v) => v.size === "1kg");
          const price1kg = variant1kg ? variant1kg.priceIdr : coffee.priceIdr;
          const isSelected = state.quantity > 0;

          return (
            <div
              key={coffee.slug}
              className={`gold-ring-hover glossy-card relative flex flex-col justify-between rounded-3xl border p-4 sm:p-6 transition-all duration-300 ${
                isSelected
                  ? "border-gold bg-accent/20 shadow-md ring-1 ring-gold/40"
                  : "border-border bg-card shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-[var(--font-display)] text-base sm:text-lg font-black text-green-deep">
                        {coffee.name}
                      </h4>
                      <Badge variant="outline" className="text-[10px] font-mono">1kg Bag</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {coffee.origin} • {coffee.altitude}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {coffee.tastingNotes.map((note: string) => (
                        <span key={note} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-extrabold text-green-deep">
                      {formatIDR(price1kg)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground font-medium">/ 1.000 gram</span>
                  </div>
                </div>

                {/* Profil Roasting & Gilingan Picker */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/60 pt-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-gold-deep" /> Profil Roasting
                    </label>
                    <select
                      value={state.roastCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const name =
                          code === "light"
                            ? "Light Roast (Filter Specialty)"
                            : code === "medium"
                            ? "Medium Roast (Sweet & Balanced)"
                            : "Medium-Dark Roast (Bold Espresso)";
                        updateRoast(coffee.slug, code, name);
                      }}
                      className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-gold focus:outline-hidden"
                    >
                      <option value="light">Light Roast (Filter)</option>
                      <option value="medium">Medium Roast (All-Round)</option>
                      <option value="medium-dark">Medium-Dark (Espresso)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Award className="h-3 w-3 text-primary" /> Opsi Gilingan
                    </label>
                    <select
                      value={state.grindSize}
                      onChange={(e) => updateGrind(coffee.slug, e.target.value as GrindSize)}
                      className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-gold focus:outline-hidden"
                    >
                      <option value="bean">Biji Utuh (Whole Bean)</option>
                      <option value="fine">Giling Halus (Espresso)</option>
                      <option value="medium">Giling Sedang (V60 / Drip)</option>
                      <option value="coarse">Giling Kasar (Cold Brew)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-xs font-bold text-foreground">Kuantitas Pesanan:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity(coffee.slug, -1)}
                    disabled={state.quantity === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:border-gold disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>

                  <span className="w-12 text-center font-mono text-base font-black text-green-deep">
                    {state.quantity} <span className="text-xs font-normal text-muted-foreground">kg</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(coffee.slug, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:border-gold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Summary & Add-to-cart Bar */}
      <div className="rounded-3xl border border-gold/50 bg-gradient-to-r from-card via-secondary/40 to-card p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ringkasan Pemesanan Bulk:</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                Total {totalKg} kg
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              {discountPercent > 0 ? (
                <>
                  <span className="font-mono text-2xl font-black text-green-deep sm:text-3xl">
                    {formatIDR(finalTotal)}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground line-through">
                    {formatIDR(rawSubtotal)}
                  </span>
                  <Badge variant="gold" className="text-xs font-black">
                    Hemat {formatIDR(discountAmount)} ({discountPercent}%)
                  </Badge>
                </>
              ) : (
                <span className="font-mono text-2xl font-black text-green-deep sm:text-3xl">
                  {formatIDR(rawSubtotal)}
                </span>
              )}
            </div>

            {totalKg < 3 && (
              <p className="text-xs text-amber-600 font-medium">
                Tip: Tambah {3 - totalKg} kg lagi untuk membuka diskon grosir 15%!
              </p>
            )}
          </div>

          <Button
            size="lg"
            variant="gold"
            onClick={handleAddAllToCart}
            disabled={totalKg === 0}
            className="w-full sm:w-auto font-black gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <ShoppingBag className="h-4 w-4" /> Masukkan ke Keranjang ({totalKg} kg)
          </Button>
        </div>
      </div>
    </div>
  );
}
