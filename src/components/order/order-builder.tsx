"use client";

import { useMemo, useRef, useState } from "react";
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
import { PICKUP_SLOTS, ROAST_LEAD_DAYS, formatIDR, formatDateID } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CatalogCoffee, GrindSize } from "@/lib/types";

const STEPS = [
  { title: "Profil Roasting", icon: Sparkles },
  { title: "Gilingan", icon: Package },
  { title: "Jadwal", icon: CalendarClock },
  { title: "Data & Bayar", icon: User },
];

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

  const [step, setStep] = useState(0);
  const [brew, setBrew] = useState("v60");
  const [taste, setTaste] = useState("balanced");
  const [roast, setRoast] = useState("medium");
  const [manualRoast, setManualRoast] = useState(false);
  const [grind, setGrind] = useState<GrindSize>("medium");
  const [qty, setQty] = useState(1);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState<string>(PICKUP_SLOTS[0]);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [areaId, setAreaId] = useState("");
  const [courier, setCourier] = useState<CourierOption | null>(null);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [submitting, setSubmitting] = useState(false);
  const [mobileRecapOpen, setMobileRecapOpen] = useState(false);

  const recommendation = useMemo(() => recommendRoast(brew, taste, coffee.type), [brew, taste, coffee.type]);

  // Profil efektif: ikut rekomendasi otomatis sampai user memilih manual
  const effectiveRoast = manualRoast ? roast : recommendation.level;

  const { data: pickupDays = [] } = useQuery<PickupDay[]>({
    queryKey: ["pickup-slots"],
    queryFn: async () => {
      const res = await fetch("/api/pickup-slots", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat jadwal");
      return res.json();
    },
  });

  const subtotal = coffee.priceIdr * qty;
  const shippingFee = fulfillment === "delivery" ? courier?.price ?? 0 : 0;
  const total = subtotal + shippingFee;

  const roastProfile = ROAST_PROFILES.find((r) => r.level === effectiveRoast) ?? ROAST_PROFILES[1];
  const grindLabel = GRIND_SIZES.find((g) => g.id === grind)?.name ?? grind;

  const { addItem, openCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  async function handleAddToCart() {
    setAddingToCart(true);
    const ok = await addItem({
      coffeeSlug: coffee.slug,
      coffeeName: coffee.name,
      roastProfileCode: roastProfile.code,
      roastProfileName: roastProfile.name,
      grindSize: grind,
      quantity: qty,
      unitPriceIdr: coffee.priceIdr,
      weightGrams: coffee.weightGrams,
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

  function canContinue(): { ok: boolean; reason?: string } {
    if (step === 2) {
      if (fulfillment === "pickup" && !pickupDate) return { ok: false, reason: "Pilih tanggal ambil terlebih dahulu" };
      if (fulfillment === "delivery") {
        if (!address.name || !address.phone || !address.address || !address.city)
          return { ok: false, reason: "Lengkapi alamat pengiriman" };
        if (!courier) return { ok: false, reason: "Cari ongkir & pilih kurir terlebih dahulu" };
      }
    }
    if (step === 3) {
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

  async function handleFindRates() {
    if (!address.city) {
      toast.error("Isi kota tujuan dulu");
      return;
    }
    setLoadingRates(true);
    try {
      let destArea = areaId;
      if (!destArea) {
        const areaRes = await fetch("/api/shipping/areas?q=" + encodeURIComponent(address.city), { cache: "no-store" });
        if (areaRes.ok) {
          const areas = await areaRes.json();
          destArea = areas[0]?.id ?? "IDJKTBES0000";
          setAreaId(destArea);
        }
      }
      const rateRes = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: destArea,
          items: [{ name: coffee.name, value: coffee.priceIdr, weight: coffee.weightGrams, quantity: qty }],
        }),
      });
      if (!rateRes.ok) throw new Error();
      const rates = (await rateRes.json()) as CourierOption[];
      setCouriers(rates);
      setCourier(null);
      toast.success("Ongkir termuat — pilih kurir favoritmu");
    } catch {
      toast.error("Gagal memuat ongkir. Coba lagi.");
    } finally {
      setLoadingRates(false);
    }
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
              coffeeName: coffee.name,
              roastProfileCode: roastProfile.code,
              roastProfileName: roastProfile.name,
              grindSize: grind,
              quantity: qty,
              unitPriceIdr: coffee.priceIdr,
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
                <p className="text-[10px] text-muted-foreground">Langkah {i + 1} dari 4</p>
              </div>
              {i < STEPS.length - 1 && <div className="h-0.5 flex-1 rounded bg-border" />}
            </li>
          ))}
        </ol>

        {/* mobile indicator banner */}
        <div className="mt-3 flex items-center justify-between px-1 text-xs sm:hidden">
          <span className="font-semibold text-muted-foreground">Langkah {step + 1} dari 4</span>
          <span className="font-bold text-green-deep">{STEPS[step].title}</span>
        </div>

        <div className="glossy-card mt-5 rounded-2xl border border-border p-5 sm:p-6">
          {/* Animated step content wrapper */}
          <div key={step} className="animate-in fade-in slide-in-from-right-3 duration-300">
            {/* ===== LANGKAH 1: PROFIL ROASTING ===== */}
            {step === 0 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Metode Seduh Kamu</h2>
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
                        Rekomendasi Roaster
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

            {/* ===== LANGKAH 2: GILINGAN & JUMLAH ===== */}
            {step === 1 && (
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
                  <p className="mt-1 text-xs text-muted-foreground">Tiap bungkus berisi {coffee.weightGrams} gram.</p>
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
                      = {qty * coffee.weightGrams}g • {formatIDR(subtotal)}
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

            {/* ===== LANGKAH 3: JADWAL / PENGIRIMAN ===== */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Metode Pemenuhan</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kopi di-roasting segar sesuai jadwal. Kamu bisa ambil langsung di roastery atau kami kirim ke alamatmu.
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
                  <TabsContent value="pickup" className="mt-6 space-y-5">
                    <div>
                      <Label className="text-sm font-bold">Pilih Tanggal Pengambilan</Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Dihitung dari lead-time roasting {ROAST_LEAD_DAYS} hari + resting biji.
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {pickupDays.map((d) => {
                          const active = pickupDate === d.date;
                          return (
                            <button
                              key={d.date}
                              disabled={!d.available}
                              onClick={() => setPickupDate(d.date)}
                              className={cn(
                                "rounded-xl border-2 p-3 text-left transition-all",
                                active
                                  ? "border-gold bg-accent/60 shadow-sm"
                                  : d.available
                                    ? "border-border bg-white hover:border-gold/50"
                                    : "cursor-not-allowed border-border/40 bg-muted/40 opacity-50"
                              )}
                            >
                              <p className="text-xs font-bold capitalize text-green-deep">{d.weekday}</p>
                              <p className="text-sm font-extrabold text-foreground">
                                {new Date(d.date + "T00:00:00").getDate()}{" "}
                                {new Date(d.date + "T00:00:00").toLocaleString("id-ID", { month: "short" })}
                              </p>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {d.available ? `Sisa ${d.remainingBags} slot` : "Penuh"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-bold">Pilih Slot Jam Ambil</Label>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {PICKUP_SLOTS.map((slot) => {
                          const active = pickupSlot === slot;
                          return (
                            <button
                              key={slot}
                              onClick={() => setPickupSlot(slot)}
                              className={cn(
                                "rounded-xl border-2 p-3 text-center text-sm font-semibold transition-all",
                                active
                                  ? "border-gold bg-accent/60 text-gold-deep shadow-sm"
                                  : "border-border bg-white hover:border-gold/50"
                              )}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <p className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                      📍 <b>Lokasi Roastery:</b> ACHO Coffee Lab, Jl. Riau No. 42, Bandung. Datang sesuai tanggal & jam slot.
                    </p>
                  </TabsContent>

                  {/* Delivery */}
                  <TabsContent value="delivery" className="mt-6 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nama Penerima</Label>
                        <Input
                          value={address.name}
                          onChange={(e) => setAddress({ ...address, name: e.target.value })}
                          placeholder="Nama lengkap"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No. HP Penerima</Label>
                        <Input
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kota / Kabupaten</Label>
                        <Input
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          placeholder="contoh: Bandung"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kode Pos (opsional)</Label>
                        <Input
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          placeholder="40123"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Alamat Lengkap</Label>
                        <Textarea
                          value={address.address}
                          onChange={(e) => setAddress({ ...address, address: e.target.value })}
                          placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, patokan"
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={handleFindRates} disabled={loadingRates}>
                        {loadingRates ? <Loader2 className="animate-spin" /> : <Truck className="h-4 w-4" />}
                        Cari Ongkir
                      </Button>
                      <p className="text-xs text-muted-foreground">Kurir: JNE, J&T, SiCepat, AnterAja (via Biteship)</p>
                    </div>

                    {couriers.length > 0 && (
                      <div className="space-y-2">
                        {couriers.map((c) => (
                          <button
                            key={c.company + c.courierCode}
                            onClick={() => setCourier(c)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                              courier?.company === c.company && courier?.courierCode === c.courierCode
                                ? "border-gold bg-accent/60 shadow-sm"
                                : "border-border bg-white hover:border-gold/50"
                            )}
                          >
                            <div>
                              <p className="text-sm font-bold text-green-deep">{c.courierName}</p>
                              <p className="text-xs text-muted-foreground">Estimasi {c.duration}</p>
                            </div>
                            <p className="text-sm font-extrabold text-primary">{formatIDR(c.price)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* ===== LANGKAH 4: DATA & BAYAR ===== */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Data Pemesan</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <Input
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        placeholder="Nama lengkap"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        placeholder="kamu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>No. HP</Label>
                      <Input
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan (opsional)</Label>
                      <Input
                        value={customer.note}
                        onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                        placeholder="mis. jangan digiling"
                      />
                    </div>
                  </div>
                  <p className="mt-4 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    🔒 Pembayaran diproses oleh <b>Doku</b> (VA, e-wallet, QRIS). Link status pesanan akan dikirim ke
                    emailmu — tanpa perlu membuat akun.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* navigasi inline (terutama untuk desktop) */}
          <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
            <Button variant="ghost" onClick={prevStep} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Kembali
            </Button>
            {step < 3 ? (
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

      {/* ringkasan sidebar (desktop) */}
      <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
        <div className="glossy-card rounded-2xl border border-border p-5">
          <h3 className="font-[var(--font-display)] text-base font-bold text-green-deep">Ringkasan Pesanan</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Kopi</span>
              <span className="text-right font-semibold">{coffee.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Profil</span>
              <span className="text-right font-semibold">{roastProfile.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Gilingan</span>
              <span className="text-right font-semibold">{grindLabel}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Jumlah</span>
              <span className="font-semibold">{qty} x {coffee.weightGrams}g</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Metode</span>
              <span className="font-semibold">{fulfillment === "pickup" ? "Ambil di Roastery" : "Dikirim"}</span>
            </div>
            {fulfillment === "pickup" && pickupDate && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Ambil</span>
                <span className="font-semibold">
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
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              * Biaya kanal pembayaran (VA/e-wallet/QRIS) ditambahkan di halaman pembayaran sesuai ketentuan Doku.
            </p>
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

      {/* ===== MOBILE STICKY BOTTOM ACTION BAR ===== */}
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
              {roastProfile.name} • {grindLabel}
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
            {step < 3 ? (
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

      {/* ===== MOBILE RECAP BOTTOM DRAWER MODAL ===== */}
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Tutup ringkasan"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Profil Roasting</span>
                <span className="text-right font-semibold">{roastProfile.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Ukuran Gilingan</span>
                <span className="text-right font-semibold">{grindLabel}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-semibold">{qty} x {coffee.weightGrams}g</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Metode</span>
                <span className="font-semibold">{fulfillment === "pickup" ? "Ambil di Roastery" : "Dikirim"}</span>
              </div>
              {fulfillment === "pickup" && pickupDate && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Jadwal Ambil</span>
                  <span className="font-semibold">
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
            </div>

            <Button
              className="mt-6 w-full font-bold"
              onClick={() => setMobileRecapOpen(false)}
            >
              Tutup Ringkasan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
