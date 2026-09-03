"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/components/cart/cart-context";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/kopi", label: "Kopi" },
  { href: "/#proses", label: "Proses" },
  { href: "/#tentang", label: "Tentang" },
];

export function MobileNav({
  user,
}: {
  user: { email?: string; name?: string; avatarUrl?: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const { openCart, totalCount } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left flex items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-gold/30 bg-secondary/50 p-0.5">
              <Image src="/biosphere-logo.png" alt="Biosphere Roast Works" width={32} height={32} className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-[var(--font-display)] text-sm font-extrabold tracking-wider leading-none text-green-deep">
                BIOSPHERE
              </span>
              <span className="text-[9px] font-bold tracking-widest text-gold-deep uppercase leading-tight mt-0.5">
                Roast Works
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary/70"
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              openCart();
            }}
            className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary/70 text-left transition-colors"
          >
            <span>Keranjang Belanja</span>
            {totalCount > 0 && (
              <span className="rounded-full bg-gold-deep px-2 py-0.5 text-xs font-bold text-white">
                {totalCount}
              </span>
            )}
          </button>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            {user ? (
              <Button asChild>
                <Link href="/akun" onClick={() => setOpen(false)}>
                  Pesanan Saya
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href="/masuk" onClick={() => setOpen(false)}>
                    Masuk / Daftar
                  </Link>
                </Button>
                <Button variant="gold" asChild>
                  <Link href="/kopi" onClick={() => setOpen(false)}>
                    Pesan Tanpa Akun
                  </Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
