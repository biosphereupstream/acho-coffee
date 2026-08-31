import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoffeeBagArt } from "@/components/coffee-bag-art";
import { formatIDR } from "@/lib/constants";
import type { CatalogCoffee } from "@/lib/types";

export function CoffeeCard({ coffee }: { coffee: CatalogCoffee }) {
  return (
    <Link
      href={"/pesan/" + coffee.slug}
      className="gold-ring-hover glossy-card group flex flex-col overflow-hidden rounded-2xl border border-border"
    >
      <div className="relative aspect-[4/3.4] overflow-hidden bg-gradient-to-b from-secondary/60 to-background">
        <CoffeeBagArt coffee={coffee} className="p-4 transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant={coffee.type === "single_origin" ? "default" : "gold"}>
            {coffee.type === "single_origin" ? "Single Origin" : "Blend"}
          </Badge>
          {coffee.badge && <Badge variant="outline" className="bg-white/80">{coffee.badge}</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-[var(--font-display)] text-lg font-bold text-green-deep">{coffee.name}</h3>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {coffee.region} • {coffee.process}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {coffee.tastingNotes.slice(0, 3).map((note) => (
            <span key={note} className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
              {note}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4">
          <div>
            <p className="text-[11px] text-muted-foreground">per {coffee.weightGrams}g</p>
            <p className="text-lg font-extrabold text-primary">{formatIDR(coffee.priceIdr)}</p>
          </div>
          <Button size="sm" variant="gold" asChild>
            <span>
              Pesan <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
