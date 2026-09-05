"use client";

import { useState } from "react";
import { ChevronDown, Leaf, MapPin, Mountain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoffeeBagArt } from "@/components/coffee-bag-art";
import { formatIDR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CatalogCoffee } from "@/lib/types";

export function MobileProductHeader({ coffee }: { coffee: CatalogCoffee }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glossy-card mb-6 overflow-hidden rounded-2xl border border-gold/30 lg:hidden">
      {/* Baris utama: ringkas & rapi */}
      <div className="flex items-center gap-3.5 p-4">
        <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-secondary/70 to-background p-1.5 shadow-inner">
          <CoffeeBagArt coffee={coffee} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Badge variant={coffee.type === "single_origin" ? "default" : "gold"} className="text-[10px] px-2 py-0">
              {coffee.type === "single_origin" ? "Single Origin" : "Blend"}
            </Badge>
            {coffee.badge && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/80">
                {coffee.badge}
              </Badge>
            )}
          </div>
          <h1 className="mt-1 truncate font-[var(--font-display)] text-lg font-bold text-green-deep">
            {coffee.name}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {coffee.packageType || coffee.region} • {coffee.packageVariants ? "Mulai " + formatIDR(coffee.priceIdr) : formatIDR(coffee.priceIdr)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-gold hover:text-gold-deep"
          aria-label={expanded ? "Tutup detail kopi" : "Lihat detail kopi"}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")} />
        </button>
      </div>

      {/* Konten detail yang bisa di-expand tanpa menenggelamkan wizard */}
      {expanded && (
        <div className="animate-in fade-in slide-in-from-top-2 border-t border-border/70 bg-secondary/20 p-4 pt-3 text-sm duration-200">
          <div className="flex flex-wrap gap-1.5">
            {coffee.tastingNotes.map((note) => (
              <span
                key={note}
                className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground"
              >
                {note}
              </span>
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-foreground/85">{coffee.description}</p>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold-deep" /> {coffee.region}
            </p>
            <p className="flex items-center gap-1.5">
              <Mountain className="h-3.5 w-3.5 text-gold-deep" /> {coffee.altitude}
            </p>
            <p className="col-span-2 flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-gold-deep" /> {coffee.process} • {coffee.varietal}
            </p>
          </div>

          {coffee.story && (
            <blockquote className="mt-3 rounded-lg bg-secondary/50 p-2.5 text-xs italic text-muted-foreground">
              “{coffee.story}”
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
}
