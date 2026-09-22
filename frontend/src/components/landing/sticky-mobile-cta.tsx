"use client";

import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StickyMobileCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-2.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">Roast On-Demand 72 Jam</span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            49 Pilihan Biji Kopi & Minuman
          </p>
        </div>

        <Button
          size="sm"
          className="bg-gold hover:bg-gold-deep text-green-deep font-bold text-xs h-9 px-4 rounded-xl shadow-md shrink-0 flex items-center gap-1"
          asChild
        >
          <Link href="/menu">
            <span>Pesan Sekarang</span>
            <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
