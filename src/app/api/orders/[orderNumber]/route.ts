import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrderByNumber } from "@/lib/store/orders";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  GUEST_COOKIE,
  GUEST_COOKIE_OPTIONS,
  appendGuestCookie,
  canAccessOrder,
  parseGuestCookie,
} from "@/lib/order-access";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await ctx.params;
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("t") ?? undefined;

  const order = await getOrderByNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  const supabase = await getSupabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const cookieStore = await cookies();
  const tokens = parseGuestCookie(cookieStore.get(GUEST_COOKIE)?.value);

  if (!canAccessOrder(order, { userId: user?.id, guestTokens: tokens, tokenParam })) {
    return NextResponse.json(
      { error: "Akses ditolak — masukkan token dari email konfirmasi atau login dengan akun pemesan" },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ order });

  // simpan token ke cookie bila akses lewat tautan ?t=
  if (tokenParam && order.guestToken === tokenParam) {
    const appended = appendGuestCookie(cookieStore.get(GUEST_COOKIE)?.value, order.orderNumber, order.guestToken);
    res.cookies.set(GUEST_COOKIE, appended, GUEST_COOKIE_OPTIONS);
  }
  return res;
}
