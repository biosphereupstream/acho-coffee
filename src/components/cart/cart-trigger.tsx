"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-context";

export function CartTrigger({ className }: { className?: string }) {
  const { totalCount, openCart } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openCart}
      className={`relative hover:bg-secondary/70 transition-colors ${className ?? ""}`}
      aria-label="Buka Keranjang Belanja"
    >
      <ShoppingBag className="h-5 w-5 text-foreground" />
      {totalCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-deep text-[10px] font-black text-white shadow-md animate-in zoom-in duration-200">
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </Button>
  );
}
