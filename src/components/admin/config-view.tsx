"use client";

import { useEffect, useState } from "react";
import { 
  Database, 
  Cloud, 
  Settings, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  Activity, 
  Globe, 
  Server,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatabaseTelemetry {
  database: {
    connected: boolean;
    provider: string;
    host: string;
    database_name: string;
    latency_ms: number;
    tables_count: number;
    total_products: number;
    total_orders: number;
    total_customers: number;
    checked_at: string;
  };
  supabase: {
    alive: boolean;
    latency_ms: number;
    endpoint: string;
  };
  cloudflare: {
    r2_configured: boolean;
    r2_bucket: string;
    r2_public_url: string;
  };
}

interface FrontendConfig {
  banner_enabled: boolean;
  banner_text: string;
  banner_link: string;
  announcement_text: string;
  shop_open: boolean;
  shop_notice: string;
  b2b_max_discount_percent: number;
  operating_hours: string;
  contact_whatsapp: string;
  contact_email: string;
  free_shipping_threshold: number;
  pickup_slots: string[];
}

export function ConfigView() {
  const [telemetry, setTelemetry] = useState<DatabaseTelemetry | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  const [frontendCfg, setFrontendCfg] = useState<FrontendConfig>({
    banner_enabled: true,
    banner_text: "Gratis Ongkir se-Kota Bandung untuk pesanan minimal Rp 150.000",
    banner_link: "/kopi",
    announcement_text: "Roasting batch segar setiap Selasa & Jumat. Biji kopi sangrai artisan & cold brew siap kirim.",
    shop_open: true,
    shop_notice: "Buka setiap hari 08.00 - 20.00 WIB",
    b2b_max_discount_percent: 10,
    operating_hours: "08:00 - 20:00 WIB",
    contact_whatsapp: "6281234567890",
    contact_email: "hello@acho.coffee",
    free_shipping_threshold: 150000,
    pickup_slots: ["10:00 - 12:00", "13:00 - 15:00", "16:00 - 18:00"],
  });
  const [loadingFrontend, setLoadingFrontend] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  async function fetchTelemetry() {
    setLoadingTelemetry(true);
    try {
      const res = await fetch("/api/backend/config/database");
      if (!res.ok) throw new Error("Failed to load db config");
      const json = await res.json();
      setTelemetry(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTelemetry(false);
    }
  }

  async function fetchFrontendConfig() {
    setLoadingFrontend(true);
    try {
      const res = await fetch("/api/backend/config/frontend");
      if (!res.ok) throw new Error("Failed to load frontend config");
      const json = await res.json();
      setFrontendCfg(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFrontend(false);
    }
  }

  useEffect(() => {
    fetchTelemetry();
    fetchFrontendConfig();
  }, []);

  async function handleSaveFrontend(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/backend/config/frontend", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(frontendCfg),
      });
      if (!res.ok) throw new Error("Gagal menyimpan konfigurasi");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert("Error: " + String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 2-Grid: DB Status & Cloudflare Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Telemetry */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Koneksi Database & Supabase
              </h3>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchTelemetry} className="h-7 px-2 text-xs">
              <RefreshCw className={`h-3 w-3 mr-1 ${loadingTelemetry ? "animate-spin" : ""}`} /> Test Ulang
            </Button>
          </div>

          {telemetry ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" /> Status Database:
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Terhubung ({telemetry.database.provider})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-background/80 border border-border">
                  <span className="text-muted-foreground block text-[10px]">Host Database</span>
                  <span className="font-mono font-medium truncate block">{telemetry.database.host}</span>
                </div>
                <div className="p-2 rounded-lg bg-background/80 border border-border">
                  <span className="text-muted-foreground block text-[10px]">Latensi Respon</span>
                  <span className="font-mono font-bold text-foreground">{telemetry.database.latency_ms} ms</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/80 border border-border space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supabase REST / Auth Endpoint:</span>
                  <span className="font-mono text-emerald-600 font-bold">Online ({telemetry.supabase.latency_ms}ms)</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{telemetry.supabase.endpoint}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 rounded-lg bg-secondary/40">
                  <span className="text-muted-foreground block">Tabel Terdaftar</span>
                  <span className="font-bold text-sm text-foreground">{telemetry.database.tables_count}</span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/40">
                  <span className="text-muted-foreground block">Total Produk Menu</span>
                  <span className="font-bold text-sm text-foreground">{telemetry.database.total_products}</span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/40">
                  <span className="text-muted-foreground block">Pelanggan Aktif</span>
                  <span className="font-bold text-sm text-foreground">{telemetry.database.total_customers}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-gold" />
              Memeriksa koneksi database...
            </div>
          )}
        </div>

        {/* Cloudflare & Edge Services */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              Integrasi Cloudflare R2 & CDN
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-amber-500" /> Cloudflare R2 Bucket:
              </span>
              <span className="font-bold text-foreground">acho-coffee</span>
            </div>

            <div className="p-2.5 rounded-xl bg-background/80 border border-border space-y-1">
              <span className="text-muted-foreground block text-[10px]">Public CDN Media URL (Egress-Free)</span>
              <span className="font-mono text-[11px] text-foreground block truncate">
                https://pub-f1af8258ec514a03bd205cb70a0dbc05.r2.dev/acho-coffee
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-secondary/20 space-y-1.5">
              <p className="font-bold text-foreground text-[11px] flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-gold-deep" /> Purge Cache Otomatis Aktif
              </p>
              <p className="text-[10px] text-muted-foreground">
                Setiap kali item menu atau banner diperbarui di panel ini, backend Go secara otomatis memicu invalidasi cache Cloudflare Edge sehingga perubahan langsung terlihat oleh pelanggan tanpa delay.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Frontend Configuration Form */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Pengaturan Dinamis Frontend & Toko
              </h3>
              <p className="text-xs text-muted-foreground">
                Konfigurasi banner promosi, pengumuman jadwal roasting, dan aturan B2B
              </p>
            </div>
          </div>

          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full animate-in fade-in">
              <Check className="h-3.5 w-3.5" /> Tersimpan!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveFrontend} className="space-y-4 text-xs">
          {/* Banner Promo Section */}
          <div className="p-4 rounded-xl border border-border/60 bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">Banner Promosi Header</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={frontendCfg.banner_enabled}
                  onChange={(e) => setFrontendCfg({ ...frontendCfg, banner_enabled: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="font-medium text-foreground">Aktifkan Banner</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-muted-foreground block mb-1">Teks Banner:</label>
                <input
                  type="text"
                  value={frontendCfg.banner_text}
                  onChange={(e) => setFrontendCfg({ ...frontendCfg, banner_text: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">Tautan Banner:</label>
                <input
                  type="text"
                  value={frontendCfg.banner_link}
                  onChange={(e) => setFrontendCfg({ ...frontendCfg, banner_link: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Announcement & B2B Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Teks Pengumuman Jadwal Roasting:
              </label>
              <textarea
                rows={3}
                value={frontendCfg.announcement_text}
                onChange={(e) => setFrontendCfg({ ...frontendCfg, announcement_text: e.target.value })}
                className="w-full bg-background border border-input rounded-xl p-2 text-xs"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Batas Maksimal Diskon B2B (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    disabled
                    value={frontendCfg.b2b_max_discount_percent}
                    className="w-full bg-muted/60 border border-input rounded-xl p-2 text-xs font-bold text-foreground opacity-90 cursor-not-allowed"
                  />
                  <ShieldCheck className="absolute right-3 top-2.5 h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Terkunci di maksimal 10% sesuai kebijakan resmi skema diskon B2B ACHO Coffee.
                </p>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Ambang Batas Gratis Ongkir (IDR):
                </label>
                <input
                  type="number"
                  value={frontendCfg.free_shipping_threshold}
                  onChange={(e) => setFrontendCfg({ ...frontendCfg, free_shipping_threshold: Number(e.target.value) })}
                  className="w-full bg-background border border-input rounded-xl p-2 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Store Hours & Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Jam Operasional:</label>
              <input
                type="text"
                value={frontendCfg.operating_hours}
                onChange={(e) => setFrontendCfg({ ...frontendCfg, operating_hours: e.target.value })}
                className="w-full bg-background border border-input rounded-xl p-2 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">No. WhatsApp CS:</label>
              <input
                type="text"
                value={frontendCfg.contact_whatsapp}
                onChange={(e) => setFrontendCfg({ ...frontendCfg, contact_whatsapp: e.target.value })}
                className="w-full bg-background border border-input rounded-xl p-2 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Email Dukungan:</label>
              <input
                type="text"
                value={frontendCfg.contact_email}
                onChange={(e) => setFrontendCfg({ ...frontendCfg, contact_email: e.target.value })}
                className="w-full bg-background border border-input rounded-xl p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border/50">
            <Button type="submit" disabled={saving} size="sm" className="gap-1.5 font-bold">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Simpan Konfigurasi Frontend
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
