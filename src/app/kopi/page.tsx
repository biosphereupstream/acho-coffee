import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { CatalogGrid } from "@/components/shop/catalog-grid";
import { COFFEES } from "@/data/coffees";

export const metadata: Metadata = {
  title: "Menu & Katalog Kopi — Biosphere Roast Works",
  description:
    "Where Science Meets Soul. Biji kopi sangrai Classic Origin Ciwidey & seduhan segar Botol Kale, Pet Can 250ml, Botol 1L, dan Simplicity Pouch.",
};

export default function KopiPage() {
  return (
    <div>
      <section className="metal-green-strong relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(201,162,39,0.45) 0%, transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">Biosphere Roast Works</Badge>
            <span className="text-xs font-semibold text-gold-light tracking-widest uppercase">Where Science Meets Soul</span>
          </div>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
            Menu & Katalog <span className="text-gold-light">Freshly Brewed</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Dari biji kopi sangrai <b>Classic Origin Ciwidey</b> hingga minuman siap seduh <b>Botol Kale, Pet Can 250ml, Botol 1 Liter, dan Simplicity Pouch</b>. Diseduh dan disangrai segar langsung ke depan pintumu.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <CatalogGrid coffees={COFFEES} />
      </section>
    </div>
  );
}
