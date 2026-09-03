"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Check,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserAddressRecord } from "@/lib/types";

export function AddressBook({
  initialAddresses,
}: {
  initialAddresses: UserAddressRecord[];
}) {
  const [addresses, setAddresses] = useState<UserAddressRecord[]>(initialAddresses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Form states
  const [label, setLabel] = useState("Rumah");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [postalCode, setPostalCode] = useState("");
  const [areaId, setAreaId] = useState("");
  const [areaName, setAreaName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Biteship Area search state
  const [areaSearch, setAreaSearch] = useState("");
  const [areaResults, setAreaResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searchingAreas, setSearchingAreas] = useState(false);

  // Debounced area search
  useEffect(() => {
    const timer = setTimeout(async () => {
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

    return () => clearTimeout(timer);
  }, [areaSearch]);

  function openCreateDialog() {
    setEditingId(null);
    setLabel("Rumah");
    setRecipientName("");
    setPhone("");
    setAddress("");
    setCity("Jakarta");
    setPostalCode("");
    setAreaId("");
    setAreaName("");
    setAreaSearch("");
    setAreaResults([]);
    setIsDefault(addresses.length === 0);
    setIsDialogOpen(true);
  }

  function openEditDialog(addr: UserAddressRecord) {
    setEditingId(addr.id);
    setLabel(addr.label);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setAddress(addr.address);
    setCity(addr.city);
    setPostalCode(addr.postalCode);
    setAreaId(addr.areaId ?? "");
    setAreaName(addr.areaName ?? "");
    setAreaSearch(addr.areaName ?? "");
    setAreaResults([]);
    setIsDefault(addr.isDefault);
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error("Mohon lengkapi semua kolom yang wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label,
        recipientName,
        phone,
        address,
        city,
        postalCode,
        areaId: areaId || null,
        areaName: areaName || null,
        isDefault,
      };

      if (editingId) {
        const res = await fetch(`/api/user/addresses/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui alamat");

        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingId) return data.address;
            if (isDefault) return { ...a, isDefault: false };
            return a;
          })
        );
        toast.success("Alamat berhasil diperbarui!");
      } else {
        const res = await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menambahkan alamat");

        setAddresses((prev) => {
          const list = isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : [...prev];
          return [data.address, ...list];
        });
        toast.success("Alamat baru berhasil disimpan!");
      }
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah kamu yakin ingin menghapus alamat ini?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus alamat");

      setAddresses((prev) => {
        const remaining = prev.filter((a) => a.id !== id);
        const wasDefault = prev.find((a) => a.id === id)?.isDefault;
        if (wasDefault && remaining.length > 0) {
          remaining[0].isDefault = true;
        }
        return remaining;
      });
      toast.success("Alamat berhasil dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus alamat");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    setSettingDefaultId(id);
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error("Gagal mengatur alamat utama");

      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      toast.success("Alamat utama berhasil diperbarui!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengatur alamat utama");
    } finally {
      setSettingDefaultId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-green-deep">Buku Alamat Pengiriman</h2>
          <p className="text-xs text-muted-foreground">
            Kelola alamat pengiriman untuk checkout 1-klik yang lebih cepat dan mudah.
          </p>
        </div>
        <Button onClick={openCreateDialog} variant="gold" size="sm" className="gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> Tambah Alamat
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="glossy-card rounded-2xl border border-border p-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-gold-deep/80" />
          <p className="mt-4 font-semibold text-green-deep">Belum ada alamat tersimpan</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Simpan alamat rumah atau kantormu agar tidak perlu mengisi ulang saat checkout.
          </p>
          <Button onClick={openCreateDialog} variant="outline" size="sm" className="mt-5 gap-1.5">
            <Plus className="h-4 w-4" /> Tambah Alamat Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`glossy-card relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                addr.isDefault
                  ? "border-primary/60 bg-primary/[0.02] shadow-sm ring-1 ring-primary/20"
                  : "border-border hover:border-border/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 text-xs font-semibold">
                      {addr.label.toLowerCase() === "kantor" ? (
                        <Building2 className="h-3 w-3" />
                      ) : (
                        <Home className="h-3 w-3" />
                      )}
                      {addr.label}
                    </Badge>
                    {addr.isDefault && (
                      <Badge variant="gold" className="gap-1 text-[11px] font-bold">
                        <Star className="h-3 w-3 fill-current" /> Utama
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditDialog(addr)}
                      title="Ubah Alamat"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      title="Hapus Alamat"
                    >
                      {deletingId === addr.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-sm font-bold text-foreground">{addr.recipientName}</p>
                  <p className="text-xs text-muted-foreground">{addr.phone}</p>
                  <p className="pt-1 text-xs leading-relaxed text-foreground/90">{addr.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {addr.city}, {addr.postalCode}
                  </p>
                </div>

                {addr.areaName && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                    <Check className="mt-0.5 h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="truncate">Area Kurir: {addr.areaName}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                {!addr.isDefault ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={settingDefaultId === addr.id}
                  >
                    {settingDefaultId === addr.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Star className="h-3 w-3 mr-1" />
                    )}
                    Jadikan Alamat Utama
                  </Button>
                ) : (
                  <span className="text-[11px] font-medium text-primary flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Alamat Pengiriman Utama
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-display)] text-lg sm:text-xl font-bold text-green-deep">
              {editingId ? "Ubah Alamat Pengiriman" : "Tambah Alamat Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-3 space-y-4 text-sm">
            {/* Label buttons */}
            <div>
              <Label className="text-xs font-semibold">Label Alamat</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {["Rumah", "Kantor", "Apartemen"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLabel(preset)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      label === preset
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <Input
                  className="h-8 max-w-[140px] text-xs"
                  placeholder="Label Lainnya..."
                  value={["Rumah", "Kantor", "Apartemen"].includes(label) ? "" : label}
                  onChange={(e) => setLabel(e.target.value || "Rumah")}
                />
              </div>
            </div>

            {/* Recipient & Phone */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="recipientName" className="text-xs font-semibold">
                  Nama Penerima *
                </Label>
                <Input
                  id="recipientName"
                  placeholder="Contoh: Budi Santoso"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Nomor Telepon / WA *
                </Label>
                <Input
                  id="phone"
                  placeholder="Contoh: 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-semibold">
                Alamat Lengkap *
              </Label>
              <Textarea
                id="address"
                placeholder="Nama jalan, nomor rumah/bangunan, RT/RW, kelurahan, patokan..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* Biteship Area Search */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Kecamatan / Area Pengiriman (Kurir)</span>
                {areaName && (
                  <span className="text-[11px] text-emerald-600 font-medium">✓ Terverifikasi</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  placeholder="Ketik minimal 3 huruf (mis. Dago, Kebayoran, Gubeng)..."
                  value={areaSearch}
                  onChange={(e) => {
                    setAreaSearch(e.target.value);
                    if (areaId) {
                      setAreaId("");
                      setAreaName("");
                    }
                  }}
                  className="pr-8 text-xs"
                />
                <div className="absolute right-2.5 top-2.5 text-muted-foreground">
                  {searchingAreas ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </div>
              </div>

              {areaResults.length > 0 && (
                <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
                  {areaResults.map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => {
                        setAreaId(ar.id);
                        setAreaName(ar.name);
                        setAreaSearch(ar.name);
                        setAreaResults([]);
                        // Extract postal code and city if detectable
                        const postalMatch = ar.name.match(/\b\d{5}\b/);
                        if (postalMatch) setPostalCode(postalMatch[0]);
                        const parts = ar.name.split(",");
                        if (parts.length >= 2) {
                          setCity(parts[parts.length - 2].trim().replace(/^(Kota|Kabupaten)\s+/i, ""));
                        }
                      }}
                      className="w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-secondary/70 transition-colors"
                    >
                      {ar.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs font-semibold">
                  Kota / Kabupaten *
                </Label>
                <Input
                  id="city"
                  placeholder="Jakarta"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="postalCode" className="text-xs font-semibold">
                  Kode Pos *
                </Label>
                <Input
                  id="postalCode"
                  placeholder="12345"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Set as default checkbox */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-xs font-medium text-foreground">
                Jadikan alamat ini sebagai alamat pengiriman utama
              </span>
            </label>

            <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" variant="gold" size="sm" disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Simpan Perubahan" : "Simpan Alamat"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
