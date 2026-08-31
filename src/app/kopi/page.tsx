import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { CatalogGrid } from "@/components/shop/catalog-grid";
import { COFFEES } from "@/data/coffees";

export const metadata: Metadata = {
  title: "Katalog Kopi",
  description: "Kopi single origin & blend nusantara, diroasting fresh sesuai pesananmu.",
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
          <Badge variant="gold">Menu Kopi</Badge>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
            Katalog <span className="text-gold-light">Kopi Nusantara</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Semua kopi diroasting <b className="text-white">setelah kamu memesan</b> — pilih biji favoritmu, tentukan
            profil roasting, dan jadwalkan pengambilan atau pengiriman.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <CatalogGrid coffees={COFFEES} />
      </section>
    </div>
  );
}
