"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BREW_METHODS, GRIND_SIZES, ROAST_PROFILES, TASTE_PROFILES, recommendRoast } from "@/data/roast-profiles";
import { PICKUP_SLOTS, formatIDR, formatDateID } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CatalogCoffee, GrindSize, PackageVariant } from "@/lib/types";

interface PickupDay {
  date: string;
  weekday: string;
  bookedBags: number;
  remainingBags: number;
  available: boolean;
}

interface CourierOption {
  company: string;
  courierName: string;
  courierCode: string;
  price: number;
  duration: string;
}

const EMPTY_ADDRESS = { name: "", phone: "", city: "", address: "", postalCode: "" };
const EMPTY_CUSTOMER = { name: "", email: "", phone: "", note: "" };

export function OrderBuilder({ coffee }: { coffee: CatalogCoffee }) {
  const router = useRouter();
  const wizardRef = useRef<HTMLDivElement>(null);

  const isBeverage = Boolean(coffee.category && coffee.category !== "beans");

  const STEPS = useMemo(() => {
    if (isBeverage) {
      return [
        { title: "Pilihan Sajian", icon: Sparkles },
        { title: "Jadwal & Kirim", icon: CalendarClock },
        { title: "Data & Bayar", icon: User },
      ];
    }
    return [
      { title: "Ukuran & Profil", icon: Sparkles },
      { title: "Gilingan & Qty", icon: Package },
      { title: "Jadwal & Kirim", icon: CalendarClock },
      { title: "Data & Bayar", icon: User },
    ];
  }, [isBeverage]);

  const [step, setStep] = useState(0);

  // Package variants (for roasted beans)
  const [selectedVariant, setSelectedVariant] = useState<PackageVariant | null>(
    coffee.packageVariants && coffee.packageVariants.length > 0 ? coffee.packageVariants[0] : null
  );

  // Beverage options (for ready to drink)
  const [iceOption, setIceOption] = useState<"cold" | "normal">("cold");
  const [sugarOption, setSugarOption] = useState<"normal" | "less" | "none">("normal");

  // Roasting & grind (for beans)
  const [brew, setBrew] = useState("v60");
  const [taste, setTaste] = useState("balanced");
  const [roast, setRoast] = useState("medium");
  const [manualRoast, setManualRoast] = useState(false);
  const [grind, setGrind] = useState<GrindSize>("medium");

  // Quantity & fulfillment
  const [qty, setQty] = useState(1);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState<string>(PICKUP_SLOTS[0]);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [areaId, setAreaId] = useState("");
  const [areaResults, setAreaResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searchingAreas, setSearchingAreas] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [courier, setCourier] = useState<CourierOption | null>(null);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [submitting, setSubmitting] = useState(false);
  const [mobileRecapOpen, setMobileRecapOpen] = useState(false);

  // Dynamic pricing
  const unitPrice = selectedVariant ? selectedVariant.priceIdr : coffee.priceIdr;
  const currentWeightGrams = selectedVariant ? selectedVariant.weightGrams : coffee.weightGrams;
  const sizeLabel = selectedVariant ? selectedVariant.size : (coffee.packageType || (coffee.volumeMl ? `${coffee.volumeMl}ml` : `${coffee.weightGrams}g`));

  const recommendation = useMemo(() => recommendRoast(brew, taste, coffee.type), [brew, taste, coffee.type]);
  const effectiveRoast = manualRoast ? roast : recommendation.level;
  const roastProfile = ROAST_PROFILES.find((r) => r.level === effectiveRoast) ?? ROAST_PROFILES[1];
  const grindLabel = GRIND_SIZES.find((g) => g.id === grind)?.name ?? grind;

  const { data: pickupDays = [] } = useQuery<PickupDay[]>({
    queryKey: ["pickup-slots"],
    queryFn: async () => {
      const res = await fetch("/api/pickup-slots", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat jadwal");
      return res.json();
    },
  });

  const subtotal = unitPrice * qty;
  const shippingFee = fulfillment === "delivery" ? courier?.price ?? 0 : 0;
  const total = subtotal + shippingFee;

  const { addItem, openCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  // Names formatted for cart and orders
  const finalItemName = isBeverage
    ? `${coffee.name} [${iceOption === "cold" ? "Dingin" : "Normal"}, ${sugarOption === "less" ? "Less Sweet" : sugarOption === "none" ? "No Sugar" : "Normal"}]`
    : selectedVariant
    ? `${coffee.name} (${selectedVariant.size})`
    : coffee.name;

  const finalProfileCode = isBeverage ? "RTD" : roastProfile.code;
  const finalProfileName = isBeverage
    ? (coffee.packageType || "Ready To Drink")
    : selectedVariant
    ? `${roastProfile.name} • ${selectedVariant.size}`
    : roastProfile.name;

  const finalGrind = isBeverage ? "bean" : grind;

  async function handleAddToCart() {
    setAddingToCart(true);
    const ok = await addItem({
      coffeeSlug: coffee.slug,
      coffeeName: finalItemName,
      roastProfileCode: finalProfileCode,
      roastProfileName: finalProfileName,
      grindSize: finalGrind,
      quantity: qty,
      unitPriceIdr: unitPrice,
      weightGrams: currentWeightGrams,
      imageUrl: coffee.imageUrl,
    });
    setAddingToCart(false);
    if (ok) {
      openCart();
    }
  }

  function scrollToWizardTop() {
    if (typeof window !== "undefined" && wizardRef.current) {
      const yOffset = -75;
      const y = wizardRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  const scheduleStepIndex = isBeverage ? 1 : 2;
  const checkoutStepIndex = isBeverage ? 2 : 3;

  function canContinue(): { ok: boolean; reason?: string } {
    if (step === scheduleStepIndex) {
      if (fulfillment === "pickup" && !pickupDate) return { ok: false, reason: "Pilih tanggal ambil terlebih dahulu" };
      if (fulfillment === "delivery") {
        if (!address.name || !address.phone || !address.address || !address.city)
          return { ok: false, reason: "Lengkapi alamat pengiriman" };
        if (!courier) return { ok: false, reason: "Cari ongkir & pilih kurir terlebih dahulu" };
      }
    }
    if (step === checkoutStepIndex) {
      if (!customer.name || !customer.email || !customer.phone)
        return { ok: false, reason: "Lengkapi nama, email, dan nomor HP" };
    }
    return { ok: true };
  }

  function nextStep() {
    const check = canContinue();
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollToWizardTop();
  }

  function prevStep() {
    setStep((s) => Math.max(0, s - 1));
    scrollToWizardTop();
  }

  // Debounced search area Biteship saat mengetik kota/kecamatan
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!address.city || address.city.trim().length < 3) {
        setAreaResults([]);
        return;
      }
      setSearchingAreas(true);
      try {
        const res = await fetch("/api/shipping/areas?input=" + encodeURIComponent(address.city.trim()));
        if (res.ok) {
          const data = await res.json();
          const list = data.areas || (Array.isArray(data) ? data : []);
          setAreaResults(list);
          if (list.length > 0) setShowAreaDropdown(true);
        }
      } catch {
        // noop
      } finally {
        setSearchingAreas(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [address.city]);

  const handleSelectArea = (item: { id: string; name: string }) => {
    setAreaId(item.id);
    setShowAreaDropdown(false);
    const postalMatch = item.name.match(/\b\d{5}\b/);
    const updatedPostal = postalMatch ? postalMatch[0] : address.postalCode;
    setAddress((prev) => ({
      ...prev,
      city: item.name,
      postalCode: updatedPostal,
    }));
    fetchShippingRates(item.id, item.name, updatedPostal);
  };

  async function fetchShippingRates(overrideAreaId?: string, overrideCity?: string, overridePostal?: string) {
    setLoadingRates(true);
    try {
      let destArea = overrideAreaId || areaId;
      const targetCity = overrideCity || address.city;
      const targetPostal = overridePostal || address.postalCode;

      // Jika belum ada areaId, coba cari dari kode pos atau kota
      if (!destArea && (targetPostal || targetCity)) {
        const queryTerm = targetPostal && targetPostal.trim().length >= 4 ? targetPostal.trim() : targetCity.trim();
        const areaRes = await fetch("/api/shipping/areas?input=" + encodeURIComponent(queryTerm));
        if (areaRes.ok) {
          const areaData = await areaRes.json();
          const list = areaData.areas || (Array.isArray(areaData) ? areaData : []);
          if (list.length > 0) {
            destArea = list[0].id;
            setAreaId(destArea);
          }
        }
      }

      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: destArea,
          destinationAreaId: destArea,
          destinationCity: targetCity,
          postalCode: targetPostal,
          weightGrams: currentWeightGrams * qty,
          items: [{ name: finalItemName, quantity: qty, value: subtotal, weight: currentWeightGrams }],
        }),
      });

      const data = await res.json();
      const list = data.pricing || data.rates || (Array.isArray(data) ? data : []);
      if (list.length > 0) {
        setCouriers(list);
        setCourier(list[0]);
        toast.success(`Ditemukan ${list.length} opsi kurir Biteship`);
      } else {
        toast.info("Layanan kurir reguler disiapkan");
      }
      if (data.resolvedAreaId && !areaId) {
        setAreaId(data.resolvedAreaId);
      }
    } catch {
      toast.error("Gagal menghubungi layanan kurir");
    } finally {
      setLoadingRates(false);
    }
  }

  function handleFindRates() {
    if (!address.city && !address.postalCode) {
      toast.error("Isi kota atau kode pos tujuan dulu");
      return;
    }
    fetchShippingRates();
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          note: customer.note || undefined,
          fulfillment,
          pickupDate: fulfillment === "pickup" ? pickupDate : undefined,
          pickupSlot: fulfillment === "pickup" ? pickupSlot : undefined,
          shippingAddress:
            fulfillment === "delivery"
              ? { ...address, areaId: areaId || "IDJKTBES0000" }
              : undefined,
          courierCompany: fulfillment === "delivery" ? courier?.company : undefined,
          courierCode: fulfillment === "delivery" ? courier?.courierCode : undefined,
          shippingFee,
          subtotal,
          total,
          items: [
            {
              coffeeSlug: coffee.slug,
              coffeeName: finalItemName,
              roastProfileCode: finalProfileCode,
              roastProfileName: finalProfileName,
              grindSize: finalGrind,
              quantity: qty,
              unitPriceIdr: unitPrice,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal membuat pesanan");
        return;
      }
      toast.success("Pesanan dibuat! Lanjut ke pembayaran ✨");
      router.push("/pembayaran/" + data.orderNumber);
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] pb-24 lg:pb-0">
      <div ref={wizardRef} className="scroll-mt-20">
        {/* stepper */}
        <ol className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => {
                  if (i < step) {
                    setStep(i);
                    scrollToWizardTop();
                  }
                }}
                disabled={i > step}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                  i < step
                    ? "metal-green border-transparent text-primary-foreground"
                    : i === step
                      ? "border-gold bg-accent text-gold-deep"
                      : "border-border bg-white text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </button>
              <div className="hidden min-w-0 sm:block">
                <p className={cn("truncate text-xs font-bold", i === step ? "text-primary" : "text-muted-foreground")}>
                  {s.title}
                </p>
                <p className="text-[10px] text-muted-foreground">Langkah {i + 1} dari {STEPS.length}</p>
              </div>
              {i < STEPS.length - 1 && <div className="h-0.5 flex-1 rounded bg-border" />}
            </li>
          ))}
        </ol>

        {/* mobile indicator banner */}
        <div className="mt-3 flex items-center justify-between px-1 text-xs sm:hidden">
          <span className="font-semibold text-muted-foreground">Langkah {step + 1} dari {STEPS.length}</span>
          <span className="font-bold text-green-deep">{STEPS[step]?.title}</span>
        </div>

        <div className="glossy-card mt-5 rounded-2xl border border-border p-5 sm:p-6">
          <div key={step} className="animate-in fade-in slide-in-from-right-3 duration-300">
            {/* =========================================================
                BEVERAGE FLOW (Ready To Drink)
                ========================================================= */}
            {isBeverage && step === 0 && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 text-gold-deep">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Freshly Brewed & Bottled</span>
                  </div>
                  <h2 className="mt-1 font-[var(--font-display)] text-xl font-bold text-green-deep">
                    Kustomisasi Sajian Minuman
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Diseduh segar tiap hari di Biosphere Bar menggunakan espresso murni dan bahan berkualitas tinggi.
                  </p>
                </div>

                {/* Kemasan Info */}
                <div className="rounded-xl border border-border bg-secondary/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Kemasan Produk</span>
                    <Badge variant="gold" className="text-xs font-bold">{coffee.packageType || "Botol Segar"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-foreground/80">
                    Isi bersih: <b>{coffee.volumeMl ? `${coffee.volumeMl} ml` : `${coffee.weightGrams} gram`}</b> • {coffee.origin} ({coffee.process})
                  </p>
                </div>

                {/* Suhu / Es */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Suhu Penyajian
                  </Label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIceOption("cold")}
                      className={cn(
                        "rounded-xl border-2 p-3.5 text-left transition-all",
                        iceOption === "cold"
                          ? "border-gold bg-accent/60 shadow-xs ring-1 ring-gold"
                          : "border-border bg-card hover:border-gold/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">❄️ Dingin Segar (Chilled)</span>
                        {iceOption === "cold" && <Check className="h-4 w-4 text-gold-deep" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Disarankan! Nikmat diminum langsung dalam keadaan dingin.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIceOption("normal")}
                      className={cn(
                        "rounded-xl border-2 p-3.5 text-left transition-all",
                        iceOption === "normal"
                          ? "border-gold bg-accent/60 shadow-xs ring-1 ring-gold"
                          : "border-border bg-card hover:border-gold/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">🌡️ Normal / Suhu Ruang</span>
                        {iceOption === "normal" && <Check className="h-4 w-4 text-gold-deep" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Bisa disimpan di kulkas atau disajikan dengan es batu sendiri.</p>
                    </button>
                  </div>
                </div>

                {/* Tingkat Kemanisan (Sweetness) */}
                {coffee.subCategory !== "single_origin" && coffee.category !== "espresso_pouch" && (
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Tingkat Kemanisan
                    </Label>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                      {[
                        { id: "normal", name: "Manis Pas (Normal)", desc: "Resep standar barista Biosphere" },
                        { id: "less", name: "Less Sweet", desc: "Kemanisan dikurangi 50%" },
                        { id: "none", name: "No Sugar / Murni", desc: "Tanpa tambahan pemanis gula" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSugarOption(s.id as "normal" | "less" | "none")}
                          className={cn(
                            "rounded-xl border-2 p-3 text-left transition-all",
                            sugarOption === s.id
                              ? "border-gold bg-accent/60 shadow-xs ring-1 ring-gold"
                              : "border-border bg-card hover:border-gold/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{s.name}</span>
                            {sugarOption === s.id && <Check className="h-3.5 w-3.5 text-gold-deep" />}
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{s.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Jumlah & Aksi Cepat */}
                <div className="rounded-xl border border-border/70 p-4 pt-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jumlah Pesanan</Label>
                  <div className="mt-3 flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-xl font-extrabold text-primary">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQty((q) => Math.min(30, q + 1))}
                      disabled={qty >= 30}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold text-muted-foreground">
                      = {formatIDR(subtotal)}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 font-bold border-gold/70 text-gold-deep hover:bg-gold/10 h-11"
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                    >
                      {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                      Tambah ke Keranjang
                    </Button>
                    <Button
                      type="button"
                      className="gap-2 font-bold h-11"
                      onClick={nextStep}
                    >
                      Lanjut ke Pengiriman <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                ROASTED BEANS FLOW (Biji Kopi Sangrai)
                ========================================================= */}
            {!isBeverage && step === 0 && (
              <div className="space-y-8">
                {/* PILIHAN UKURAN KEMASAN (100g, 200g, 500g, 1kg) */}
                {coffee.packageVariants && coffee.packageVariants.length > 0 && (
                  <div className="rounded-2xl border border-gold/40 bg-accent/30 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Pilih Ukuran Kemasan Biji Kopi
                      </span>
                      <Badge variant="gold" className="text-xs font-bold">
                        Terpilih: {selectedVariant?.size}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {coffee.packageVariants.map((v) => {
                        const active = selectedVariant?.size === v.size;
                        return (
                          <button
                            key={v.size}
                            type="button"
                            onClick={() => setSelectedVariant(v)}
                            className={cn(
                              "relative rounded-xl border-2 p-3 text-left transition-all",
                              active
                                ? "border-gold bg-accent/80 shadow-xs ring-1 ring-gold"
                                : "border-border bg-card hover:border-gold/50"
                            )}
                          >
                            <p className="text-xs font-bold text-foreground">{v.size}</p>
                            <p className="mt-1 text-sm font-black text-primary">{formatIDR(v.priceIdr)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Metode Seduh Kamu</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Kami rekomendasikan profil sangrai terbaik sesuai alat seduhmu.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {BREW_METHODS.map((m) => {
                      const active = brew === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setBrew(m.id)}
                          className={cn(
                            "group rounded-xl border-2 p-3.5 text-left transition-all",
                            active
                              ? "border-gold bg-accent/60 shadow-sm"
                              : "border-border bg-white hover:border-gold/50"
                          )}
                        >
                          <span className="text-2xl">{m.icon}</span>
                          <p className="mt-2 text-sm font-bold text-green-deep">{m.name}</p>
                          <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Profil Rasa Favorit</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {TASTE_PROFILES.map((t) => {
                      const active = taste === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTaste(t.id)}
                          className={cn(
                            "rounded-xl border-2 p-4 text-left transition-all",
                            active
                              ? "border-gold bg-accent/60 shadow-sm"
                              : "border-border bg-white hover:border-gold/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-green-deep">{t.name}</p>
                            {active && <Check className="h-4 w-4 text-gold-deep" />}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* rekomendasi roasting */}
                <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-accent/50 to-secondary/30 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-gold-deep" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gold-deep">
                        Rekomendasi Roaster Biosphere
                      </span>
                    </div>
                    {!manualRoast && (
                      <Badge variant="outline" className="border-gold text-gold-deep">
                        Dipilih Otomatis
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 font-[var(--font-display)] text-lg font-bold text-green-deep">
                    {roastProfile.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{recommendation.reason}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      variant={manualRoast ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => setManualRoast((m) => !m)}
                      className="text-xs"
                    >
                      {manualRoast ? "Tutup Pemilihan Manual" : "Pilih profil roasting manual"}
                    </Button>
                    {manualRoast && (
                      <span className="text-xs text-muted-foreground">Pilih bebas di bawah:</span>
                    )}
                  </div>

                  {manualRoast && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {ROAST_PROFILES.map((p) => {
                        const active = roast === p.level;
                        return (
                          <button
                            key={p.level}
                            onClick={() => setRoast(p.level)}
                            className={cn(
                              "rounded-xl border-2 p-3 text-left transition-all",
                              active
                                ? "border-gold bg-white shadow-sm"
                                : "border-border bg-white/70 hover:border-gold/50"
                            )}
                          >
                            <p className="text-xs font-bold text-green-deep">{p.name}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{p.notes.join(" • ")}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 1 FOR BEANS: GILINGAN & JUMLAH */}
            {!isBeverage && step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Tingkat Gilingan</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pilih ukuran gilingan sesuai alat seduh yang kamu gunakan di rumah.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {GRIND_SIZES.map((g) => {
                      const active = grind === g.id;
                      return (
                        <button
                          key={g.id}
                          onClick={() => setGrind(g.id)}
                          className={cn(
                            "rounded-xl border-2 p-4 text-left transition-all",
                            active
                              ? "border-gold bg-accent/60 shadow-sm"
                              : "border-border bg-white hover:border-gold/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{g.icon}</span>
                              <p className="text-sm font-bold text-green-deep">{g.name}</p>
                            </div>
                            {active && <Check className="h-4 w-4 text-gold-deep" />}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{g.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Jumlah Kemasan</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Ukuran kemasan: <b>{sizeLabel}</b>.</p>
                  <div className="mt-4 flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-xl font-extrabold text-primary">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQty((q) => Math.min(20, q + 1))}
                      disabled={qty >= 20}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      = {qty * currentWeightGrams}g • {formatIDR(subtotal)}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 font-bold border-gold/70 text-gold-deep hover:bg-gold/10 h-11"
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                    >
                      {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                      Tambah ke Keranjang
                    </Button>
                    <Button
                      type="button"
                      className="gap-2 font-bold h-11"
                      onClick={nextStep}
                    >
                      Lanjut Beli Langsung <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: JADWAL & PENGIRIMAN (Step 1 for beverage, Step 2 for beans) */}
            {step === scheduleStepIndex && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Metode Pemenuhan</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isBeverage
                      ? "Minuman diseduh segar setiap hari. Bisa diambil langsung di Biosphere Bar Bandung atau dikirim kurir instan/sameday ke alamatmu."
                      : "Kopi di-roasting segar sesuai jadwal. Kamu bisa ambil langsung di roastery atau kami kirim ke alamatmu."}
                  </p>
                </div>

                <Tabs value={fulfillment} onValueChange={(v) => setFulfillment(v as "pickup" | "delivery")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pickup" className="gap-2">
                      <CalendarClock className="h-4 w-4" /> Ambil Sendiri (Pickup)
                    </TabsTrigger>
                    <TabsTrigger value="delivery" className="gap-2">
                      <Truck className="h-4 w-4" /> Kirim Kurir (Delivery)
                    </TabsTrigger>
                  </TabsList>

                  {/* Pickup */}
                  <TabsContent value="pickup" className="mt-5 space-y-5">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Pilih Hari Pengambilan
                      </Label>
                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        {pickupDays.slice(0, 6).map((day) => {
                          const active = pickupDate === day.date;
                          return (
                            <button
                              key={day.date}
                              type="button"
                              onClick={() => setPickupDate(day.date)}
                              disabled={!day.available}
                              className={cn(
                                "flex items-center justify-between rounded-xl border-2 p-3.5 text-left transition-all",
                                active
                                  ? "border-gold bg-accent/60 shadow-sm"
                                  : day.available
                                    ? "border-border bg-white hover:border-gold/50"
                                    : "border-border bg-secondary/50 opacity-40 cursor-not-allowed"
                              )}
                            >
                              <div>
                                <p className="text-sm font-bold text-green-deep">
                                  {day.weekday}, {formatDateID(new Date(day.date + "T00:00:00"))}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {day.available ? `Sisa slot: ${day.remainingBags} pesanan` : "Slot penuh"}
                                </p>
                              </div>
                              {active && <Check className="h-4 w-4 text-gold-deep" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Pilih Slot Jam Ambil
                      </Label>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {PICKUP_SLOTS.map((slot) => {
                          const active = pickupSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setPickupSlot(slot)}
                              className={cn(
                                "rounded-xl border-2 p-3 text-center text-xs font-bold transition-all",
                                active
                                  ? "border-gold bg-accent/60 shadow-sm text-gold-deep"
                                  : "border-border bg-white text-muted-foreground hover:border-gold/50"
                              )}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
                      📍 <b>Lokasi Roastery:</b> Biosphere Roast Works, Jl. Cihampelas / Sumur Bandung, Kota Bandung.
                    </div>
                  </TabsContent>

                  {/* Delivery */}
                  <TabsContent value="delivery" className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Nama Penerima</Label>
                        <Input
                          value={address.name}
                          onChange={(e) => setAddress({ ...address, name: e.target.value })}
                          placeholder="Nama lengkap"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Nomor HP</Label>
                        <Input
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="relative">
                        <Label className="text-xs font-semibold">Kota / Kecamatan Tujuan *</Label>
                        <Input
                          value={address.city}
                          onChange={(e) => {
                            setAddress({ ...address, city: e.target.value });
                            setAreaId("");
                          }}
                          onFocus={() => {
                            if (areaResults.length > 0) setShowAreaDropdown(true);
                          }}
                          placeholder="Ketik kecamatan/kota (mis. Citeureup)"
                        />
                        {searchingAreas && (
                          <div className="absolute right-3 top-8 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-deep" />
                          </div>
                        )}
                        {showAreaDropdown && areaResults.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-1 text-xs shadow-xl backdrop-blur-md">
                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                              Pilih Area Biteship
                            </div>
                            {areaResults.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => handleSelectArea(a)}
                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground text-xs flex items-center justify-between gap-2"
                              >
                                <span className="line-clamp-1">{a.name}</span>
                                <span className="text-[10px] font-mono text-gold-deep shrink-0">Pilih</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {areaId && (
                          <p className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                            <Check className="h-3 w-3" /> Area terverifikasi Biteship
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Kode Pos</Label>
                        <Input
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          placeholder="mis. 16810"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Alamat Lengkap *</Label>
                      <Textarea
                        value={address.address}
                        onChange={(e) => setAddress({ ...address, address: e.target.value })}
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
                        rows={2}
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleFindRates}
                        disabled={loadingRates || (!address.city && !address.postalCode)}
                        className="w-full gap-2 font-bold"
                      >
                        {loadingRates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                        Cek Pilihan Kurir & Ongkir (Biteship)
                      </Button>
                    </div>

                    {couriers.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Pilih Layanan Kurir
                        </Label>
                        <div className="grid gap-2">
                          {couriers.map((c) => {
                            const active = courier?.courierCode === c.courierCode;
                            return (
                              <button
                                key={c.courierCode}
                                type="button"
                                onClick={() => setCourier(c)}
                                className={cn(
                                  "flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all",
                                  active
                                    ? "border-gold bg-accent/60 shadow-sm"
                                    : "border-border bg-white hover:border-gold/50"
                                )}
                              >
                                <div>
                                  <p className="text-xs font-bold text-green-deep">{c.courierName}</p>
                                  <p className="text-[11px] text-muted-foreground">Estimasi: {c.duration}</p>
                                </div>
                                <span className="font-extrabold text-primary text-sm">{formatIDR(c.price)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* STEP: DATA & BAYAR (Last step) */}
            {step === checkoutStepIndex && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Data Pemesan</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Konfirmasi pesanan dan tautan pelacakan status akan dikirimkan ke email dan nomor WhatsApp ini.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Nama Lengkap</Label>
                    <Input
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Nama kamu"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Email Aktif</Label>
                      <Input
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        placeholder="nama@email.com"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Nomor WhatsApp / HP</Label>
                      <Input
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Catatan Khusus (Opsional)</Label>
                    <Input
                      value={customer.note}
                      onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                      placeholder="mis. titip di pos sekuriti / es batu dipisah"
                    />
                  </div>

                  <p className="mt-4 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    🔒 Pembayaran aman diproses oleh <b>DOKU</b> (QRIS, BCA, Mandiri, BRI, BNI, Permata, AstraPay). Status pesanan diperbarui otomatis real-time.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigasi inline desktop */}
          <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
            <Button variant="ghost" onClick={prevStep} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Kembali
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={nextStep}>
                Lanjut <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="gold" size="lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4" />}
                Buat Pesanan — {formatIDR(total)}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan sidebar (desktop) */}
      <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
        <div className="glossy-card rounded-2xl border border-border p-5">
          <h3 className="font-[var(--font-display)] text-base font-bold text-green-deep">Ringkasan Pesanan</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Menu</span>
              <span className="text-right font-semibold">{coffee.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Varian / Kemasan</span>
              <span className="text-right font-semibold">{sizeLabel}</span>
            </div>
            {!isBeverage ? (
              <>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Profil Sangrai</span>
                  <span className="text-right font-semibold">{roastProfile.name}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Gilingan</span>
                  <span className="text-right font-semibold">{grindLabel}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Suhu</span>
                  <span className="text-right font-semibold">
                    {iceOption === "cold" ? "Dingin Segar" : "Normal Ruang"}
                  </span>
                </div>
                {coffee.subCategory !== "single_origin" && coffee.category !== "espresso_pouch" && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Kemanisan</span>
                    <span className="text-right font-semibold">
                      {sugarOption === "less" ? "Less Sweet" : sugarOption === "none" ? "No Sugar" : "Normal"}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Jumlah</span>
              <span className="font-semibold">{qty} item</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Metode</span>
              <span className="font-semibold">{fulfillment === "pickup" ? "Ambil di Roastery" : "Dikirim Kurir"}</span>
            </div>
            {fulfillment === "pickup" && pickupDate && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Ambil</span>
                <span className="font-semibold text-xs">
                  {formatDateID(new Date(pickupDate + "T00:00:00"))}, {pickupSlot}
                </span>
              </div>
            )}
            {fulfillment === "delivery" && courier && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Kurir</span>
                <span className="font-semibold">{courier.courierName}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatIDR(subtotal)}</span>
            </div>
            {fulfillment === "delivery" && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ongkir</span>
                <span className="font-semibold">{formatIDR(shippingFee)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-border/70 pt-3">
              <span className="font-bold text-green-deep">Total</span>
              <span className="text-xl font-extrabold text-primary">{formatIDR(total)}</span>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-gold/70 text-gold-deep hover:bg-gold/10 font-bold h-11"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                Tambah ke Keranjang
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-white/95 px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[calc(env(safe-area-inset-bottom,0px)+12px)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileRecapOpen((v) => !v)}
            className="flex flex-col text-left transition-opacity hover:opacity-80"
            aria-label="Lihat ringkasan pesanan"
          >
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              Total <ChevronUp className={cn("h-3.5 w-3.5 transition-transform duration-200", mobileRecapOpen && "rotate-180")} />
            </span>
            <span className="text-base font-extrabold text-primary leading-tight">{formatIDR(total)}</span>
            <span className="truncate text-[10px] text-muted-foreground max-w-[140px]">
              {sizeLabel} • {qty}x
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="h-10 px-3 border-gold/70 text-gold-deep"
              aria-label="Tambah ke Keranjang"
            >
              {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
            </Button>
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="h-10 px-3"
                aria-label="Kembali"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={nextStep} className="h-10 px-5 font-bold shadow-sm">
                Lanjut <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="gold"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-10 px-4 font-bold shadow-sm"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4" />}
                Bayar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile recap drawer */}
      {mobileRecapOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-200">
          <div className="fixed inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-border bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-[var(--font-display)] text-lg font-bold text-green-deep">Ringkasan Pesanan</h3>
                <p className="text-xs text-muted-foreground">{coffee.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileRecapOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
                aria-label="Tutup ringkasan"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Varian / Kemasan</span>
                <span className="font-semibold">{sizeLabel}</span>
              </div>
              {!isBeverage ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profil Sangrai</span>
                    <span className="font-semibold">{roastProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gilingan</span>
                    <span className="font-semibold">{grindLabel}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Penyajian</span>
                  <span className="font-semibold">
                    {iceOption === "cold" ? "Dingin" : "Normal"}, {sugarOption}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-semibold">{qty} item</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatIDR(subtotal)}</span>
              </div>
              {shippingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ongkir</span>
                  <span className="font-semibold">{formatIDR(shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold text-primary">
                <span>Total</span>
                <span>{formatIDR(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
