import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Mountain, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoffeeBagArt } from "@/components/coffee-bag-art";
import { OrderBuilder } from "@/components/order/order-builder";
import { getCoffee } from "@/data/coffees";
import { formatIDR } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const coffee = getCoffee(slug);
  return { title: coffee ? "Pesan " + coffee.name : "Pesan Kopi" };
}

export default async function PesanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const coffee = getCoffee(slug);
  if (!coffee) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        href="/kopi"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke katalog
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[420px_1fr]">
        {/* info produk */}
        <div>
          <div className="glossy-card overflow-hidden rounded-2xl border border-border">
            <div className="relative aspect-square bg-gradient-to-b from-secondary/60 to-background p-6">
              <CoffeeBagArt coffee={coffee} />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge variant={coffee.type === "single_origin" ? "default" : "gold"}>
                  {coffee.type === "single_origin" ? "Single Origin" : "Blend"}
                </Badge>
                {coffee.badge && <Badge variant="outline" className="bg-white/80">{coffee.badge}</Badge>}
              </div>
            </div>
            <div className="p-6">
              <h1 className="font-[var(--font-display)] text-2xl font-bold text-green-deep">{coffee.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {coffee.region} • {coffee.origin}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {coffee.tastingNotes.map((note) => (
                  <span key={note} className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                    {note}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground/85">{coffee.description}</p>

              <div className="mt-5 space-y-2 border-t border-border/70 pt-4 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold-deep" /> {coffee.region}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mountain className="h-4 w-4 text-gold-deep" /> {coffee.altitude}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Leaf className="h-4 w-4 text-gold-deep" /> {coffee.process} • {coffee.varietal}
                </p>
              </div>

              <blockquote className="mt-5 rounded-xl bg-secondary/60 px-4 py-3 text-sm italic leading-relaxed text-muted-foreground">
                “{coffee.story}”
              </blockquote>

              <div className="mt-5 flex items-baseline gap-2 border-t border-border/70 pt-4">
                <p className="text-2xl font-extrabold text-primary">{formatIDR(coffee.priceIdr)}</p>
                <p className="text-sm text-muted-foreground">/ {coffee.weightGrams}g</p>
              </div>
            </div>
          </div>
        </div>

        {/* wizard pemesanan */}
        <div>
          <OrderBuilder coffee={coffee} />
        </div>
      </div>
    </div>
  );
}
