"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { CoffeeBagArt } from "@/components/coffee-bag-art";
import type { CatalogCoffee } from "@/lib/types";

export function ProductHeroMedia({ coffee }: { coffee: CatalogCoffee }) {
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-emerald-950/15 via-secondary/40 to-background flex items-center justify-center p-4 sm:p-6 group">
      {coffee.imageUrl ? (
        <div
          onClick={() => setZoomOpen(true)}
          className="relative h-full w-full max-h-[380px] cursor-pointer drop-shadow-xl transition-all duration-300 group-hover:scale-[1.03]"
          title="Klik untuk memperbesar kartu spesifikasi"
        >
          <Image
            src={coffee.imageUrl}
            alt={coffee.name}
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-contain"
            priority
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/20 shadow-md">
            <ZoomIn className="h-3.5 w-3.5 text-gold-light" />
            <span>Perbesar Kartu Lot</span>
          </div>
        </div>
      ) : (
        <CoffeeBagArt coffee={coffee} className="p-4" />
      )}

      {/* Badges Overlay */}
      <div className="absolute left-4 top-4 flex gap-2 pointer-events-none">
        <Badge variant={coffee.type === "single_origin" ? "default" : "gold"} className="shadow-xs font-bold text-xs">
          {coffee.type === "single_origin" ? "Single Origin" : "Blend"}
        </Badge>
        {coffee.badge && (
          <Badge variant="gold" className="text-xs font-bold shadow-xs">
            {coffee.badge}
          </Badge>
        )}
      </div>

      {/* Lightbox Modal */}
      {coffee.imageUrl && (
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-xl p-3 sm:p-5 bg-card/95 backdrop-blur-xl border border-gold/40 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 px-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-deep" />
                <DialogTitle className="text-base font-bold text-green-deep">
                  Kartu Spesifikasi Resmi • {coffee.name}
                </DialogTitle>
              </div>
            </div>

            <div className="relative aspect-[3/3.6] w-full max-h-[75vh] mt-2 overflow-hidden rounded-2xl bg-black/5 flex items-center justify-center">
              <Image
                src={coffee.imageUrl}
                alt={coffee.name}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              {coffee.region} • {coffee.altitude} • {coffee.varietal}
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
