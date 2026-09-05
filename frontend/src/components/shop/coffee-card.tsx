import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoffeeBagArt } from "@/components/coffee-bag-art";
import { formatIDR } from "@/lib/constants";
import type { CatalogCoffee } from "@/lib/types";

export function CoffeeCard({ coffee }: { coffee: CatalogCoffee }) {
  const hasVariants = Boolean(coffee.packageVariants && coffee.packageVariants.length > 0);

  return (
    <Link
      href={"/pesan/" + coffee.slug}
      className="gold-ring-hover glossy-card group flex flex-col overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3.2] overflow-hidden bg-gradient-to-b from-secondary/60 to-background flex items-center justify-center">
        <CoffeeBagArt coffee={coffee} className="p-4 transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant={coffee.type === "single_origin" ? "default" : "gold"} className="text-[10px] font-bold">
            {coffee.type === "single_origin" ? "Single Origin" : "Blend"}
          </Badge>
          {coffee.packageType && (
            <Badge variant="secondary" className="border border-border/60 bg-background/85 text-[10px] font-semibold backdrop-blur-xs">
              {coffee.packageType}
            </Badge>
          )}
          {coffee.badge && (
            <Badge variant="gold" className="text-[10px] font-bold shadow-2xs">
              {coffee.badge}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-[var(--font-display)] text-base font-bold text-green-deep line-clamp-1 group-hover:text-gold-deep transition-colors">
          {coffee.name}
        </h3>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground line-clamp-1">
          {coffee.region} • {coffee.process}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5 min-h-[26px]">
          {coffee.tastingNotes.slice(0, 3).map((note) => (
            <span
              key={note}
              className="rounded-full bg-accent/70 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground border border-border/40"
            >
              {note}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {hasVariants ? "Pilihan 100g - 1kg" : coffee.volumeMl ? `${coffee.volumeMl} ml` : `per ${coffee.weightGrams}g`}
            </p>
            <p className="text-base font-extrabold text-primary">
              {hasVariants ? "Mulai " + formatIDR(coffee.priceIdr) : formatIDR(coffee.priceIdr)}
            </p>
          </div>
          <Button size="sm" variant="gold" className="font-bold text-xs gap-1 shadow-2xs" asChild>
            <span>
              Pesan <ArrowRight className="h-3 w-3" />
            </span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
