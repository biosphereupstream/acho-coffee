"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoffeeCard } from "@/components/shop/coffee-card";
import type { CatalogCoffee } from "@/lib/types";

export function FeaturedSection({ initialCoffees }: { initialCoffees: CatalogCoffee[] }) {
  const [coffees, setCoffees] = useState<CatalogCoffee[]>(initialCoffees);

  useEffect(() => {
    setCoffees(initialCoffees);
  }, [initialCoffees]);

  // Real-time synchronization with /api/menu on window focus and visibility
  useEffect(() => {
    let mounted = true;
    async function refresh() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/menu", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && Array.isArray(data.coffees)) {
          setCoffees(data.coffees);
        }
      } catch {}
    }

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(refresh, 30000);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
    };
  }, []);

  const beans = coffees.filter((c) => c.category === "beans");
  const drinks = coffees.filter((c) => c.category !== "beans").slice(0, 4);

  return (
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
          {beans.map((coffee) => (
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
              Lihat Semua Minuman <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {drinks.map((coffee) => (
            <CoffeeCard key={coffee.slug} coffee={coffee} />
          ))}
        </div>
      </div>
    </section>
  );
}
