import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { createOrderSchema } from "@/lib/validation";
import { createOrder } from "@/lib/store/orders";
import { createClient as getSupabaseServer } from "@/lib/server";
import { emails } from "@/lib/email";
import { GUEST_COOKIE, GUEST_COOKIE_OPTIONS, appendGuestCookie } from "@/lib/order-access";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid: " + (parsed.error.issues[0]?.message ?? "periksa kembali") },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const guestToken = randomUUID();
  const order = await createOrder({
    ...parsed.data,
    userId: user?.id ?? undefined,
    guestEmail: user?.email ?? parsed.data.customerEmail,
    guestToken,
  });

  await emails.orderCreated(order).catch(() => {});

  const cookieStore = await cookies();
  const currentRaw = cookieStore.get(GUEST_COOKIE)?.value;
  const appended = appendGuestCookie(currentRaw, order.orderNumber, guestToken);

  const res = NextResponse.json({ orderNumber: order.orderNumber });
  res.cookies.set(GUEST_COOKIE, appended, GUEST_COOKIE_OPTIONS);
  return res;
}
