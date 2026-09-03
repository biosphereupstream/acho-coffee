"use client";

import { useState } from "react";
import { Send, CheckCircle2, Coffee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function SampleRequestForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    espressoMachine: "",
    monthlyEstimateKg: "5 - 15 kg",
    samplePreferences: ["Ciwidey Bio-Natural", "Ciwidey Bio-Honey"],
    notes: "",
  });

  const togglePreference = (item: string) => {
    setForm((prev) => {
      const exists = prev.samplePreferences.includes(item);
      if (exists) {
        return {
          ...prev,
          samplePreferences: prev.samplePreferences.filter((p) => p !== item),
        };
      } else {
        return {
          ...prev,
          samplePreferences: [...prev.samplePreferences, item],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.contactPerson || !form.phone || !form.city || !form.address) {
      toast.error("Harap lengkapi semua data wajib yang bertanda bintang (*).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wholesale/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Gagal mengirim permohonan");
      }

      setSubmitted(true);
      toast.success("Permohonan sampel barista berhasil dikirim!", {
        description: "Tim roastery Biosphere akan menghubungi via WhatsApp untuk konfirmasi pengiriman tester.",
      });
    } catch {
      // Fallback: buka WhatsApp dengan pesan terformat
      const waMsg = encodeURIComponent(
        `Halo Biosphere Roast Works!\nSaya ingin request sample biji kopi untuk kedai:\n\n*Nama Kedai:* ${form.businessName}\n*PIC:* ${form.contactPerson}\n*No. WA:* ${form.phone}\n*Kota:* ${form.city}\n*Alamat:* ${form.address}\n*Mesin Espresso:* ${form.espressoMachine || "-"}\n*Estimasi Kebutuhan:* ${form.monthlyEstimateKg}\n*Varian yang diminati:* ${form.samplePreferences.join(", ")}\n\nTerima kasih!`
      );
      window.open(`https://wa.me/6281234567890?text=${waMsg}`, "_blank");
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-gold/40 bg-gradient-to-br from-card via-secondary/30 to-background p-8 text-center sm:p-12 shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <Badge variant="gold" className="text-xs font-bold mb-2">Permohonan Diterima</Badge>
        <h4 className="font-[var(--font-display)] text-2xl font-bold text-green-deep">
          Terima Kasih, Barista & Tim {form.businessName}!
        </h4>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          Sampel tester biji kopi Classic Origin akan disiapkan dengan sangrai segar. Roastery master kami akan menghubungi WhatsApp <b>{form.phone}</b> untuk jadwal pengiriman.
        </p>
        <Button
          variant="outline"
          onClick={() => setSubmitted(false)}
          className="mt-6 font-bold text-xs border-gold/40"
        >
          Kirim Pengajuan Baru
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glossy-card rounded-3xl border border-border bg-card p-4 sm:p-10 shadow-md space-y-5 sm:space-y-6"
    >
      <div className="border-b border-border/80 pb-4">
        <Badge variant="secondary" className="text-primary font-bold gap-1">
          <Coffee className="h-3 w-3" /> Tester Sebelum Membeli
        </Badge>
        <h4 className="mt-2 font-[var(--font-display)] text-xl font-bold text-green-deep sm:text-2xl">
          Formulir Pengajuan Sampel Cupping Barista
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Kami menyediakan paket tester 100g untuk kafe dan roastery partner yang ingin mencocokkan profil rasa dengan grinder & mesin espresso di bar Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Nama Kedai Kopi / Bisnis *</Label>
          <Input
            placeholder="Contoh: Kopi Titik Temu"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            required
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Nama PIC / Head Barista *</Label>
          <Input
            placeholder="Nama Anda"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            required
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Nomor WhatsApp Aktif *</Label>
          <Input
            placeholder="08xxxxxxxxxx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Email Bisnis *</Label>
          <Input
            type="email"
            placeholder="barista@kedai.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Kota / Kabupaten *</Label>
          <Input
            placeholder="Contoh: Bandung / Jakarta Selatan"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Mesin Espresso / Alat Utama di Bar</Label>
          <Input
            placeholder="Contoh: La Marzocco Linea Mini / Nuova Simonelli"
            value={form.espressoMachine}
            onChange={(e) => setForm({ ...form, espressoMachine: e.target.value })}
            className="text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold">Alamat Lengkap Pengiriman Sampel *</Label>
        <Textarea
          placeholder="Jl. Sukajadi No. 45, Coblong..."
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
          rows={2}
          className="text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold">Varian Biji Kopi yang Ingin Diuji Rasa:</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            "Ciwidey Bio-Natural",
            "Ciwidey Bio-Honey",
            "Ciwidey Semi Washed",
            "Wanoja Wine Garut",
          ].map((bean) => {
            const selected = form.samplePreferences.includes(bean);
            return (
              <button
                key={bean}
                type="button"
                onClick={() => togglePreference(bean)}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs font-medium transition-all ${
                  selected
                    ? "border-gold bg-accent/60 text-foreground font-bold shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:border-gold/50"
                }`}
              >
                <span>{bean}</span>
                {selected && <CheckCircle2 className="h-3.5 w-3.5 text-gold-deep shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold">Catatan Tambahan (Karakter Rasa yang Dicari)</Label>
        <Input
          placeholder="Contoh: Kami mencari espresso blend yang manis dan cocok dicampur susu segar..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="text-xs"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        variant="gold"
        size="lg"
        className="w-full font-black gap-2 shadow-md"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Mengirim Permohonan...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Ajukan Paket Sampel Barista
          </>
        )}
      </Button>
    </form>
  );
}
