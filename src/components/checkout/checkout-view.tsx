"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Coffee,
  Home,
  Loader2,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart/cart-context";
import { formatIDR, formatDateID, GRIND_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import type { CourierRate, PickupSlotInfo, UserAddressRecord } from "@/lib/types";

const DEFAULT_COURIERS: CourierRate[] = [
  {
    courierCode: "jne",
    courierName: "JNE Regular",
    courierServiceName: "REG",
    price: 18000,
    etd: "2 - 3 hari",
  },
  {
    courierCode: "sicepat",
    courierName: "SiCepat BEST",
    courierServiceName: "BEST",
    price: 24000,
    etd: "1 - 2 hari",
  },
];

export function CheckoutView({
  initialUser,
}: {
  initialUser: { email?: string; name?: string } | null;
}) {
  const router = useRouter();
  const {
    items,
    totalCount,
    subtotal,
    totalWeightGrams,
    appliedVoucher,
    wholesaleDiscount,
    applyVoucherCode,
    removeVoucher,
    clearCartItems,
    loading: cartLoading,
  } = useCart();

  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("delivery");

  // Pickup states
  const [slots, setSlots] = useState<PickupSlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState("14:00 - 17:00 WIB");

  // Delivery states
  const [shippingName, setShippingName] = useState(initialUser?.name ?? "");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("Jakarta");
  const [postalCode, setPostalCode] = useState("");
  const [areaId, setAreaId] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [areaResults, setAreaResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searchingAreas, setSearchingAreas] = useState(false);

  // Saved addresses from address book
  const [savedAddresses, setSavedAddresses] = useState<UserAddressRecord[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "manual">("manual");
  const [saveToBook, setSaveToBook] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Rumah");

  // Couriers
  const [couriers, setCouriers] = useState<CourierRate[]>(DEFAULT_COURIERS);
  const [selectedCourier, setSelectedCourier] = useState<CourierRate | null>(DEFAULT_COURIERS[0]);
  const [loadingRates, setLoadingRates] = useState(false);

  // Customer Contact
  const [customerName, setCustomerName] = useState(initialUser?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(initialUser?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");

  // Voucher input
  const [voucherInput, setVoucherInput] = useState("");
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // Fetch pickup slots
  useEffect(() => {
    if (fulfillment !== "pickup") return;
    let active = true;
    fetch("/api/pickup-slots")
      .then((r) => r.json())
      .then((data: PickupSlotInfo[]) => {
        if (!active) return;
        setSlots(data);
        const firstAvail = data.find((s) => s.available);
        if (firstAvail) setPickupDate(firstAvail.date);
        setLoadingSlots(false);
      })
      .catch(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [fulfillment]);

  // Fetch saved addresses for logged-in user
  useEffect(() => {
    if (!initialUser?.email) return;
    let active = true;
    fetch("/api/user/addresses")
      .then((r) => r.json())
      .then((data: { addresses?: UserAddressRecord[] }) => {
        if (!active) return;
        const addrs = data.addresses || [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) {
          setSelectedAddressId(def.id);
          setShippingName(def.recipientName);
          setShippingPhone(def.phone);
          setShippingAddress(def.address);
          setShippingCity(def.city);
          setPostalCode(def.postalCode);
          setAreaId(def.areaId ?? "");
          setAreaSearch(def.areaName ?? "");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialUser?.email]);

  // Search Biteship areas
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!areaSearch || areaSearch.length < 3) {
        setAreaResults([]);
        return;
      }
      setSearchingAreas(true);
      try {
        const res = await fetch("/api/shipping/areas?input=" + encodeURIComponent(areaSearch));
        if (res.ok) {
          const data = await res.json();
          setAreaResults(data.areas || []);
        }
      } catch {
        // noop
      } finally {
        setSearchingAreas(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [areaSearch]);

  // Fetch shipping rates when areaId, postalCode, or items change
  useEffect(() => {
    if (fulfillment !== "delivery") return;
    if (!areaId && !postalCode && !shippingCity) return;
    let active = true;

    const timer = setTimeout(() => {
      setLoadingRates(true);
      fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: areaId || undefined,
          destinationAreaId: areaId || undefined,
          destinationCity: shippingCity || undefined,
          postalCode: postalCode || undefined,
          items: items.map((i) => ({
            name: `${i.coffeeName} (${i.roastProfileName})`,
            value: i.unitPriceIdr,
            quantity: i.quantity,
            weight: i.weightGrams ?? 250,
          })),
        }),
      })
        .then((r) => r.json())
        .then((data: { rates?: CourierRate[]; pricing?: CourierRate[]; resolvedAreaId?: string }) => {
          if (!active) return;
          const list = data.rates || data.pricing || (Array.isArray(data) ? data : []);
          if (list && list.length > 0) {
            setCouriers(list);
            setSelectedCourier(list[0]);
          }
          if (data.resolvedAreaId && !areaId) {
            setAreaId(data.resolvedAreaId);
          }
          setLoadingRates(false);
        })
        .catch(() => {
          if (active) setLoadingRates(false);
        });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fulfillment, areaId, postalCode, shippingCity, items]);

  const rawShippingFee = fulfillment === "delivery" ? selectedCourier?.price ?? 18000 : 0;
  const wholesaleAmount = wholesaleDiscount.discountAmount;
  let voucherDiscount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  if (appliedVoucher?.code === "FREESHIP") {
    voucherDiscount = rawShippingFee;
  }
  const effectiveShippingFee = appliedVoucher?.code === "FREESHIP" ? 0 : rawShippingFee;
  const totalDiscount = wholesaleAmount + (appliedVoucher?.code === "FREESHIP" ? 0 : voucherDiscount);
  const grandTotal = Math.max(0, subtotal + effectiveShippingFee - totalDiscount);

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

  async function handlePlaceOrder() {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error("Mohon lengkapi nama, email, dan nomor telepon pemesan");
      return;
    }

    if (fulfillment === "pickup" && !pickupDate) {
      toast.error("Pilih tanggal pengambilan kopi di roastery");
      return;
    }

    if (fulfillment === "delivery" && (!shippingAddress.trim() || shippingAddress.length < 10)) {
      toast.error("Alamat pengiriman minimal 10 karakter lengkap");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        note: note || undefined,
        fulfillment,
        pickupDate: fulfillment === "pickup" ? pickupDate : undefined,
        pickupSlot: fulfillment === "pickup" ? pickupSlot : undefined,
        shippingAddress:
          fulfillment === "delivery"
            ? {
                name: shippingName || customerName,
                phone: shippingPhone || customerPhone,
                address: shippingAddress,
                city: shippingCity,
                postalCode: postalCode || undefined,
                areaId: areaId || undefined,
              }
            : undefined,
        courierCompany: fulfillment === "delivery" ? selectedCourier?.courierName : undefined,
        courierCode: fulfillment === "delivery" ? selectedCourier?.courierCode : undefined,
        shippingFee: rawShippingFee,
        subtotal,
        discountAmount: totalDiscount,
        voucherCode: appliedVoucher?.code || undefined,
        total: grandTotal,
        items: items.map((i) => ({
          coffeeSlug: i.coffeeSlug,
          coffeeName: i.coffeeName,
          roastProfileCode: i.roastProfileCode,
          roastProfileName: i.roastProfileName,
          grindSize: i.grindSize,
          quantity: i.quantity,
          unitPriceIdr: i.unitPriceIdr,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal membuat pesanan");
        return;
      }

      // Simpan alamat ke Buku Alamat bila opsi dipilih
      if (
        fulfillment === "delivery" &&
        saveToBook &&
        selectedAddressId === "manual" &&
        initialUser?.email
      ) {
        fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: addressLabel || "Rumah",
            recipientName: shippingName,
            phone: shippingPhone,
            address: shippingAddress,
            city: shippingCity,
            postalCode: postalCode || "00000",
            areaId: areaId || null,
            areaName: areaSearch || null,
            isDefault: savedAddresses.length === 0,
          }),
        }).catch(() => {});
      }

      await clearCartItems();
      toast.success("Pesanan berhasil dibuat! Melanjutkan ke pembayaran... ✨");
      router.push("/pembayaran/" + data.orderNumber);
    } catch {
      toast.error("Terjadi kesalahan sistem saat membuat pesanan");
    } finally {
      setSubmitting(false);
    }
  }

  if (cartLoading) {
    return (
      <div className="mx-auto max-w-4xl py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-deep" />
        <p className="mt-3 text-sm text-muted-foreground">Memuat keranjang belanja...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-20 px-4 text-center">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-secondary text-gold-deep shadow-sm">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-[var(--font-display)] text-2xl font-bold text-green-deep">
          Keranjang Belanja Masih Kosong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pilih kopi single origin atau signature blend favoritmu dan sesuaikan profil roasting-nya.
        </p>
        <Button asChild variant="gold" size="lg" className="mt-8 font-bold gap-2">
          <Link href="/kopi">
            Jelajahi Katalog Kopi <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 pb-24 lg:pb-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-extrabold text-green-deep">
          Checkout Pesanan ({totalCount} Bag)
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Semua kopi di-roasting segar sesuai profil pilihanmu. Lengkapi data pengiriman dan pembayaran di bawah.
        </p>
      </div>

      <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1fr_380px]">
        {/* Kolom Kiri: Form Checkout */}
        <div className="space-y-6 sm:space-y-8">
          {/* 1. Item Recap */}
          <div className="glossy-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 pb-3 sm:pb-4">
              <h2 className="font-[var(--font-display)] text-base sm:text-lg font-bold text-green-deep flex items-center gap-2">
                <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-gold-deep" /> Biji Kopi Pesananmu
              </h2>
              <Badge variant="outline" className="text-[11px] sm:text-xs">
                Total: {totalWeightGrams >= 1000 ? `${(totalWeightGrams / 1000).toFixed(1)} kg` : `${totalWeightGrams}g`}
              </Badge>
            </div>

            <div className="mt-3 sm:mt-4 divide-y divide-border/40">
              {items.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 flex items-center justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs sm:text-sm text-foreground truncate">{item.coffeeName}</p>
                    <div className="mt-1 flex flex-wrap gap-1 text-[11px] sm:text-xs text-muted-foreground">
                      <Badge variant="gold" className="text-[9px] sm:text-[10px] px-1.5 py-0">
                        {item.roastProfileName}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0">
                        {GRIND_LABELS[item.grindSize]}
                      </Badge>
                      <span>• {item.quantity}x {item.weightGrams ?? 250}g</span>
                    </div>
                  </div>
                  <p className="font-extrabold text-xs sm:text-sm text-green-deep whitespace-nowrap">
                    {formatIDR(item.unitPriceIdr * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Metode Pemenuhan (Fulfillment) */}
          <div className="glossy-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
            <h2 className="font-[var(--font-display)] text-base sm:text-lg font-bold text-green-deep mb-3 sm:mb-4">
              Metode Pengiriman / Pengambilan
            </h2>

            <Tabs value={fulfillment} onValueChange={(v) => setFulfillment(v as "pickup" | "delivery")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="delivery" className="gap-1.5 font-semibold text-xs sm:text-sm">
                  <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>Kirim Kurir</span>
                  <span className="hidden sm:inline">(Delivery)</span>
                </TabsTrigger>
                <TabsTrigger value="pickup" className="gap-1.5 font-semibold text-xs sm:text-sm">
                  <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>Ambil Sendiri</span>
                  <span className="hidden sm:inline">(Pickup)</span>
                </TabsTrigger>
              </TabsList>

              {/* Delivery Tab Content */}
              <TabsContent value="delivery" className="mt-6 space-y-5">
                {/* Saved Address Selector for Logged-In Users */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold text-foreground">
                        Pilih dari Buku Alamat
                      </Label>
                      {selectedAddressId !== "manual" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary font-semibold hover:text-primary/80"
                          onClick={() => {
                            setSelectedAddressId("manual");
                            setShippingName("");
                            setShippingPhone("");
                            setShippingAddress("");
                            setShippingCity("Jakarta");
                            setPostalCode("");
                            setAreaId("");
                            setAreaSearch("");
                          }}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Gunakan Alamat Lain
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary font-semibold hover:text-primary/80"
                          onClick={() => {
                            const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                            if (def) {
                              setSelectedAddressId(def.id);
                              setShippingName(def.recipientName);
                              setShippingPhone(def.phone);
                              setShippingAddress(def.address);
                              setShippingCity(def.city);
                              setPostalCode(def.postalCode);
                              setAreaId(def.areaId ?? "");
                              setAreaSearch(def.areaName ?? "");
                            }
                          }}
                        >
                          Kembali ke Buku Alamat
                        </Button>
                      )}
                    </div>

                    {selectedAddressId !== "manual" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                setSelectedAddressId(addr.id);
                                setShippingName(addr.recipientName);
                                setShippingPhone(addr.phone);
                                setShippingAddress(addr.address);
                                setShippingCity(addr.city);
                                setPostalCode(addr.postalCode);
                                setAreaId(addr.areaId ?? "");
                                setAreaSearch(addr.areaName ?? "");
                              }}
                              className={`relative rounded-xl border p-4 text-left transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/30"
                                  : "border-border bg-card hover:border-border/80"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="secondary" className="text-[11px] font-semibold gap-1">
                                    {addr.label.toLowerCase() === "kantor" ? (
                                      <Building2 className="h-3 w-3" />
                                    ) : (
                                      <Home className="h-3 w-3" />
                                    )}
                                    {addr.label}
                                  </Badge>
                                  {addr.isDefault && (
                                    <Badge variant="gold" className="text-[10px] font-bold">
                                      Utama
                                    </Badge>
                                  )}
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                              <p className="mt-2 text-xs font-bold text-foreground">
                                {addr.recipientName} ({addr.phone})
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {addr.address}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {addr.city}, {addr.postalCode}
                              </p>
                              {addr.areaName && (
                                <p className="mt-1.5 text-[11px] text-emerald-600 font-medium truncate">
                                  ✓ Kurir: {addr.areaName}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Address Form (shown if manual, or when no saved addresses exist) */}
                {(selectedAddressId === "manual" || savedAddresses.length === 0) && (
                  <div className="space-y-4 rounded-2xl border border-border/80 bg-secondary/15 p-5">
                    {savedAddresses.length > 0 && (
                      <p className="text-xs font-bold text-green-deep uppercase tracking-wider">
                        Input Alamat Pengiriman Baru
                      </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="sName">Nama Penerima *</Label>
                        <Input
                          id="sName"
                          placeholder="Nama lengkap penerima"
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sPhone">No. Telepon Penerima *</Label>
                        <Input
                          id="sPhone"
                          placeholder="0812xxxxxxx"
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="sAddress">Alamat Lengkap Pengiriman *</Label>
                      <Textarea
                        id="sAddress"
                        placeholder="Nama jalan, nomor rumah/kantor, RT/RW, kelurahan, kecamatan"
                        rows={3}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="sCity">Kota / Kabupaten *</Label>
                        <Input
                          id="sCity"
                          placeholder="Misal: Bandung"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sPostal">Kode Pos *</Label>
                        <Input
                          id="sPostal"
                          placeholder="40115"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {initialUser?.email && (
                      <div className="pt-2 border-t border-border/60 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveToBook}
                            onChange={(e) => setSaveToBook(e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                          <span className="text-xs font-semibold text-foreground">
                            Simpan alamat ini ke Buku Alamat untuk pesanan berikutnya
                          </span>
                        </label>
                        {saveToBook && (
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-xs text-muted-foreground">Label:</span>
                            {["Rumah", "Kantor", "Apartemen"].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setAddressLabel(p)}
                                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                                  addressLabel === p
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Biteship Area Search */}
                <div className="space-y-1.5">
                  <Label htmlFor="areaSearch">Kecamatan / Area Pengiriman (Biteship)</Label>
                  <Input
                    id="areaSearch"
                    placeholder="Ketik minimal 3 huruf kecamatanmu..."
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                  />
                  {searchingAreas && <p className="text-xs text-muted-foreground">Mencari area...</p>}
                  {areaResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-card p-1 text-xs shadow-md">
                      {areaResults.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setAreaId(a.id);
                            setAreaSearch(a.name);
                            setShippingCity(a.name);
                            const postalMatch = a.name.match(/\b\d{5}\b/);
                            if (postalMatch) setPostalCode(postalMatch[0]);
                            setAreaResults([]);
                          }}
                          className="w-full text-left px-3 py-2 rounded hover:bg-secondary transition-colors"
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Courier Options */}
                <div className="pt-2">
                  <Label className="text-sm font-bold">Pilihan Ekspedisi</Label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {couriers.map((c) => {
                      const isSelected =
                        selectedCourier?.courierCode === c.courierCode &&
                        selectedCourier?.courierServiceName === c.courierServiceName;
                      return (
                        <button
                          key={`${c.courierCode}-${c.courierServiceName}`}
                          type="button"
                          onClick={() => setSelectedCourier(c)}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            isSelected
                              ? "border-gold bg-accent/60 shadow-sm"
                              : "border-border bg-white hover:border-gold/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-green-deep">{c.courierName}</span>
                            {isSelected && <Check className="h-4 w-4 text-gold-deep" />}
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                            <span>Estimasi {c.etd || "2-3 hari"}</span>
                            <span className="font-extrabold text-foreground">{formatIDR(c.price)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {loadingRates && <p className="mt-2 text-xs text-muted-foreground">Menghitung ongkir...</p>}
                </div>
              </TabsContent>

              {/* Pickup Tab Content */}
              <TabsContent value="pickup" className="mt-6 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ambil langsung pesanan segar di roastery kami: <b>Biosphere Roast Works, Sumur Bandung, Kota Bandung</b>.
                  Kapasitas harian dipantau secara real-time.
                </p>

                <div>
                  <Label className="text-sm font-bold">Pilih Tanggal Pengambilan</Label>
                  {loadingSlots ? (
                    <p className="mt-2 text-xs text-muted-foreground">Memeriksa jadwal kapasitas roaster...</p>
                  ) : (
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      {slots.map((s) => {
                        const active = pickupDate === s.date;
                        return (
                          <button
                            key={s.date}
                            type="button"
                            disabled={!s.available}
                            onClick={() => setPickupDate(s.date)}
                            className={`rounded-xl border-2 p-3 text-left transition-all ${
                              active
                                ? "border-gold bg-accent/60 shadow-sm"
                                : s.available
                                  ? "border-border bg-white hover:border-gold/40"
                                  : "border-border/40 bg-muted/40 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-green-deep">
                                {formatDateID(new Date(s.date + "T00:00:00"))}
                              </span>
                              {active && <Check className="h-4 w-4 text-gold-deep" />}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {s.available ? `Tersisa slot ${s.remaining} bag` : "Kapasitas Penuh"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="slotTime">Jam Pengambilan</Label>
                  <select
                    id="slotTime"
                    value={pickupSlot}
                    onChange={(e) => setPickupSlot(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="10:00 - 13:00 WIB">Pagi (10:00 - 13:00 WIB)</option>
                    <option value="14:00 - 17:00 WIB">Siang / Sore (14:00 - 17:00 WIB)</option>
                    <option value="18:00 - 20:00 WIB">Malam (18:00 - 20:00 WIB)</option>
                  </select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 3. Kontak Pemesan */}
          <div className="glossy-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-[var(--font-display)] text-base sm:text-lg font-bold text-green-deep">
              Informasi Pemesan
            </h2>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cName">Nama Pemesan</Label>
                <Input
                  id="cName"
                  placeholder="Nama kamu"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cEmail">Email Notifikasi Status</Label>
                <Input
                  id="cEmail"
                  type="email"
                  placeholder="kamu@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cPhone">Nomor WhatsApp / Telepon</Label>
              <Input
                id="cPhone"
                placeholder="0812xxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cNote">Catatan untuk Roaster (Opsional)</Label>
              <Textarea
                id="cNote"
                placeholder="Misal: Mohon kemas rapat, titipkan di satpam, dll."
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Biaya & Submit */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
          <div className="glossy-card rounded-2xl border border-border p-4 sm:p-6 shadow-md space-y-4 sm:space-y-5">
            <h3 className="font-[var(--font-display)] text-base sm:text-lg font-bold text-green-deep">
              Ringkasan Pembayaran
            </h3>

            {/* Voucher Box */}
            {appliedVoucher ? (
              <div className="flex items-center justify-between rounded-xl bg-gold/10 border border-gold/30 p-2.5 sm:p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gold-deep" />
                  <div>
                    <p className="font-bold text-gold-deep">{appliedVoucher.code}</p>
                    <p className="text-[11px] text-muted-foreground">{appliedVoucher.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeVoucher}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Batalkan voucher"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <Input
                  placeholder="Kode Voucher (ACHO10)"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  className="text-xs uppercase h-9"
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

            {/* Rincian Harga */}
            <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal ({totalCount} item)</span>
                <span className="font-semibold text-foreground">{formatIDR(subtotal)}</span>
              </div>
              {wholesaleAmount > 0 && (
                <div className="flex justify-between text-gold-deep font-semibold">
                  <span>Diskon Grosir Kafe ({wholesaleDiscount.discountPercent}%)</span>
                  <span>-{formatIDR(wholesaleAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Ongkos Kirim ({fulfillment === "pickup" ? "Ambil Sendiri" : "Kurir"})</span>
                <span className="font-semibold text-foreground">
                  {fulfillment === "pickup" ? "Gratis" : formatIDR(rawShippingFee)}
                </span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Potongan Voucher ({appliedVoucher?.code})</span>
                  <span>-{formatIDR(voucherDiscount)}</span>
                </div>
              )}
              <Separator className="my-2 sm:my-3" />
              <div className="flex items-baseline justify-between text-sm sm:text-base font-extrabold text-foreground">
                <span>Total Bayar</span>
                <span className="text-lg sm:text-xl text-green-deep">{formatIDR(grandTotal)}</span>
              </div>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="w-full font-bold h-11 sm:h-12 gap-2 shadow-lg shadow-gold/20 text-sm sm:text-base"
              onClick={handlePlaceOrder}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  Bayar Sekarang <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-muted-foreground pt-1">
              <ShieldCheck className="h-4 w-4 text-gold-deep" />
              <span>Pembayaran aman dengan enkripsi Doku</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] pb-[calc(env(safe-area-inset-bottom,0px)+12px)] lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">Total Tagihan</span>
            <p className="text-base font-black text-green-deep truncate">{formatIDR(grandTotal)}</p>
            <span className="text-[10px] text-muted-foreground">{totalCount} item</span>
          </div>
          <Button
            variant="gold"
            size="sm"
            className="h-10 px-4 font-bold gap-1.5 shadow-md shrink-0"
            onClick={handlePlaceOrder}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Bayar Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
