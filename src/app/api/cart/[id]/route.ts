import { NextResponse } from "next/server";
import { getCartItems, removeCartItem, updateCartItemQuantity } from "@/lib/store/cart";
import { getCartIdentity } from "@/lib/cart-access";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  if (typeof body.quantity !== "number" || body.quantity < 0 || body.quantity > 20) {
    return NextResponse.json({ error: "Kuantitas harus antara 0 dan 20" }, { status: 400 });
  }

  await updateCartItemQuantity(id, body.quantity);

  const { userId, guestId } = await getCartIdentity();
  const items = await getCartItems({ userId, guestId });
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unitPriceIdr * i.quantity, 0);
  const totalWeightGrams = items.reduce((sum, i) => sum + (i.weightGrams ?? 250) * i.quantity, 0);

  return NextResponse.json({
    items,
    totalCount,
    subtotal,
    totalWeightGrams,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await removeCartItem(id);

  const { userId, guestId } = await getCartIdentity();
  const items = await getCartItems({ userId, guestId });
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unitPriceIdr * i.quantity, 0);
  const totalWeightGrams = items.reduce((sum, i) => sum + (i.weightGrams ?? 250) * i.quantity, 0);

  return NextResponse.json({
    items,
    totalCount,
    subtotal,
    totalWeightGrams,
  });
}
