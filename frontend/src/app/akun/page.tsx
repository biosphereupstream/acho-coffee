import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";
import { listOrdersByUser } from "@/lib/store/orders";
import { getUserAddresses } from "@/lib/store/addresses";
import { AccountTabs } from "@/components/account/account-tabs";
import { StatusLookup } from "@/components/order/status-lookup";

export const metadata: Metadata = { title: "Akun Saya" };

export default async function AkunPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;

  if (!env.supabaseConfigured()) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-6 rounded-lg border border-gold/40 bg-accent px-5 py-3 text-sm text-accent-foreground">
          <b>Mode demo:</b> fitur akun memerlukan konfigurasi Supabase. Lacak pesananmu lewat nomor pesanan di email konfirmasi.
        </div>
        <StatusLookup />
      </div>
    );
  }

  const supabase = await getSupabaseServer();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user) redirect("/masuk");

  const [orders, addresses] = await Promise.all([
    listOrdersByUser(data.user.id),
    getUserAddresses(data.user.id),
  ]);

  const initialTab =
    sp.tab === "alamat" ? "alamat" : sp.tab === "profil" ? "profil" : "pesanan";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-[var(--font-display)] text-3xl font-bold text-green-deep">Akun Saya</h1>
      <p className="mt-1 text-sm text-muted-foreground">Halo, {data.user.user_metadata?.full_name ?? data.user.email} 👋</p>
      <div className="mt-8">
        <AccountTabs
          orders={orders}
          addresses={addresses}
          profile={{
            name: String(data.user.user_metadata?.full_name ?? data.user.email ?? ""),
            email: data.user.email ?? "",
          }}
          initialTab={initialTab}
        />
      </div>
    </div>
  );
}
