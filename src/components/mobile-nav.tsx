"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/kopi", label: "Kopi" },
  { href: "/#proses", label: "Proses" },
  { href: "/#tentang", label: "Tentang" },
];

export function MobileNav({
  user,
}: {
  user: { email?: string; name?: string } | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left text-lg font-extrabold">
            ACHO <span className="text-gold-gradient">COFFEE</span>
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
