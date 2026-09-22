import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Coffee, Flame, Sparkles, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLiveMenu } from "@/lib/menu";
import { formatIDR } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Daftar Menu & Kategori Produk — Biosphere Roast Works",
  description:
    "Eksplorasi pilihan Biji Kopi Sangrai (Roasted Beans) Classic Origin Ciwidey & Garut serta Menu Minuman Siap Seduh segar (Botol Kale, Pet Can, Botol 1L, Pouch) dari Biosphere Roast Works Bandung.",
};

export default async function MenuIndexPage() {
  const allItems = await getLiveMenu({ includeInactive: false });

  const beans = allItems.filter((item) => item.category === "beans");
  const drinks = allItems.filter((item) => item.category !== "beans");

  const featuredBeans = beans.slice(0, 4);
  const featuredDrinks = drinks.slice(0, 4);

  return (
    <div className="space-y-16 pb-20">
      {/* ================= HERO HEADER ================= */}
      <section className="metal-green-strong relative overflow-hidden text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(70% 120% at 50% 0%, rgba(201,162,39,0.5) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-4 py-1.5 text-xs font-semibold text-gold-light backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Biosphere Roast Works — Where Science Meets Soul</span>
          </div>

          <h1 className="mt-4 font-[var(--font-display)] text-3xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight">
            Pilih Kategori <span className="text-gold-light">Menu Favoritmu</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Kami menghadirkan dua lini produk utama: <b>Biji Kopi Sangrai (Roasted Beans)</b> yang dipanggang segar on-demand, serta <b>Minuman Siap Seduh</b> yang diseduh fresh setiap hari siap antar ke depan pintumu.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-white/90">
            <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 border border-white/10">
              <Flame className="h-4 w-4 text-gold-light" /> {beans.length} Varian Biji Kopi
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 border border-white/10">
              <Coffee className="h-4 w-4 text-gold-light" /> {drinks.length} Varian Minuman Segar
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 border border-white/10">
              <ShieldCheck className="h-4 w-4 text-gold-light" /> Jaminan Kualitas Roastery
            </span>
          </div>
        </div>
      </section>

      {/* ================= 2 SPLIT CARDS: BEANS VS DRINKS ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {/* Card 1: Biji Kopi Sangrai (Roasted Beans) */}
          <div className="group rounded-3xl border-2 border-gold/30 bg-card p-6 sm:p-8 shadow-md hover:border-gold hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gold/10 pointer-events-none blur-2xl group-hover:bg-gold/20 transition-all" />

            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="gold" className="px-3 py-1 font-bold text-xs uppercase tracking-wider">
                  Classic Origin Series
                </Badge>
                <span className="text-xs font-bold text-gold-deep flex items-center gap-1">
                  <Flame className="h-4 w-4" /> Roast On-Demand
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl metal-green text-gold-light shadow-sm">
                  <Flame className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl font-extrabold text-green-deep">
                    Biji Kopi Sangrai
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                    Roasted Beans • Single Origin Ciwidey & Garut
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                Biji kopi pilihan yang dipanggang khusus hanya setelah pesanan Anda masuk. Bebas pilih tingkat sangrai (Light to Dark) dan ukuran gilingan dari biji utuh hingga fine grind. Kemasan 100g hingga 1kg.
              </p>

              <div className="mt-5 space-y-2 text-xs text-foreground/85 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>4 Profil Roasting Presisi (Light, Medium, Medium-Dark, Dark)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Proses Pasca Panen: Bio-Natural, Bio-Honey, Semi Washed, & Wine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Tersedia harga grosir B2B untuk kebutuhan kafe & kedai</span>
                </div>
              </div>

              {/* Preview Items */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Varian Pilihan ({beans.length} Tersedia):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featuredBeans.map((bean) => (
                    <Link
                      key={bean.slug}
                      href={`/pesan/${bean.slug}`}
                      className="p-3 rounded-2xl border border-border/80 bg-secondary/40 hover:bg-secondary hover:border-gold/50 transition-all flex items-center gap-3"
                    >
                      <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center p-1">
                        {bean.imageUrl ? (
                          <Image src={bean.imageUrl} alt={bean.name} width={44} height={44} className="h-full w-full object-cover rounded-lg" />
                        ) : (
                          <Flame className="h-5 w-5 text-gold-deep" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-foreground truncate">{bean.name}</h4>
                        <p className="text-[11px] font-semibold text-gold-deep">{formatIDR(bean.priceIdr)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Button size="lg" variant="gold" className="w-full h-12 text-sm font-bold shadow-md justify-center group-hover:scale-[1.01] transition-transform" asChild>
                <Link href="/kopi">
                  Buka Menu Biji Kopi (Roasted Beans) <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Card 2: Minuman Siap Seduh (Ready to Drink & Brew) */}
          <div className="group rounded-3xl border-2 border-primary/30 bg-card p-6 sm:p-8 shadow-md hover:border-primary hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/10 pointer-events-none blur-2xl group-hover:bg-emerald-500/20 transition-all" />

            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="px-3 py-1 font-bold text-xs uppercase tracking-wider text-primary">
                  Ready to Drink & Brew
                </Badge>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Coffee className="h-4 w-4" /> Diseduh Segar Harian
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950 text-white shadow-sm">
                  <Coffee className="h-6 w-6 text-gold-light" />
                </span>
                <div>
                  <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl font-extrabold text-green-deep">
                    Minuman Siap Seduh
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                    Cold Brew, Botol Kale, Pet Can & Pouch 1L
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                Sajian kopi dingin dan aneka racikan segar dalam kemasan kedap udara higienis. Siap diminum langsung atau disimpan untuk stok mingguan di rumah dan kantor.
              </p>

              <div className="mt-5 space-y-2 text-xs text-foreground/85 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Pilihan Kemasan: Botol Kale 250ml, Pet Can 250ml, Botol 1L, Pouch</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Varian Rasa: Signature Cold Brew, Latte Creamy, Fruity & Refreshing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Opsi Berkafein & Bebas Kafein (Non-Kopi) untuk semua momen</span>
                </div>
              </div>

              {/* Preview Items */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Varian Pilihan ({drinks.length} Tersedia):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featuredDrinks.map((drink) => (
                    <Link
                      key={drink.slug}
                      href={`/pesan/${drink.slug}`}
                      className="p-3 rounded-2xl border border-border/80 bg-secondary/40 hover:bg-secondary hover:border-primary/50 transition-all flex items-center gap-3"
                    >
                      <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center p-1">
                        {drink.imageUrl ? (
                          <Image src={drink.imageUrl} alt={drink.name} width={44} height={44} className="h-full w-full object-cover rounded-lg" />
                        ) : (
                          <Coffee className="h-5 w-5 text-emerald-700" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-foreground truncate">{drink.name}</h4>
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{formatIDR(drink.priceIdr)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Button size="lg" className="w-full h-12 text-sm font-bold bg-green-deep hover:bg-emerald-950 text-white shadow-md justify-center group-hover:scale-[1.01] transition-transform" asChild>
                <Link href="/minuman">
                  Buka Menu Minuman Siap Seduh <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= B2B WHOLESALE CALLOUT ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-gold/40 bg-gradient-to-r from-emerald-950 via-forest-900 to-emerald-950 text-white p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold-light border border-gold/40">
                <Building2 className="h-3.5 w-3.5" /> Kemitraan Kafe & Roastery B2B
              </div>
              <h3 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-white">
                Butuh Pasokan Biji Kopi Rutin untuk Usahamu?
              </h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Nikmati skema diskon bertingkat hingga 10%, konsultasi profiling roasting kustom, dan sampel gratis untuk pemilik kafe atau bisnis F&B.
              </p>
            </div>

            <Button size="lg" variant="gold" asChild className="shrink-0 h-12 px-6 font-bold shadow-md">
              <Link href="/wholesale">
                Ajukan Sampel & Kemitraan <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
