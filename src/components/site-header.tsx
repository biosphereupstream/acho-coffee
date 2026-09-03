import Link from "next/link";
import Image from "next/image";
import { createClient as getSupabaseServer } from "@/lib/server";
import { AuthButtons } from "@/components/auth-buttons";
import { MobileNav } from "@/components/mobile-nav";
import { CartTrigger } from "@/components/cart/cart-trigger";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/kopi", label: "Kopi" },
  { href: "/wholesale", label: "Wholesale (B2B)" },
  { href: "/#proses", label: "Proses" },
  { href: "/#tentang", label: "Tentang" },
];

export async function SiteHeader() {
  const supabase = await getSupabaseServer();
  let user: { email?: string; name?: string; avatarUrl?: string } | null = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const meta = data.user.user_metadata ?? {};
      user = {
        email: data.user.email ?? "",
        name: (meta.full_name as string) ?? (meta.name as string) ?? data.user.email ?? "",
        avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? undefined,
      };
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gold/30 bg-secondary/50 p-1 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/biosphere-logo.png"
              alt="Biosphere Roast Works Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-[var(--font-display)] text-base font-extrabold tracking-wider leading-none text-green-deep group-hover:text-gold-deep transition-colors">
              BIOSPHERE
            </span>
            <span className="text-[10px] font-bold tracking-widest text-gold-deep uppercase leading-tight mt-0.5">
              Roast Works
            </span>
          </div>
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

        <div className="hidden items-center gap-2 md:flex">
          <CartTrigger />
          <AuthButtons user={user} />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <CartTrigger />
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}
