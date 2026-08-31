"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Package,
  Plus,
  Sparkles,
  Truck,
  User,
} from "lucide-react";
import { toast } from "sonner";
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

  const recommendation = useMemo(() => recommendRoast(brew, taste, coffee.type), [brew, taste, coffee.type]);

  useEffect(() => {
    if (!manualRoast) setRoast(recommendation.level);
  }, [recommendation, manualRoast]);

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

  const roastProfile = ROAST_PROFILES.find((r) => r.level === roast) ?? ROAST_PROFILES[1];
  const grindLabel = GRIND_SIZES.find((g) => g.id === grind)?.name ?? grind;

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
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        {/* stepper */}
        <ol className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
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

        <div className="glossy-card mt-6 rounded-2xl border border-border p-6">
          {/* ===== LANGKAH 1: PROFIL ROASTING ===== */}
          {step === 0 && (
            <div className="space-y-8">
              <div>
                <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Metode Seduh Kamu</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {BREW_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setBrew(m.id)}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all",
                        brew === m.id ? "border-primary bg-secondary/70" : "border-border bg-white hover:border-primary/30"
                      )}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <p className="mt-1 text-xs font-bold leading-tight">{m.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Selera Kamu</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {TASTE_PROFILES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTaste(t.id)}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all",
                        taste === t.id ? "border-primary bg-secondary/70" : "border-border bg-white hover:border-primary/30"
                      )}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <p className="mt-1 text-xs font-bold leading-tight">{t.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gold/40 bg-accent/70 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-gold-deep">
                  <Sparkles className="h-4 w-4" /> Rekomendasi Kami: {recommendation.level === "light" ? "Light Roast" : recommendation.level === "medium" ? "Medium Roast" : recommendation.level === "medium_dark" ? "Medium Dark Roast" : "Dark Roast"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-accent-foreground/90">{recommendation.reason}</p>
              </div>

              <div>
                <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Pilih Profil Roasting</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {ROAST_PROFILES.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => {
                        setRoast(r.level);
                        setManualRoast(true);
                      }}
                      className={cn(
                        "relative rounded-xl border-2 p-4 text-left transition-all",
                        roast === r.level
                          ? "border-gold bg-white shadow-md"
                          : "border-border bg-white/60 hover:border-gold/50"
                      )}
                    >
                      {r.level === recommendation.level && (
                        <Badge variant="gold" className="absolute -top-2.5 right-3">Direkomendasikan</Badge>
                      )}
                      <p className="text-sm font-bold text-green-deep">{r.name}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{r.description}</p>
                      <p className="mt-2 flex flex-wrap gap-1">
                        {r.notes.map((n) => (
                          <span key={n} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">{n}</span>
                        ))}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== LANGKAH 2: GILINGAN ===== */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Pilih Gilingan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Belum punya grinder? Kami gilingkan sesuai metode seduhmu. Punya grinder? Pilih biji utuh agar makin fresh.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {GRIND_SIZES.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGrind(g.id as GrindSize)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-all",
                        grind === g.id ? "border-gold bg-white shadow-md" : "border-border bg-white/60 hover:border-gold/50"
                      )}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <p className="mt-2 text-sm font-bold text-green-deep">{g.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Jumlah</h2>
                <div className="mt-4 inline-flex items-center gap-4 rounded-xl border border-border bg-white p-2">
                  <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-8 text-center text-lg font-extrabold text-primary">{qty}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Tambah">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {qty} x {coffee.weightGrams}g = {qty * coffee.weightGrams}g total
                </p>
              </div>
            </div>
          )}

          {/* ===== LANGKAH 3: JADWAL ===== */}
          {step === 2 && (
            <div className="space-y-6">
              <Tabs value={fulfillment} onValueChange={(v) => setFulfillment(v as "pickup" | "delivery")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pickup">🏠 Ambil di Roastery</TabsTrigger>
                  <TabsTrigger value="delivery">🚚 Kirim ke Alamat</TabsTrigger>
                </TabsList>

                <TabsContent value="pickup" className="space-y-6">
                  <div className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                    📅 <b>Tanggal pesan:</b> {formatDateID(new Date())}. Roasting dimulai setelah pembayaran diterima,
                    lalu kopi di-resting ±{ROAST_LEAD_DAYS} hari. Tanggal ambil tercepat adalah {ROAST_LEAD_DAYS} hari dari sekarang.
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-green-deep">Pilih Tanggal Ambil</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {pickupDays.slice(0, 8).map((d) => (
                        <button
                          key={d.date}
                          onClick={() => d.available && setPickupDate(d.date)}
                          disabled={!d.available}
                          className={cn(
                            "rounded-xl border-2 p-3 text-center transition-all",
                            pickupDate === d.date
                              ? "border-gold bg-accent"
                              : d.available
                                ? "border-border bg-white hover:border-primary/40"
                                : "cursor-not-allowed border-border bg-muted opacity-50"
                          )}
                        >
                          <p className="text-xs font-bold text-green-deep">{d.weekday}</p>
                          <p className="text-lg font-extrabold text-primary">
                            {new Date(d.date + "T00:00:00").getDate()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {d.available ? "sisa " + d.remainingBags + " slot" : "penuh"}
                          </p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Slot dihitung otomatis dari kapasitas antrian roasting ({ROAST_LEAD_DAYS} hari kerja sebelumnya).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-green-deep">Pilih Jam Kedatangan</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PICKUP_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setPickupSlot(slot)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                            pickupSlot === slot ? "metal-green border-transparent text-primary-foreground" : "border-border bg-white text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="delivery" className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nama Penerima</Label>
                      <Input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="Nama lengkap" />
                    </div>
                    <div className="space-y-2">
                      <Label>No. HP Penerima</Label>
                      <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
                    </div>
                    <div className="space-y-2">
                      <Label>Kota / Kabupaten</Label>
                      <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="contoh: Bandung" />
                    </div>
                    <div className="space-y-2">
                      <Label>Kode Pos (opsional)</Label>
                      <Input value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} placeholder="40123" />
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
                              ? "border-gold bg-accent/60"
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

          {/* ===== LANGKAH 4: DATA ===== */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-[var(--font-display)] text-xl font-bold text-green-deep">Data Pemesan</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nama</Label>
                    <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Nama lengkap" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="kamu@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>No. HP</Label>
                    <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan (opsional)</Label>
                    <Input value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} placeholder="mis. jangan digiling" />
                  </div>
                </div>
                <p className="mt-3 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  🔒 Pembayaran diproses oleh <b>Doku</b> (VA, e-wallet, QRIS). Link status pesanan akan dikirim ke
                  emailmu — tanpa perlu membuat akun.
                </p>
              </div>
            </div>
          )}

          {/* navigasi */}
          <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
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

      {/* ringkasan */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
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
          </div>
        </div>
      </aside>
    </div>
  );
}
