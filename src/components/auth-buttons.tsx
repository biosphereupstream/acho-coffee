"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";

export function AuthButtons({
  user,
}: {
  user: { email?: string; name?: string } | null;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    router.refresh();
    toast.success("Kamu sudah keluar. Sampai jumpa!");
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/masuk">Masuk</Link>
        </Button>
        <Button variant="gold" size="sm" asChild>
          <Link href="/masuk?tab=daftar">Daftar</Link>
        </Button>
      </div>
    );
  }

  const initials = (user.name ?? "A")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border p-1 pr-3 hover:bg-secondary/60 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="metal-green text-xs text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <span className="max-w-[140px] truncate text-sm font-medium">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/akun" className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            Pesanan Saya
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/akun?tab=profil" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
