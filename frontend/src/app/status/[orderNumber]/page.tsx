import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getOrderByNumber } from "@/lib/store/orders";
import { createClient as getSupabaseServer } from "@/lib/server";
import { StatusClient } from "@/components/order/status-client";
import { GUEST_COOKIE, canAccessOrder, parseGuestCookie } from "@/lib/order-access";

export const metadata: Metadata = { title: "Status Pesanan" };

export default async function StatusPage({
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-deep">Lacak Pesanan</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold text-green-deep sm:text-4xl">
          Status Pesananmu
        </h1>
      </div>
      <StatusClient orderNumber={order.orderNumber} order={authorized ? order : undefined} authorized={authorized} />
    </div>
  );
}
