import type { Metadata } from "next";
import {
  Award,
  Coffee,
  Flame,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COFFEES } from "@/data/coffees";
import { SavingsCalculator } from "@/components/wholesale/savings-calculator";
import { BulkOrderMatrix } from "@/components/wholesale/bulk-order-matrix";
import { SampleRequestForm } from "@/components/wholesale/sample-request-form";

export const metadata: Metadata = {
  title: "Kemitraan Kafe & Wholesale Supply B2B",
  description:
    "Pasokan biji kopi specialty 1kg bulk untuk coffee shop & kedai kopi. Diskon volume otomatis hingga 35%, sangrai on-demand segar, dan konsistensi sains rasa dari Biosphere Roast Works Bandung.",
};

const B2B_PERKS = [
  {
    icon: Flame,
    title: "Roast on Demand (< 48 Jam)",
    desc: "Biji kopi disangrai hanya saat pesanan masuk. Menjamin biji tiba di bar Anda dalam fase degassing yang prima dan siap seduh.",
  },
  {
    icon: Award,
    title: "Kontrol 7 Reaksi Kimiawi",
    desc: "Monitoring presisi temperatur first crack & development time untuk memastikan konsistensi ekstraksi espresso dan cupping score tiap batch.",
  },
  {
    icon: TrendingUp,
    title: "Tier Diskon Otomatis s/d 35%",
    desc: "Mulai dari 3kg (diskon 15%), 6kg (diskon 25%), hingga >10kg (diskon 35%). Tanpa kontrak kaku, langsung teraplikasi di keranjang.",
  },
  {
    icon: Truck,
    title: "Ekspedisi Kargo & Self-Pickup",
    desc: "Dukungan pengiriman kargo hemat Biteship (J&T Cargo, JNE Trucking) serta opsi pickup terjadwal langsung di Roastery Lab Bandung.",
  },
];

const B2B_FAQS = [
  {
    q: "Berapa Minimum Order Quantity (MOQ) untuk mendapatkan harga grosir?",
    a: "MOQ untuk mengaktifkan harga grosir adalah 3 kg akumulasi (boleh campur varian biji 1kg). Diskon 15% akan langsung memotong subtotal secara otomatis.",
  },
  {
    q: "Apakah bisa request profil roasting khusus (custom roast) untuk mesin espresso kami?",
    a: "Bisa! Untuk pemesanan rutin di atas 10 kg per batch, tim roaster kami dapat mengkalibrasikan profil sangrai (light, medium, atau medium-dark) sesuai rasio ekstraksi dan karakter air di bar kedai Anda.",
  },
  {
    q: "Bagaimana cara memesan sampel tester sebelum membeli dalam partai besar?",
    a: "Anda dapat mengisi formulir 'Pengajuan Sampel Cupping Barista' di halaman ini. Kami akan mengirimkan paket tester 100g untuk pengujian rasa di bar Anda.",
  },
  {
    q: "Apakah pengiriman cargo sudah mendukung seluruh Indonesia?",
    a: "Ya, sistem Biteship kami terhubung langsung dengan armada kargo (J&T Cargo, SiCepat Gokil, JNE Trucking) yang efisien untuk pengiriman paket berat ke seluruh pulau di Indonesia.",
  },
];

export default function WholesalePage() {
  const beanCoffees = COFFEES.filter((c) => c.category === "beans");

  return (
    <div className="space-y-20 pb-24">
      {/* ================= HERO B2B ================= */}
      <section className="relative overflow-hidden border-b border-border/80 bg-gradient-to-b from-secondary/40 via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <Badge variant="gold" className="text-primary font-bold gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" /> Biosphere Cafe Supply & Roastery Partner
            </Badge>

            <h1 className="font-[var(--font-display)] text-4xl font-extrabold tracking-tight text-green-deep sm:text-5xl lg:text-6xl">
              Pasokan Biji Kopi Specialty untuk <span className="text-gold-gradient">Kedai Kopi Anda</span>
            </h1>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Solusi biji kopi sangrai 1kg bulk segar langsung dari roastery kami di Bandung. Diskon volume otomatis hingga 35%, konsistensi sains rasa, dan fleksibilitas tanpa kontrak yang mengikat.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button size="lg" variant="gold" asChild className="font-bold gap-2 shadow-md">
                <a href="#order-matrix">
                  <Coffee className="h-4 w-4" /> Pesan Biji 1kg Sekarang
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold border-gold/40 text-gold-deep hover:bg-gold/10">
                <a href="#sample-request">
                  Request Sampel Barista
                </a>
              </Button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 border-t border-border/80 pt-8 mt-8 text-center">
              <div>
                <p className="font-mono text-2xl sm:text-3xl font-black text-green-deep">35%</p>
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mt-0.5">Maksimal Diskon Grosir</p>
              </div>
              <div>
                <p className="font-mono text-2xl sm:text-3xl font-black text-gold-deep">&lt; 48 Jam</p>
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mt-0.5">Jaminan Fresh Roast</p>
              </div>
              <div>
                <p className="font-mono text-2xl sm:text-3xl font-black text-green-deep">3 kg</p>
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mt-0.5">Minimal Order (MOQ)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4 KEUNGGULAN PARTNER ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <Badge variant="secondary" className="text-primary font-bold">Standar Kualitas</Badge>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
            Mengapa Kafe Memilih <span className="text-gold-gradient">Biosphere Roast Works?</span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {B2B_PERKS.map((perk, i) => {
            const Icon = perk.icon;
            return (
              <div
                key={i}
                className="gold-ring-hover glossy-card relative rounded-3xl border border-border bg-card p-6 shadow-xs transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-gold-deep mb-4 border border-border">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-[var(--font-display)] text-base font-bold text-green-deep">
                  {perk.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {perk.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= TIERING DISKON OVERVIEW ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-gold/40 bg-gradient-to-r from-secondary/40 via-card to-accent/30 p-8 sm:p-12 shadow-sm">
          <div className="mx-auto max-w-2xl text-center mb-8">
            <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-gold-deep">Skema Diskon Transparan</span>
            <h3 className="mt-1 font-[var(--font-display)] text-2xl font-bold text-green-deep sm:text-3xl">
              Struktur Tiering Grosir Kedai Kopi
            </h3>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              Semakin besar kebutuhan kopi mingguan Anda, semakin besar efisiensi margin operasional kedai.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6 text-center space-y-2">
              <Badge variant="outline" className="text-xs font-bold">Tier 1 • Starter Cafe</Badge>
              <p className="font-mono text-3xl font-black text-green-deep">Diskon 15%</p>
              <p className="text-xs text-muted-foreground font-semibold">Akumulasi 3 – 5 kg</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border">
                Cocok untuk kedai kopi permulaan atau kafe dengan volume 150-250 cup/minggu.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-gold bg-accent/40 p-6 text-center space-y-2 shadow-md relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-[10px] font-black uppercase text-primary-foreground">
                Paling Populer
              </span>
              <Badge variant="gold" className="text-xs font-bold">Tier 2 • Busy Coffee Shop</Badge>
              <p className="font-mono text-3xl font-black text-gold-deep">Diskon 25%</p>
              <p className="text-xs text-muted-foreground font-semibold">Akumulasi 6 – 10 kg</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border">
                Ideal untuk kedai kopi yang ramai dengan traffic harian konsisten.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6 text-center space-y-2">
              <Badge variant="outline" className="text-xs font-bold">Tier 3 • Roastery Partner</Badge>
              <p className="font-mono text-3xl font-black text-green-deep">Diskon 35%</p>
              <p className="text-xs text-muted-foreground font-semibold">Akumulasi &gt; 10 kg</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border">
                Penghematan maksimal untuk kafe multi-outlet atau roastery distributor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KALKULATOR PENGHEMATAN ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SavingsCalculator />
      </section>

      {/* ================= BULK ORDER MATRIX ================= */}
      <section id="order-matrix" className="mx-auto max-w-7xl px-4 sm:px-6 scroll-mt-24">
        <BulkOrderMatrix beans={beanCoffees} />
      </section>

      {/* ================= REQUEST SAMPLE FORM ================= */}
      <section id="sample-request" className="mx-auto max-w-4xl px-4 sm:px-6 scroll-mt-24">
        <SampleRequestForm />
      </section>

      {/* ================= FAQ B2B ================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="text-primary font-bold">B2B FAQ</Badge>
          <h3 className="mt-2 font-[var(--font-display)] text-2xl font-bold text-green-deep sm:text-3xl">
            Pertanyaan Seputar Kemitraan Kafe
          </h3>
        </div>

        <div className="space-y-4">
          {B2B_FAQS.map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span className="text-gold-deep font-mono font-bold">Q{idx + 1}.</span> {faq.q}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
