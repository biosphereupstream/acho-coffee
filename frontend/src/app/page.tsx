import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Flame,
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
import HeroRoastWebGLWrapper from "@/components/landing/hero-roast-webgl-wrapper";
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
      {/* ================= 3D WEBGL SCROLLYTELLING HERO ================= */}
      <section className="relative">
        <HeroRoastWebGLWrapper announcementText={config?.announcement_text} />

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

      {/* ================= INTERACTIVE ROAST TELEMETRY COCKPIT ================= */}
      <section id="roast-cockpit" className="relative scroll-mt-16 mx-auto max-w-6xl px-3.5 pt-10 pb-6 sm:px-6 sm:pt-16 sm:pb-8">
        <div className="mx-auto max-w-2xl text-center mb-6 sm:mb-8">
          <Badge variant="gold" className="text-primary font-bold">
            Live Artisan Telemetry
          </Badge>
          <h2 className="mt-2.5 sm:mt-3 font-[var(--font-display)] text-2xl font-bold text-green-deep sm:text-4xl">
            Simulasi Kurva <span className="text-gold-gradient">Roasting Presisi</span>
          </h2>
          <p className="mt-2 text-xs sm:text-base text-muted-foreground">
            Eksplorasi kurva Bean Temperature (BT), Rate of Rise (RoR), dan Development Time Ratio (DTR) secara interaktif pada setiap profil sangrai Biosphere.
          </p>
        </div>
        <RoastJourney />
      </section>

      {/* ================= 7 FASE SAINS ROASTING INTERAKTIF ================= */}
      <RoastScienceStepper />

      {/* ================= SENSORY APPETITE & FLAVOR NAVIGATOR ================= */}
      <FlavorMoodNavigator initialCoffees={coffees} />

      {/* ================= LIVE FRESHNESS & BATCH TELEMETRY ================= */}
      <FreshnessTelemetry />

      {/* ================= KEUNGGULAN ================= */}
      <section id="tentang" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="text-primary">Kenapa Biosphere Roast Works?</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold text-green-deep sm:text-4xl">
            Where Science <span className="text-gold-gradient">Meets Soul</span>
          </h2>
        </div>

        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="gold-ring-hover glossy-card rounded-2xl border border-border p-5 sm:p-6">
              <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl metal-green">
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
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="text-primary">Testimoni</Badge>
            <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold text-green-deep sm:text-4xl">
              Kata Mereka yang Sudah Nyeduh
            </h2>
          </div>

          <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glossy-card rounded-2xl border border-border p-5 sm:p-6">
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="mt-3.5 sm:mt-4 text-xs sm:text-sm leading-relaxed text-foreground/85">“{t.text}”</p>
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
      <section id="faq" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="text-primary">FAQ</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold text-green-deep sm:text-4xl">
            Sering Ditanyakan
          </h2>
        </div>
        <div className="mt-8 sm:mt-12">
          <LandingFAQ />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-7xl px-4 pb-24 md:pb-20 sm:px-6">
        <div className="sheen metal-green-strong relative overflow-hidden rounded-2xl sm:rounded-3xl px-5 py-12 text-center sm:px-16 sm:py-16">
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
              <Button size="lg" variant="gold" className="w-full sm:w-auto" asChild>
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
      <StickyMobileCTA />
    </div>
  );
}
