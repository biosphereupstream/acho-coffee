import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { MenuSwitcher } from "@/components/shop/menu-switcher";
import { DrinksCatalog } from "@/components/shop/drinks-catalog";
import { getLiveMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Menu Minuman Siap Seduh — Biosphere Roast Works",
  description:
    "Pilihan minuman siap minum segar: Botol Kale 250ml, Pet Can 250ml, Botol 1 Liter, Simplicity Pouch, dan Espresso Pouch. Diseduh segar langsung ke depan pintu Anda.",
};

export default async function MinumanPage() {
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
            <span className="text-xs font-semibold text-gold-light tracking-widest uppercase">Ready To Drink & Brew</span>
          </div>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
            Menu Minuman <span className="text-gold-light">Siap Seduh</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Nikmati sajian kopi dan minuman dingin segar dalam kemasan <b>Botol Kale 250ml, Pet Can sealed, Botol 1 Liter (Share Size), dan Pouch praktis</b>. Diseduh segar setiap hari untuk mood dan energi Anda.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-8">
        <MenuSwitcher current="drinks" />
        <DrinksCatalog coffees={coffees} />
      </section>
    </div>
  );
}
