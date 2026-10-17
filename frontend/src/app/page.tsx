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
import { RoastScienceStepper } from "@/components/landing/roast-science-stepper";
import { FlavorMoodNavigator } from "@/components/landing/flavor-mood-navigator";
import { FreshnessTelemetry } from "@/components/landing/freshness-telemetry";
import { StickyMobileCTA } from "@/components/landing/sticky-mobile-cta";
import { LandingFAQ } from "@/components/landing/faq";
import RoastJourney from "@/components/landing/roast-journey-wrapper";
import { getLiveFrontendConfig, getLiveMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function HomePage() {
  const coffees = await getLiveMenu({ includeInactive: false });
  const config = await getLiveFrontendConfig();

  return (
    <div>
      {/* ================= HERO 2-KOLOM RINGAN & INTERAKTIF ================= */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 0%, rgba(201,162,39,0.10) 0%, transparent 60%), radial-gradient(50% 40% at 10% 20%, rgba(13,92,58,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:py-18 overflow-hidden">
          <div className="w-full max-w-full">
            <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
              <Badge variant="gold" className="animate-fade-up px-3 py-1 text-xs font-bold">
                ☕ Fresh Roast dalam 72 Jam
              </Badge>
              {config?.announcement_text && (
                <div className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/40 px-3 py-1 text-xs text-gold-deep font-semibold">
                  <Sparkles className="h-3 w-3 text-gold-deep shrink-0" />
                  <span>{config.announcement_text}</span>
                </div>
              )}
            </div>
            <h1
              className="animate-fade-up font-[var(--font-display)] text-3xl sm:text-5xl lg:text-[3.35rem] font-bold leading-[1.15] tracking-tight text-green-deep break-words"
              style={{ animationDelay: "0.05s" }}
            >
              Dipesan Hari Ini,{" "}
              <span className="text-gold-gradient inline-block">Dipanggang Khusus</span> Untukmu
            </h1>
            <p
              className="animate-fade-up mt-4 sm:mt-5 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground"
              style={{ animationDelay: "0.12s" }}
            >
              Pilih single origin atau blend nusantara, tentukan profil roasting & gilingan, lalu jadwalkan pengambilan
              di roastery atau kirim ke rumahmu — lengkap dengan tracing kurir dan update di setiap tahap.
            </p>

            <div
              className="animate-fade-up mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 w-full"
              style={{ animationDelay: "0.2s" }}
            >
              <Button
                size="lg"
                variant="gold"
                className="w-full sm:w-auto h-12 text-sm font-bold shadow-md justify-center"
                asChild
              >
                <Link href="/menu">
                  Eksplor Menu & Pesan <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 text-sm font-semibold justify-center"
                asChild
              >
                <Link href="/#proses">Sains Roasting 7 Fase</Link>
              </Button>
            </div>
            <p
              className="animate-fade-up text-[11px] text-muted-foreground mt-2"
              style={{ animationDelay: "0.24s" }}
            >
              ✦ Disangrai on-demand • Bebas pilih profil gilingan • Garansi kesegaran 72 jam
            </p>

            <div
              className="animate-fade-up mt-6 sm:mt-8 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground"
              style={{ animationDelay: "0.28s" }}
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" /> Pembayaran Aman
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-gold-deep shrink-0" /> 3 Profil Roasting Presisi
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-primary shrink-0" /> Ambil / Kirim
              </span>
            </div>

            <div
              className="animate-fade-up mt-6 sm:mt-8 grid max-w-md grid-cols-3 gap-2 sm:gap-4 border-t border-border pt-5 sm:pt-6"
              style={{ animationDelay: "0.34s" }}
            >
              {[
                [String(coffees.length || 49), "Menu & Varian"],
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

          <div
            id="roast-cockpit"
            className="animate-fade-up lg:pl-2 w-full max-w-full overflow-hidden scroll-mt-20"
            style={{ animationDelay: "0.15s" }}
          >
            <RoastJourney />
          </div>
        </div>

        {/* marquee */}
        <div className="metal-green relative overflow-hidden py-3">
          <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-8 text-sm font-bold uppercase tracking-[0.25em] text-white/90"
              >
                {item} <span className="text-gold-light">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 7 FASE SAINS ROASTING INTERAKTIF ================= */}
      <RoastScienceStepper />

      {/* ================= SENSORY APPETITE & FLAVOR NAVIGATOR ================= */}
      <FlavorMoodNavigator initialCoffees={coffees} />

      {/* ================= LIVE FRESHNESS & BATCH TELEMETRY ================= */}
      <FreshnessTelemetry />

      {/* ================= KEUNGGULAN ================= */}
      <section id="tentang" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5 text-gold-deep" />
            <span>Kenapa Biosphere Roast Works?</span>
          </div>
          <h2 className="font-[var(--font-display)] text-2xl font-extrabold text-green-deep sm:text-4xl">
            Where Science <span className="text-gold-gradient">Meets Soul</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Empat pilar layanan roastery modern yang memastikan setiap gram biji kopi tiba di cangkirmu dalam kondisi puncak.
          </p>
        </div>

        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="gold-ring-hover glossy-card rounded-2xl border border-border p-5 sm:p-6 flex flex-col">
              <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl metal-green shadow-sm">
                <f.icon className="h-5 w-5 sm:h-6 sm:w-6 text-gold-light" />
              </span>
              <h3 className="mt-3.5 sm:mt-4 text-base font-bold text-green-deep">{f.title}</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TESTIMONI ================= */}
      <section className="border-y border-border/60 bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="text-primary font-bold">Testimoni Pelanggan</Badge>
            <h2 className="mt-3 font-[var(--font-display)] text-2xl font-extrabold text-green-deep sm:text-4xl">
              Kata Mereka yang Sudah <span className="text-gold-gradient">Nyeduh</span>
            </h2>
          </div>

          <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glossy-card rounded-2xl border border-border p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex gap-0.5" aria-label="Rating 5 dari 5 bintang">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="mt-3.5 sm:mt-4 text-xs sm:text-sm leading-relaxed text-foreground/85">“{t.text}”</p>
                </div>
                <div className="mt-4 sm:mt-5 border-t border-border/70 pt-3.5 sm:pt-4">
                  <p className="text-sm font-bold text-green-deep">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="text-primary font-bold">FAQ</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-2xl font-extrabold text-green-deep sm:text-4xl">
            Sering Ditanyakan
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Informasi lengkap seputar jadwal sangrai, antrian pickup, kurir pengiriman, dan metode pembayaran.
          </p>
        </div>
        <div className="mt-8 sm:mt-12">
          <LandingFAQ />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-7xl px-4 pb-24 md:pb-20 sm:px-6">
        <div className="sheen metal-green-strong relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 py-12 text-center sm:px-16 sm:py-16 shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: "radial-gradient(60% 90% at 50% 0%, rgba(201,162,39,0.35) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <h2 className="font-[var(--font-display)] text-2xl font-bold text-white sm:text-4xl">
              Siap Mencicipi Kopi yang <span className="text-gold-light">Dipanggang Khusus</span> untukmu?
            </h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-xs sm:text-base text-white/75">
              Pesan sekarang, bayar aman via Doku, dan pantau perjalanan biji kopimu dari roaster sampai cangkir.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-2.5 sm:gap-3 sm:flex-row">
              <Button size="lg" variant="gold" className="w-full sm:w-auto font-bold" asChild>
                <Link href="/menu">
                  Pesan Sekarang <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/masuk">Buat Akun Gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STICKY MOBILE ACTION BAR ================= */}
      <StickyMobileCTA totalCount={coffees.length} />
    </div>
  );
}
