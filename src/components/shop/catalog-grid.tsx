"use client";

import { useMemo, useState } from "react";
import { Coffee, Flame, Milk, Search, Sparkles, Zap } from "lucide-react";
import { CoffeeCard } from "@/components/shop/coffee-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CatalogCoffee, ProductCategory } from "@/lib/types";

const CATEGORY_TABS: { id: "semua" | ProductCategory; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { id: "semua", label: "Semua Menu" },
  { id: "beans", label: "Roasted Beans", icon: Flame },
  { id: "botol_kale", label: "Botol Kale 250ml", icon: Coffee },
  { id: "pet_can", label: "Pet Can 250ml", icon: Zap },
  { id: "botol_1000", label: "Botol 1 Liter (Share)", icon: Sparkles },
  { id: "simplicity_pouch", label: "Simplicity Pouch 70ml", icon: Milk },
  { id: "espresso_pouch", label: "Espresso Pouch", icon: Coffee },
];

const SUB_FILTERS = [
  { id: "all", label: "Semua Varian" },
  { id: "refreshing", label: "Refreshing (Americano)" },
  { id: "creamy", label: "Creamy (Latte)" },
  { id: "single_origin", label: "Single Origin" },
] as const;

export function CatalogGrid({ coffees }: { coffees: CatalogCoffee[] }) {
  const [activeCategory, setActiveCategory] = useState<"semua" | ProductCategory>("semua");
  const [activeSubFilter, setActiveSubFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return coffees.filter((c) => {
      // Filter by category
      if (activeCategory !== "semua" && c.category !== activeCategory) {
        return false;
      }
      // Filter by sub-category
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
        const matchNotes = c.tastingNotes.some((n) => n.toLowerCase().includes(q));
        if (!matchName && !matchRegion && !matchNotes) return false;
      }
      return true;
    });
  }, [coffees, activeCategory, activeSubFilter, search]);

  return (
    <div className="space-y-6">
      {/* Search & Stats Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kopi, rasa (Peach, Pistachio, Ciwidey)..."
            className="pl-9 bg-card border-border rounded-xl"
          />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">
          Menampilkan <span className="text-foreground font-bold">{filtered.length}</span> dari {coffees.length} menu Biosphere
        </p>
      </div>

      {/* Main Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
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
              {Icon && <Icon className="h-3.5 w-3.5 text-gold-light" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub Filter Pills (for Ready to Drink) */}
      {activeCategory !== "beans" && activeCategory !== "espresso_pouch" && (
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
          <p className="text-sm font-semibold text-muted-foreground">Tidak ada menu yang sesuai dengan filter.</p>
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
    </div>
  );
}
