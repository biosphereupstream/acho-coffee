import { NextResponse } from "next/server";
import { cartItemInputSchema } from "@/lib/validation";
import { addToCart, clearCart, getCartItems, mergeGuestCart } from "@/lib/store/cart";
import { GUEST_CART_COOKIE, GUEST_CART_COOKIE_OPTIONS, getCartIdentity } from "@/lib/cart-access";

export async function GET() {
  const { userId, guestId, isNewGuest } = await getCartIdentity();

  // Bila user sedang login dan sebelumnya punya guestId, merge keranjang tamu
  if (userId && guestId) {
    await mergeGuestCart({ guestId, userId }).catch(() => {});
  }

  const items = await getCartItems({ userId, guestId });
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPriceIdr * item.quantity, 0);
  const totalWeightGrams = items.reduce((sum, item) => sum + (item.weightGrams ?? 250) * item.quantity, 0);

  const res = NextResponse.json({
    items,
    totalCount,
    subtotal,
    totalWeightGrams,
  });

  if (isNewGuest) {
    res.cookies.set(GUEST_CART_COOKIE, guestId, GUEST_CART_COOKIE_OPTIONS);
  }

  return res;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = cartItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data produk tidak valid: " + (parsed.error.issues[0]?.message ?? "periksa kembali") },
      { status: 400 }
    );
  }

  const { userId, guestId, isNewGuest } = await getCartIdentity();

  const item = await addToCart({
    ...parsed.data,
    userId,
    guestId: userId ? null : guestId,
  });

  const items = await getCartItems({ userId, guestId });
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unitPriceIdr * i.quantity, 0);
  const totalWeightGrams = items.reduce((sum, i) => sum + (i.weightGrams ?? 250) * i.quantity, 0);

  const res = NextResponse.json({
    item,
    items,
    totalCount,
    subtotal,
    totalWeightGrams,
  });

  if (isNewGuest) {
    res.cookies.set(GUEST_CART_COOKIE, guestId, GUEST_CART_COOKIE_OPTIONS);
  }

  return res;
}

export async function DELETE() {
  const { userId, guestId } = await getCartIdentity();
  await clearCart({ userId, guestId });

  return NextResponse.json({
    items: [],
    totalCount: 0,
    subtotal: 0,
    totalWeightGrams: 0,
  });
}
