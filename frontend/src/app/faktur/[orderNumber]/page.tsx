import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getOrderByNumber } from "@/lib/store/orders";
import { createClient as getSupabaseServer } from "@/lib/server";
import { GUEST_COOKIE, canAccessOrder, parseGuestCookie } from "@/lib/order-access";
import { InvoiceView } from "@/components/invoice/invoice-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Faktur ${orderNumber} — ACHO Coffee`,
  };
}

export default async function FakturPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  const supabase = await getSupabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const cookieStore = await cookies();
  const tokens = parseGuestCookie(cookieStore.get(GUEST_COOKIE)?.value);

  const authorized = canAccessOrder(order, {
    userId: user?.id,
    guestTokens: tokens,
    tokenParam: sp.t,
  });

  if (!authorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-[var(--font-display)] text-xl font-bold text-destructive">
          Akses Faktur Terproteksi
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Untuk menjaga privasi data transaksi, silakan akses melalui tautan resmi di email konfirmasi
          pesananmu atau masuk dengan akun pemesan.
        </p>
      </div>
    );
  }

  return <InvoiceView order={order} />;
}
