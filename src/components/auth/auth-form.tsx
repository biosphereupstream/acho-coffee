"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/app/actions/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.1 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.98 11.98 0 0 0 1.28 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}

export function AuthForm({
  initialTab,
  supabaseConfigured,
}: {
  initialTab: "masuk" | "daftar";
  supabaseConfigured: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"masuk" | "daftar">(initialTab);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = tab === "masuk" ? await signInWithEmail(formData) : await signUpWithEmail(formData);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(result?.success ?? "Berhasil!");
      router.push("/akun");
      router.refresh();
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (result?.url) {
      window.location.href = result.url;
    } else {
      toast.error(result?.error ?? "Google OAuth belum tersedia");
    }
  }

  return (
    <div className="w-full max-w-md">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "masuk" | "daftar")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="masuk">Masuk</TabsTrigger>
          <TabsTrigger value="daftar">Daftar</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {!supabaseConfigured && (
            <div className="rounded-lg border border-gold/40 bg-accent px-4 py-3 text-xs leading-relaxed text-accent-foreground">
              <b>Mode demo:</b> Supabase belum dikonfigurasi, jadi akun belum aktif. Kamu tetap bisa berbelanja sebagai{" "}
              <Link href="/kopi" className="font-bold underline">tamu (one-time buyer)</Link> tanpa akun.
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading || !supabaseConfigured}>
            {googleLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
            Lanjutkan dengan Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">atau dengan email</span>
            <Separator className="flex-1" />
          </div>

          <TabsContent value="masuk" className="mt-0">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {tab === "masuk" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="kamu@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Kata Sandi</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !supabaseConfigured}>
                    {loading && <Loader2 className="animate-spin" />}
                    Masuk
                  </Button>
                </>
              )}
            </form>
          </TabsContent>

          <TabsContent value="daftar" className="mt-0">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {tab === "daftar" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" name="name" placeholder="Nama kamu" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">Email</Label>
                    <Input id="email2" name="email" type="email" placeholder="kamu@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Kata Sandi</Label>
                    <Input id="password2" name="password" type="password" placeholder="Minimal 8 karakter" required minLength={8} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !supabaseConfigured}>
                    {loading && <Loader2 className="animate-spin" />}
                    Buat Akun
                  </Button>
                </>
              )}
            </form>
          </TabsContent>

          <p className="text-center text-sm text-muted-foreground">
            Tidak mau bikin akun?{" "}
            <Link href="/kopi" className="font-semibold text-primary underline-offset-4 hover:underline">
              Pesan sebagai tamu
            </Link>
          </p>
        </div>
      </Tabs>
    </div>
  );
}
