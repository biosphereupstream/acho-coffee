"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Coffee, Flame, Milk, Search, Sparkles, Zap } from "lucide-react";
import { CoffeeCard } from "@/components/shop/coffee-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CatalogCoffee, ProductCategory } from "@/lib/types";

const DRINK_TABS: { id: "semua" | ProductCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "semua", label: "Semua Minuman", icon: Sparkles },
  { id: "botol_kale", label: "Botol Kale 250ml", icon: Coffee },
  { id: "pet_can", label: "Pet Can 250ml", icon: Zap },
  { id: "botol_1000", label: "Botol 1 Liter (Share)", icon: Sparkles },
  { id: "simplicity_pouch", label: "Simplicity Pouch 70ml", icon: Milk },
  { id: "espresso_pouch", label: "Espresso Pouch", icon: Coffee },
];

const SUB_FILTERS = [
  { id: "all", label: "Semua Rasa" },
  { id: "refreshing", label: "Refreshing (Americano)" },
  { id: "creamy", label: "Creamy (Latte & Susu)" },
  { id: "single_origin", label: "Single Origin Brew" },
] as const;

export function DrinksCatalog({ coffees }: { coffees: CatalogCoffee[] }) {
  const [activeCategory, setActiveCategory] = useState<"semua" | ProductCategory>("semua");
  const [activeSubFilter, setActiveSubFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Only drinks
  const drinksOnly = useMemo(() => coffees.filter((c) => c.category !== "beans"), [coffees]);

  const filtered = useMemo(() => {
    return drinksOnly.filter((c) => {
      // Filter by drink packaging category
      if (activeCategory !== "semua" && c.category !== activeCategory) {
        return false;
      }
      // Filter by sub-category / flavor profile
      if (activeSubFilter !== "all") {
        if (activeSubFilter === "single_origin") {
          if (c.type !== "single_origin" && c.subCategory !== "single_origin") return false;
        } else if (c.subCategory !== activeSubFilter) {
          return false;
        }
      }
      // Filter by search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchRegion = c.region.toLowerCase().includes(q);
        const matchPackage = c.packageType?.toLowerCase().includes(q);
        const matchNotes = c.tastingNotes.some((n) => n.toLowerCase().includes(q));
        if (!matchName && !matchRegion && !matchPackage && !matchNotes) return false;
      }
      return true;
    });
  }, [drinksOnly, activeCategory, activeSubFilter, search]);

  return (
    <div className="space-y-8">
      {/* Search & Stats Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari rasa (Peach, Pistachio, Latte, Cold Brew)..."
            className="pl-9 bg-card border-border rounded-xl"
          />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">
          Menampilkan <span className="text-foreground font-bold">{filtered.length}</span> dari {drinksOnly.length} minuman siap seduh
        </p>
      </div>

      {/* Drink Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DRINK_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id);
                setActiveSubFilter("all");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-2xs",
                active
                  ? "metal-green border-transparent text-white shadow-sm ring-1 ring-gold/40"
                  : "border-border bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 text-gold-light" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Flavor Profile Sub-Filters */}
      {activeCategory !== "espresso_pouch" && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {SUB_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveSubFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                activeSubFilter === f.id
                  ? "bg-gold text-neutral-900 shadow-xs font-bold"
                  : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Product Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((coffee) => (
          <CoffeeCard key={coffee.slug} coffee={coffee} />
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Tidak ada minuman yang sesuai dengan filter.</p>
          <button
            onClick={() => {
              setActiveCategory("semua");
              setActiveSubFilter("all");
              setSearch("");
            }}
            className="mt-3 text-xs font-bold text-primary underline underline-offset-4"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Cross-Promo Callout: Switch to Roasted Beans */}
      <div className="rounded-3xl border border-gold/40 bg-gradient-to-r from-secondary/40 via-card to-accent/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="gold" className="text-primary font-bold gap-1 text-[10px] px-2 py-0.5">
                <Flame className="h-3 w-3" /> Classic Origin Series
              </Badge>
              <span className="text-[11px] font-semibold text-gold-deep">Fresh Roast On-Demand</span>
            </div>
            <h4 className="font-[var(--font-display)] text-lg sm:text-xl font-bold text-green-deep">
              Mencari Biji Kopi Sangrai (Whole Bean) untuk Seduh Sendiri?
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Jelajahi biji kopi specialty Ciwidey & Garut dengan 4 pilihan profil roasting presisi serta ukuran kemasan 100g hingga 1kg.
            </p>
          </div>
          <Button size="lg" variant="gold" asChild className="shrink-0 font-bold gap-2 shadow-sm">
            <Link href="/kopi">
              Buka Menu Biji Kopi Sangrai <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
