import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { MenuSwitcher } from "@/components/shop/menu-switcher";
import { BeansCatalog } from "@/components/shop/beans-catalog";
import { getLiveMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Biji Kopi Sangrai (Roasted Beans) — Biosphere Roast Works",
  description:
    "Pilihan biji kopi sangrai specialty Classic Origin Ciwidey & Garut. Disangrai on-demand segar dengan 4 profil roasting dan ukuran kemasan 100g s/d 1kg.",
};

export default async function KopiPage() {
  const coffees = await getLiveMenu({ includeInactive: false });

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
            <span className="text-xs font-semibold text-gold-light tracking-widest uppercase">Classic Origin Series</span>
          </div>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
            Biji Kopi Sangrai <span className="text-gold-light">(Roasted Beans)</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Disangrai segar on-demand hanya setelah pesanan masuk. Pilihan single origin <b>Ciwidey Bio-Natural, Bio-Honey, Semi Washed, dan Wanoja Wine Garut</b> dengan opsi gilingan dan kemasan 100g hingga 1kg.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-8">
        <MenuSwitcher current="beans" />
        <BeansCatalog coffees={coffees} />
      </section>
    </div>
  );
}
