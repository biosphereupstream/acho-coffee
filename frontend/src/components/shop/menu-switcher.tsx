import Link from "next/link";
import { Coffee, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuSwitcherProps {
  current: "beans" | "drinks";
  beansCount?: number;
  drinksCount?: number;
}

export function MenuSwitcher({ current, beansCount = 4, drinksCount = 45 }: MenuSwitcherProps) {
  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center rounded-2xl border border-border bg-card/90 p-1.5 shadow-sm backdrop-blur-xs">
        <Link
          href="/kopi"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold transition-all",
            current === "beans"
              ? "metal-green text-white shadow-xs ring-1 ring-gold/40"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <Flame className={cn("h-4 w-4", current === "beans" ? "text-gold-light" : "text-muted-foreground")} />
          <span>Biji Kopi (Beans)</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-mono",
              current === "beans" ? "bg-gold/20 text-gold-light font-black" : "bg-secondary text-muted-foreground"
            )}
          >
            {beansCount}
          </span>
        </Link>

        <Link
          href="/minuman"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold transition-all",
            current === "drinks"
              ? "metal-green text-white shadow-xs ring-1 ring-gold/40"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <Coffee className={cn("h-4 w-4", current === "drinks" ? "text-gold-light" : "text-muted-foreground")} />
          <span>Minuman Siap Seduh</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-mono",
              current === "drinks" ? "bg-gold/20 text-gold-light font-black" : "bg-secondary text-muted-foreground"
            )}
          >
            {drinksCount}
          </span>
        </Link>
      </div>
    </div>
  );
}
