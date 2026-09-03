"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Coffee,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCart } from "./cart-context";
import { formatIDR, GRIND_LABELS } from "@/lib/constants";
import { toast } from "sonner";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    totalCount,
    subtotal,
    totalWeightGrams,
    wholesaleDiscount,
    updateQty,
    removeItem,
    appliedVoucher,
    applyVoucherCode,
    removeVoucher,
  } = useCart();

  const router = useRouter();
  const [voucherInput, setVoucherInput] = useState("");
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const wholesaleAmount = wholesaleDiscount.discountAmount;
  const grandTotal = Math.max(0, subtotal - wholesaleAmount - discount);

  async function handleApplyVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    setValidatingVoucher(true);
    const res = await applyVoucherCode(voucherInput.trim());
    setValidatingVoucher(false);
    if (res.success) {
      toast.success(res.message);
      setVoucherInput("");
    } else {
      toast.error(res.message);
    }
  }

  function handleCheckout() {
    closeCart();
    router.push("/checkout");
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md bg-background border-l border-border/80 shadow-2xl"
      >
        <SheetHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-foreground">
                  Keranjang Belanja
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {totalCount > 0 ? `${totalCount} kopi siap di-roasting` : "Belum ada kopi dipilih"}
                </p>
              </div>
            </div>
            {totalWeightGrams > 0 && (
              <Badge variant="outline" className="text-xs font-medium border-border/70">
                {totalWeightGrams >= 1000 ? `${(totalWeightGrams / 1000).toFixed(1)} kg` : `${totalWeightGrams}g`}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Content Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/80 text-muted-foreground">
              <Coffee className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-bold text-foreground">Keranjangmu Kosong</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Jelajahi koleksi biji kopi nusantara pilihan kami dan racik profil roasting personalmu.
            </p>
            <Button
              className="mt-6 font-semibold"
              variant="gold"
              onClick={() => {
                closeCart();
                router.push("/kopi");
              }}
            >
              Jelajahi Koleksi Kopi
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-border/40">
              {items.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-deep/10 to-gold/15 border border-gold/20">
                    <Coffee className="h-6 w-6 text-gold-deep" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/pesan/${item.coffeeSlug}`}
                        onClick={closeCart}
                        className="font-bold text-sm text-foreground hover:text-gold-deep transition-colors truncate"
                      >
                        {item.coffeeName}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 -mr-1"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="gold" className="text-[10px] px-2 py-0">
                        {item.roastProfileName}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 border-border">
                        {GRIND_LABELS[item.grindSize]}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-border bg-card">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Kurangi"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Tambah"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="font-extrabold text-sm text-green-deep">
                        {formatIDR(item.unitPriceIdr * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher and Totals Footer */}
            <div className="border-t border-border/80 bg-card p-4 sm:p-5 space-y-3.5 sm:space-y-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
              {/* Wholesale Tier Notice Card */}
              {wholesaleDiscount.eligible ? (
                <div className="rounded-2xl border border-gold/50 bg-gradient-to-r from-accent/50 to-card p-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold-deep shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Grosir: {wholesaleDiscount.tier?.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Total {wholesaleDiscount.totalBeanKg} kg biji kopi
                        </p>
                      </div>
                    </div>
                    <Badge variant="gold" className="text-[11px] font-black">
                      Diskon {wholesaleDiscount.discountPercent}%
                    </Badge>
                  </div>
                  {wholesaleDiscount.nextTier && (
                    <p className="mt-2 text-[10px] text-gold-deep font-semibold border-t border-gold/20 pt-1.5">
                      Tambah {wholesaleDiscount.kgNeededForNextTier} kg lagi untuk membuka diskon {wholesaleDiscount.nextTier.discountPercent}%!
                    </p>
                  )}
                </div>
              ) : wholesaleDiscount.totalBeanKg > 0 ? (
                <div className="rounded-2xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Program Grosir Kafe</p>
                    <p className="text-[11px]">Beli min. 3 kg untuk diskon otomatis 15%</p>
                  </div>
                  <span className="font-mono font-bold text-green-deep">
                    {wholesaleDiscount.totalBeanKg} / 3 kg
                  </span>
                </div>
              ) : null}

              {/* Voucher Section */}
              {appliedVoucher ? (
                <div className="flex items-center justify-between rounded-xl bg-gold/10 border border-gold/30 p-2.5 px-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gold-deep" />
                    <div>
                      <p className="font-bold text-gold-deep">VOUCHER: {appliedVoucher.code}</p>
                      <p className="text-[11px] text-muted-foreground">Hemat {formatIDR(appliedVoucher.discountAmount)}</p>
                    </div>
                  </div>
                  <button
                    onClick={removeVoucher}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Hapus voucher"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <Input
                    placeholder="Punya voucher? (misal: ACHO10)"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    className="h-9 text-xs uppercase"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs font-semibold"
                    disabled={validatingVoucher || !voucherInput.trim()}
                  >
                    Terapkan
                  </Button>
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal Produk ({totalCount} item)</span>
                  <span className="font-medium text-foreground">{formatIDR(subtotal)}</span>
                </div>
                {wholesaleAmount > 0 && (
                  <div className="flex justify-between text-gold-deep font-bold">
                    <span>Diskon Grosir Kafe ({wholesaleDiscount.discountPercent}%)</span>
                    <span>-{formatIDR(wholesaleAmount)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Diskon Voucher ({appliedVoucher?.code})</span>
                    <span>-{formatIDR(discount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex items-baseline justify-between text-sm font-extrabold text-foreground">
                  <span>Estimasi Total</span>
                  <span className="text-base text-green-deep">{formatIDR(grandTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  className="w-full h-11 text-sm font-bold gap-2 shadow-lg shadow-gold/15"
                  variant="gold"
                  onClick={handleCheckout}
                >
                  Lanjut ke Checkout <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground hover:text-foreground h-8"
                  onClick={closeCart}
                >
                  Lanjut Belanja Kopi Lain
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
