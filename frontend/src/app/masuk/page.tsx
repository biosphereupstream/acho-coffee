import type { Metadata } from "next";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Masuk / Daftar",
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
      <div className="sheen metal-green-strong relative hidden overflow-hidden rounded-3xl p-10 lg:block">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(70% 90% at 50% 0%, rgba(201,162,39,0.4) 0%, transparent 60%)" }}
        />
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Coffee className="h-6 w-6 text-gold-light" />
          </span>
          <h1 className="mt-6 font-[var(--font-display)] text-3xl font-bold leading-tight text-white">
            Satu Akun,<br />
            <span className="text-gold-light">Semua Pesananmu</span> Terpantau
          </h1>
          <ul className="mt-8 space-y-4 text-sm text-white/80">
            <li className="flex gap-3">
              <span className="text-gold-light">✦</span> Riwayat pesanan & status real-time
            </li>
            <li className="flex gap-3">
              <span className="text-gold-light">✦</span> Rekomendasi roasting tersimpan otomatis
            </li>
            <li className="flex gap-3">
              <span className="text-gold-light">✦</span> Checkout kilat tanpa isi ulang data
            </li>
          </ul>
          <p className="mt-10 text-xs text-white/50">
            Atau berbelanja cepat tanpa akun —{" "}
            <Link href="/kopi" className="text-gold-light underline underline-offset-4">
              lanjut sebagai tamu
            </Link>
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <AuthForm
          initialTab={sp.tab === "daftar" ? "daftar" : "masuk"}
          supabaseConfigured={env.supabaseConfigured()}
          errorMessage={sp.error}
        />
      </div>
    </div>
  );
}
