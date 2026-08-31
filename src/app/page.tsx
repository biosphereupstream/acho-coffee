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
import { ROAST_STAGES } from "@/lib/constants";

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
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-20">
          <div>
            <Badge variant="gold" className="animate-fade-up mb-5 px-3 py-1">
              ☕ Fresh Roast dalam 72 Jam
            </Badge>
            <h1 className="animate-fade-up font-[var(--font-display)] text-4xl font-bold leading-[1.12] tracking-tight text-green-deep sm:text-5xl lg:text-[3.4rem]" style={{ animationDelay: "0.05s" }}>
              Dipesan Hari Ini,{" "}
              <span className="text-gold-gradient">Dipanggang Khusus</span> Untukmu
            </h1>
            <p className="animate-fade-up mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg" style={{ animationDelay: "0.12s" }}>
              Pilih single origin atau blend nusantara, tentukan profil roasting & gilingan, lalu jadwalkan pengambilan
              di roastery atau kirim ke rumahmu — lengkap dengan tracing kurir dan update di setiap tahap.
            </p>

            <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" variant="gold" asChild>
                <Link href="/kopi">
                  Pesan Sekarang <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#proses">Lihat Prosesnya</Link>
              </Button>
            </div>

            <div className="animate-fade-up mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground" style={{ animationDelay: "0.28s" }}>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Pembayaran Aman</span>
              <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-gold-deep" /> 4 Profil Roasting</span>
              <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-primary" /> Ambil / Kirim</span>
            </div>

            <div className="animate-fade-up mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6" style={{ animationDelay: "0.34s" }}>
              {[
                ["7", "Varian Kopi"],
                ["4", "Profil Roasting"],
                ["4.9★", "Rating Pelanggan"],
              ].map(([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-green-deep">{num}</p>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up lg:pl-4" style={{ animationDelay: "0.15s" }}>
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

      {/* ================= PROSES ================= */}
      <section id="proses" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="text-primary">Proses Kami</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
            Dari Biji Hijau ke <span className="text-gold-gradient">Cangkirmu</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Setiap pesanan melewati 5 tahap yang sama seperti animasi di atas — transparan dan bisa kamu pantau.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {ROAST_STAGES.map((stage, i) => (
            <div key={stage.key} className="gold-ring-hover glossy-card relative rounded-2xl border border-border p-6">
              <span className="absolute right-4 top-3 font-[var(--font-display)] text-4xl font-bold text-gold/25">
                {"0" + (i + 1)}
              </span>
              <h3 className="mt-6 font-[var(--font-display)] text-lg font-bold text-green-deep">{stage.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PRODUK UNGGULAN ================= */}
      <section className="border-y border-border/60 bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="secondary" className="text-primary">Menu Kopi</Badge>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
                Pilihan Favorit Minggu Ini
              </h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/kopi" className="text-primary">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COFFEES.slice(0, 3).map((coffee) => (
              <CoffeeCard key={coffee.slug} coffee={coffee} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= KEUNGGULAN ================= */}
      <section id="tentang" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="text-primary">Kenapa ACHO?</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
            Kopi Serius, <span className="text-gold-gradient">Tanpa Ribet</span>
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
