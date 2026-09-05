import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getAuthenticatedUser } from "@/lib/server";

export const GUEST_CART_COOKIE = "acho_cart_id";

export const GUEST_CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 hari
};

export async function getCartIdentity(): Promise<{
  userId: string | null;
  guestId: string;
  isNewGuest: boolean;
}> {
  const user = await getAuthenticatedUser();

  const cookieStore = await cookies();
  const existingGuestId = cookieStore.get(GUEST_CART_COOKIE)?.value;

  if (existingGuestId) {
    return {
      userId: user?.id ?? null,
      guestId: existingGuestId,
      isNewGuest: false,
    };
  }

  const newGuestId = randomUUID();
  return {
    userId: user?.id ?? null,
    guestId: newGuestId,
    isNewGuest: true,
  };
}
