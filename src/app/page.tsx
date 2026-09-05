import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Flame,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoffeeCard } from "@/components/shop/coffee-card";
import { LandingFAQ } from "@/components/landing/faq";
import RoastJourney from "@/components/landing/roast-journey-wrapper";
import { COFFEES } from "@/data/coffees";
import { ROAST_STAGES, ROAST_IMPORTANT_NOTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MARQUEE_ITEMS = [
  "FRESH ROASTING",
  "SINGLE ORIGIN",
  "HOUSE BLEND",
  "GRIND SESUAI PESANAN",
  "TRACING KURIR",
  "PICKUP TERJADWAL",
  "PEMBAYARAN AMAN",
];

const FEATURES = [
  {
    icon: Flame,
    title: "Fresh Guarantee",
    desc: "Kopi dipanggang setelah kamu bayar — bukan stok lama. Sampai di tanganmu dalam 72 jam pasca-roasting.",
  },
  {
    icon: Sparkles,
    title: "Rekomendasi Profil",
    desc: "Jawab metode seduh & selera, kami rekomendasikan profil roasting yang paling cocok untukmu.",
  },
  {
    icon: CalendarClock,
    title: "Jadwal Antrian",
    desc: "Pilih tanggal ambil dengan slot tersisa yang dihitung otomatis dari kapasitas roasting harian.",
  },
  {
    icon: Truck,
    title: "Kirim + Tracing",
    desc: "Terintegrasi Biteship: JNE, J&T, SiCepat, AnterAja. Lacak paketmu sampai ke depan pintu.",
  },
];

const TESTIMONIALS = [
  {
    name: "Rizky Pratama",
    role: "Barista Rumahan, Jakarta",
    text: "Baru pertama kali nyoba kopi yang bener-bener fresh dari roastery. Aromanya waktu dibuka bikin nagih. Rekomendasi medium dark-nya pas banget buat espresso saya.",
  },
  {
    name: "Sari Wulandari",
    role: "Pecinta Pour Over, Bandung",
    text: "Suka banget bisa pilih tanggal ambil sesuai jadwal saya. Gayo Natural light roast-nya juara — fruity dan manisnya kerasa. Prosesnya transparan dari awal sampai selesai.",
  },
  {
    name: "Andi Kurniawan",
    role: "Pemilik Kedai Kopi, Yogyakarta",
    text: "Order mingguan buat kedai saya. Konsistensi roasting-nya bagus dan pengiriman selalu on time dengan tracing yang jelas. Recommended!",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 0%, rgba(201,162,39,0.10) 0%, transparent 60%), radial-gradient(50% 40% at 10% 20%, rgba(13,92,58,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-14 lg:py-20 overflow-hidden">
          <div className="w-full max-w-full">
            <Badge variant="gold" className="animate-fade-up mb-4 sm:mb-5 px-3 py-1 text-xs">
              ☕ Fresh Roast dalam 72 Jam
            </Badge>
            <h1 className="animate-fade-up font-[var(--font-display)] text-3xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.16] tracking-tight text-green-deep break-words" style={{ animationDelay: "0.05s" }}>
              Dipesan Hari Ini,{" "}
              <span className="text-gold-gradient inline-block">Dipanggang Khusus</span> Untukmu
            </h1>
            <p className="animate-fade-up mt-4 sm:mt-5 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: "0.12s" }}>
              Pilih single origin atau blend nusantara, tentukan profil roasting & gilingan, lalu jadwalkan pengambilan
              di roastery atau kirim ke rumahmu — lengkap dengan tracing kurir dan update di setiap tahap.
            </p>

            <div className="animate-fade-up mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 w-full" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" variant="gold" className="w-full sm:w-auto h-12 text-sm font-bold shadow-md justify-center" asChild>
                <Link href="/kopi">
                  Pesan Sekarang <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-sm font-semibold justify-center" asChild>
                <Link href="/#proses">Lihat Prosesnya</Link>
              </Button>
            </div>

            <div className="animate-fade-up mt-6 sm:mt-8 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground" style={{ animationDelay: "0.28s" }}>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary shrink-0" /> Pembayaran Aman</span>
              <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-gold-deep shrink-0" /> 4 Profil Roasting</span>
              <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-primary shrink-0" /> Ambil / Kirim</span>
            </div>

            <div className="animate-fade-up mt-6 sm:mt-8 grid max-w-md grid-cols-3 gap-2 sm:gap-4 border-t border-border pt-5 sm:pt-6" style={{ animationDelay: "0.34s" }}>
              {[
                ["49", "Menu & Varian"],
                ["7", "Fase Kimiawi"],
                ["4.9★", "Kepuasan 500+"],
              ].map(([num, label]) => (
                <div key={label} className="min-w-0">
                  <p className="text-xl sm:text-2xl font-extrabold text-green-deep">{num}</p>
                  <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up lg:pl-4 w-full max-w-full overflow-hidden" style={{ animationDelay: "0.15s" }}>
            <RoastJourney />
          </div>
        </div>

        {/* marquee */}
        <div className="metal-green relative overflow-hidden py-3">
          <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-8 text-sm font-bold uppercase tracking-[0.25em] text-white/90">
                {item} <span className="text-gold-light">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROSES KIMIAWI ROASTING KOPI ================= */}
      <section id="proses" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="text-primary font-bold">Proses Kimiawi Roasting Kopi</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
            Tahapan Reaksi Kimia dari Biji Hijau <span className="text-gold-gradient">Hingga Siap Didinginkan</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Roasting kopi bukan sekadar memanaskan biji, melainkan serangkaian reaksi kimia bertahap yang
            mengubah biji hijau menjadi biji matang dengan warna, aroma, dan rasa yang khas.
          </p>
        </div>

        {/* 7 Tahapan Proses Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ROAST_STAGES.map((stage, i) => (
            <div
              key={stage.key}
              className={cn(
                "gold-ring-hover glossy-card relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300",
                stage.isCritical
                  ? "border-gold/80 bg-gradient-to-br from-accent/50 to-card shadow-md ring-1 ring-gold/40"
                  : "border-border bg-card shadow-xs"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Tahap 0{i + 1}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold",
                      stage.isCritical
                        ? "bg-rose-500/15 text-rose-700 border border-rose-400/40"
                        : "bg-secondary text-foreground/80 border border-border"
                    )}
                  >
                    {stage.suhu}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <h3 className="font-[var(--font-display)] text-lg font-bold text-green-deep">
                    {stage.title}
                  </h3>
                  {stage.isCritical && (
                    <Badge variant="gold" className="text-[10px] font-bold px-1.5 py-0">
                      Disorot
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-foreground/80">
                  {stage.desc}
                </p>
              </div>

              <div className="mt-4 border-t border-border/50 pt-3 text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>Biosphere Roast Works</span>
                <span className="text-gold-deep font-mono">Fase 0{i + 1} / 07</span>
              </div>
            </div>
          ))}
        </div>

        {/* Catatan Penting Callout Box from PDF */}
        <div className="mt-12 rounded-2xl border border-gold/40 bg-gradient-to-br from-secondary/50 via-background to-accent/30 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 text-green-deep">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg metal-green text-gold-light font-black text-sm">
              ✦
            </span>
            <div>
              <h3 className="font-[var(--font-display)] text-lg font-bold text-green-deep">
                Catatan Penting Sains Roasting
              </h3>
              <p className="text-xs text-muted-foreground">
                Prinsip kontrol kualitas roasting Biosphere Roast Works — Where Science Meets Soul.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {ROAST_IMPORTANT_NOTES.map((note, idx) => (
              <div key={idx} className="rounded-xl border border-border/80 bg-background/90 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[11px] font-black text-gold-deep">
                    {idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-foreground">{note.title}</h4>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {note.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRODUK UNGGULAN: BIJI KOPI & MINUMAN ================= */}
      <section className="border-y border-border/60 bg-white/60 space-y-16 py-20">
        {/* Section 1: Roasted Beans */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="gold" className="text-primary font-bold">Classic Origin</Badge>
                <span className="text-xs font-semibold text-gold-deep uppercase tracking-wider">Fresh Roast On-Demand</span>
              </div>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl sm:text-4xl font-bold text-green-deep">
                Biji Kopi Sangrai <span className="text-gold-gradient">(Roasted Beans)</span>
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
                Single origin andalan Ciwidey & Garut dengan 4 profil sangrai presisi. Tersedia kemasan 100g, 200g, 500g, hingga 1kg.
              </p>
            </div>
            <Button variant="outline" className="border-gold/40 text-gold-deep hover:bg-gold/10 font-bold" asChild>
              <Link href="/kopi">
                Semua Biji Kopi <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COFFEES.filter((c) => c.category === "beans").map((coffee) => (
              <CoffeeCard key={coffee.slug} coffee={coffee} />
            ))}
          </div>
        </div>

        {/* Section 2: Ready To Drink */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 border-t border-border/60 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-primary font-bold">Ready to Drink</Badge>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Freshly Brewed Daily</span>
              </div>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl sm:text-4xl font-bold text-green-deep">
                Minuman Segar <span className="text-gold-gradient">Siap Seduh</span>
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
                Sajian kopi dan racikan segar dalam kemasan Botol Kale 250ml, Pet Can, Botol 1 Liter, dan Pouch praktis.
              </p>
            </div>
            <Button variant="ghost" asChild className="font-bold text-primary">
              <Link href="/minuman">
                Lihat Semua 45 Minuman <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COFFEES.filter((c) => c.category !== "beans").slice(0, 4).map((coffee) => (
              <CoffeeCard key={coffee.slug} coffee={coffee} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= KEUNGGULAN ================= */}
      <section id="tentang" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="text-primary">Kenapa Biosphere Roast Works?</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
            Where Science <span className="text-gold-gradient">Meets Soul</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="gold-ring-hover glossy-card rounded-2xl border border-border p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl metal-green">
                <f.icon className="h-6 w-6 text-gold-light" />
              </span>
              <h3 className="mt-4 text-base font-bold text-green-deep">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TESTIMONI ================= */}
      <section className="border-y border-border/60 bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="text-primary">Testimoni</Badge>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
              Kata Mereka yang Sudah Nyeduh
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glossy-card rounded-2xl border border-border p-6">
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/85">“{t.text}”</p>
                <div className="mt-5 border-t border-border/70 pt-4">
                  <p className="text-sm font-bold text-green-deep">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="text-primary">FAQ</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
            Sering Ditanyakan
          </h2>
        </div>
        <div className="mt-12">
          <LandingFAQ />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="sheen metal-green-strong relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: "radial-gradient(60% 90% at 50% 0%, rgba(201,162,39,0.35) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <h2 className="font-[var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
              Siap Mencicipi Kopi yang <span className="text-gold-light">Dipanggang Khusus</span> untukmu?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/75">
              Pesan sekarang, bayar aman via Doku, dan pantau perjalanan biji kopimu dari roaster sampai cangkir.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="gold" asChild>
                <Link href="/kopi">
                  Pesan Sekarang <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/masuk">Buat Akun Gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
