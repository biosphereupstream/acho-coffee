import Link from "next/link";
import { Coffee } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { AuthButtons } from "@/components/auth-buttons";
import { MobileNav } from "@/components/mobile-nav";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/kopi", label: "Kopi" },
  { href: "/#proses", label: "Proses" },
  { href: "/#tentang", label: "Tentang" },
];

export async function SiteHeader() {
  const supabase = await getSupabaseServer();
  let user: { email?: string; name?: string } | null = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      user = {
        email: data.user.email ?? "",
        name: (data.user.user_metadata?.full_name as string) ?? data.user.email ?? "",
      };
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg metal-green shadow-sm">
            <Coffee className="h-5 w-5 text-gold-light" />
          </span>
          <span className="text-lg font-extrabold tracking-wide">
            ACHO <span className="text-gold-gradient">COFFEE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/70 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <AuthButtons user={user} supabaseConfigured={env.supabaseConfigured()} />
        </div>

        <MobileNav user={user} />
      </div>
    </header>
  );
}
