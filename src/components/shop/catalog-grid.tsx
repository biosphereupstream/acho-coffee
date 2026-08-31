"use client";

import { useState } from "react";
import { CoffeeCard } from "@/components/shop/coffee-card";
import { cn } from "@/lib/utils";
import type { CatalogCoffee } from "@/lib/types";

const FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "single_origin", label: "Single Origin" },
  { id: "blend", label: "Blend" },
] as const;

export function CatalogGrid({ coffees }: { coffees: CatalogCoffee[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("semua");

  const filtered = filter === "semua" ? coffees : coffees.filter((c) => c.type === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
              filter === f.id
                ? "metal-green border-transparent text-primary-foreground shadow-sm"
                : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((coffee) => (
          <CoffeeCard key={coffee.slug} coffee={coffee} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">Tidak ada kopi di kategori ini.</p>
      )}
    </div>
  );
}
