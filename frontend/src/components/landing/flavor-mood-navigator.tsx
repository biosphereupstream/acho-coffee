"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Coffee, CupSoda } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoffeeCard } from "@/components/shop/coffee-card";
import type { CatalogCoffee } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlavorMoodNavigatorProps {
  initialCoffees: CatalogCoffee[];
}

const FLAVOR_MOODS = [
  {
    id: "all",
    label: "Semua Cita Rasa",
    emoji: "✦",
    keywords: [],
    color: "bg-secondary text-foreground hover:bg-secondary/80",
    activeColor: "bg-primary text-white border-primary shadow-sm",
  },
  {
    id: "chocolate",
    label: "Cokelat & Karamel",
    emoji: "🍫",
    keywords: ["chocolate", "caramel", "cocoa", "toffee", "nutty", "spice"],
    color: "bg-amber-950/10 text-amber-900 dark:text-amber-300 border-amber-800/20 hover:bg-amber-950/20",
    activeColor: "bg-amber-900 text-amber-50 border-amber-900 shadow-sm",
  },
  {
    id: "fruity",
    label: "Buah Matang & Wine",
    emoji: "🍓",
    keywords: ["wine", "berries", "fruity", "peach", "buah", "cherry"],
    color: "bg-rose-950/10 text-rose-900 dark:text-rose-300 border-rose-800/20 hover:bg-rose-950/20",
    activeColor: "bg-rose-900 text-rose-50 border-rose-900 shadow-sm",
  },
  {
    id: "honey",
    label: "Madu & Manis Bersih",
    emoji: "🍯",
    keywords: ["honey", "madu", "sweet", "clean", "floral"],
    color: "bg-yellow-950/10 text-yellow-900 dark:text-yellow-300 border-yellow-800/20 hover:bg-yellow-950/20",
    activeColor: "bg-yellow-900 text-yellow-50 border-yellow-900 shadow-sm",
  },
  {
    id: "citrus",
    label: "Citrus & Segar Dingin",
    emoji: "🍋",
    keywords: ["lime", "citrus", "orange", "lemon", "mint", "cooling", "jeruk"],
    color: "bg-emerald-950/10 text-emerald-900 dark:text-emerald-300 border-emerald-800/20 hover:bg-emerald-950/20",
    activeColor: "bg-emerald-900 text-emerald-50 border-emerald-900 shadow-sm",
  },
];

export function FlavorMoodNavigator({ initialCoffees }: FlavorMoodNavigatorProps) {
  const [activeCategory, setActiveCategory] = useState<"beans" | "drinks">("beans");
  const [selectedMood, setSelectedMood] = useState<string>("all");

  const categoryCoffees = useMemo(() => {
    if (activeCategory === "beans") {
      return initialCoffees.filter((c) => c.category === "beans");
    }
    return initialCoffees.filter((c) => c.category !== "beans");
  }, [initialCoffees, activeCategory]);

  const filteredCoffees = useMemo(() => {
    if (selectedMood === "all") {
      return activeCategory === "beans" ? categoryCoffees : categoryCoffees.slice(0, 8);
    }

    const moodObj = FLAVOR_MOODS.find((m) => m.id === selectedMood);
    if (!moodObj || moodObj.keywords.length === 0) {
      return activeCategory === "beans" ? categoryCoffees : categoryCoffees.slice(0, 8);
    }

    const matches = categoryCoffees.filter((c) => {
      const searchBlob = [
        c.name,
        c.process,
        c.description,
        ...(c.tastingNotes || []),
      ]
        .join(" ")
        .toLowerCase();

      return moodObj.keywords.some((kw) => searchBlob.includes(kw.toLowerCase()));
    });

    return activeCategory === "beans" ? matches : matches.slice(0, 8);
  }, [categoryCoffees, selectedMood, activeCategory]);

  return (
    <section id="katalog" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      {/* Header and Dual-Track Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/80 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/30 px-3.5 py-1 text-xs font-bold text-gold-deep mb-3">
            <Sparkles className="h-3.5 w-3.5 text-gold-deep" />
            <span>Sensory Appetite Navigator • Temukan Selera Lidahmu</span>
          </div>
          <h2 className="font-[var(--font-display)] text-3xl font-extrabold text-green-deep sm:text-4xl">
            Pilihan Rasa yang <span className="text-gold-gradient">Memanjakan Cangkir</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
            Dari aroma cokelat karamel legit hingga ledakan buah ceri wine fermentasi. Pilih kategori dan suasana rasa yang kamu dambakan hari ini.
          </p>
        </div>

        {/* Dual Track Switcher: Beans vs Drinks */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-secondary/80 border border-border/80 self-start md:self-end">
          <button
            onClick={() => {
              setActiveCategory("beans");
              setSelectedMood("all");
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeCategory === "beans"
                ? "bg-green-deep text-white shadow-md ring-1 ring-gold/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Coffee className="h-4 w-4 text-gold" />
            <span>Biji Kopi Sangrai</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
              4
            </span>
          </button>

          <button
            onClick={() => {
              setActiveCategory("drinks");
              setSelectedMood("all");
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeCategory === "drinks"
                ? "bg-green-deep text-white shadow-md ring-1 ring-gold/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CupSoda className="h-4 w-4 text-gold" />
            <span>Minuman Siap Minum</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
              45
            </span>
          </button>
        </div>
      </div>

      {/* Flavor Mood Selector Pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground mr-1 hidden sm:inline">
          Sensory Notes:
        </span>
        {FLAVOR_MOODS.map((mood) => {
          const isSelected = selectedMood === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200",
                isSelected ? mood.activeColor : mood.color
              )}
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      <div className="mt-8">
        {filteredCoffees.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/40">
            <p className="text-sm font-semibold text-muted-foreground">
              Tidak ada varian yang persis cocok dengan filter rasa ini.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedMood("all")}
              className="mt-3 text-xs"
            >
              Tampilkan Semua Rasa
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCoffees.map((coffee) => (
              <CoffeeCard key={coffee.slug} coffee={coffee} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Explore More CTA */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border/80 bg-secondary/30 p-4 sm:p-6">
        <div>
          <h4 className="font-bold text-sm text-foreground">
            {activeCategory === "beans"
              ? "Ingin Kemasan Ukuran Lebih Besar (500g s/d 1kg)?"
              : "Jelajahi Aneka Kemasan: Botol Kale, Pet Can, Botol 1L, dan Pouch Praktis"}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeCategory === "beans"
              ? "Tersedia pilihan profil roasting (Light to Dark) dan kustomisasi derajat gilingan gratis."
              : "Diseduh segar harian dengan pengiriman instant & same-day."}
          </p>
        </div>

        <Button
          size="sm"
          className="font-bold gap-1.5 bg-green-deep hover:bg-green-deep/90 text-white shrink-0"
          asChild
        >
          <Link href={activeCategory === "beans" ? "/kopi" : "/minuman"}>
            <span>Buka Semua {activeCategory === "beans" ? "Biji Kopi" : "Minuman"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
