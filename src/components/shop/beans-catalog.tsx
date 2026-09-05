"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Layers, Search, Sparkles, Truck } from "lucide-react";
import { CoffeeCard } from "@/components/shop/coffee-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CatalogCoffee } from "@/lib/types";

const PROCESS_FILTERS = [
  { id: "all", label: "Semua Biji Kopi" },
  { id: "Bio-Natural", label: "Bio-Natural" },
  { id: "Bio-Honey", label: "Bio-Honey" },
  { id: "Semi Washed", label: "Semi Washed" },
  { id: "Wine", label: "Wine Fermentation" },
] as const;

export function BeansCatalog({ coffees: initialCoffees }: { coffees: CatalogCoffee[] }) {
  const [coffees, setCoffees] = useState<CatalogCoffee[]>(initialCoffees);
  const [activeProcess, setActiveProcess] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setCoffees(initialCoffees);
  }, [initialCoffees]);

  // Real-time synchronization with /api/menu on window focus and interval
  useEffect(() => {
    let mounted = true;
    async function refresh() {
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
    window.addEventListener("focus", onFocus);
    const timer = setInterval(refresh, 12000);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, []);

  // Only beans
  const beansOnly = useMemo(() => coffees.filter((c) => c.category === "beans"), [coffees]);

  const filtered = useMemo(() => {
    return beansOnly.filter((c) => {
      // Process filter
      if (activeProcess !== "all") {
        if (!c.process.toLowerCase().includes(activeProcess.toLowerCase())) {
          return false;
        }
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchRegion = c.region.toLowerCase().includes(q);
        const matchProcess = c.process.toLowerCase().includes(q);
        const matchNotes = c.tastingNotes.some((n) => n.toLowerCase().includes(q));
        if (!matchName && !matchRegion && !matchProcess && !matchNotes) return false;
      }
      return true;
    });
  }, [beansOnly, activeProcess, search]);

  return (
    <div className="space-y-8">
      {/* Search & Stats Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari varian biji kopi, notes (Chocolate, Spice, Wine)..."
            className="pl-9 bg-card border-border rounded-xl"
          />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">
          Menampilkan <span className="text-foreground font-bold">{filtered.length}</span> varian biji kopi sangrai pilihan
        </p>
      </div>

      {/* Process Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PROCESS_FILTERS.map((tab) => {
          const active = activeProcess === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveProcess(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-2xs",
                active
                  ? "metal-green border-transparent text-white shadow-sm ring-1 ring-gold/40"
                  : "border-border bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
              )}
            >
              <Flame className={cn("h-3.5 w-3.5", active ? "text-gold-light" : "text-muted-foreground")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((coffee) => (
          <CoffeeCard key={coffee.slug} coffee={coffee} />
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Tidak ada varian biji kopi yang sesuai pencarian.</p>
          <button
            onClick={() => {
              setActiveProcess("all");
              setSearch("");
            }}
            className="mt-3 text-xs font-bold text-primary underline underline-offset-4"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Cross-Promo Callout 1: Wholesale B2B 1kg */}
      <div className="rounded-3xl border border-gold/40 bg-gradient-to-r from-secondary/40 via-card to-accent/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="gold" className="text-primary font-bold gap-1 text-[10px] px-2 py-0.5">
                <Truck className="h-3 w-3" /> Pasokan Kedai Kopi (B2B)
              </Badge>
              <span className="text-[11px] font-semibold text-gold-deep">Diskon Volume s/d 10%</span>
            </div>
            <h4 className="font-[var(--font-display)] text-lg sm:text-xl font-bold text-green-deep">
              Butuh Pasokan Biji Kopi 1kg Bulk untuk Coffee Shop Anda?
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Dapatkan pasokan biji kopi sangrai segar on-demand dalam kemasan 1 kg dengan diskon berjenjang otomatis (3kg diskon 5%, 6kg diskon 7.5%, &gt;10kg diskon 10%).
            </p>
          </div>
          <Button size="lg" variant="gold" asChild className="shrink-0 font-bold gap-2 shadow-sm">
            <Link href="/wholesale">
              Buka Katalog Wholesale 1kg <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Cross-Promo Callout 2: Switch to Drinks */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary flex items-center justify-center text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Ingin minuman segar siap minum?</p>
            <p className="text-xs text-muted-foreground">Tersedia Botol Kale 250ml, Pet Can 250ml, Botol 1 Liter, dan Simplicity Pouch.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="border-gold/40 text-gold-deep hover:bg-gold/10 font-bold shrink-0">
          <Link href="/minuman">
            Lihat Menu Minuman Siap Seduh <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
