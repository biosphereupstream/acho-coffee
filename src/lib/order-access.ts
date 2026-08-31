import "server-only";
import type { OrderRecord } from "@/lib/types";

export const GUEST_COOKIE = "acho_orders";

export interface GuestEntry {
  n: string;
  t: string;
}

/** Parse cookie pesanan tamu: { orderNumber: token } */
export function parseGuestCookie(raw: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!raw) return map;
  try {
    const arr = JSON.parse(raw) as GuestEntry[];
    for (const e of arr) {
      if (e?.n && e?.t) map[e.n] = e.t;
    }
  } catch {
    // cookie korup — abaikan
  }
  return map;
}

export function appendGuestCookie(raw: string | undefined, orderNumber: string, token: string): string {
  const map = parseGuestCookie(raw);
  map[orderNumber] = token;
  const arr = Object.entries(map).map(([n, t]) => ({ n, t }));
  return JSON.stringify(arr.slice(-10)); // simpan 10 pesanan terakhir
}

export function canAccessOrder(
  order: OrderRecord,
  ctx: { userId?: string; guestTokens: Record<string, string>; tokenParam?: string }
): boolean {
  if (ctx.userId && order.userId && order.userId === ctx.userId) return true;
  if (!order.guestToken) return false;
  if (ctx.guestTokens[order.orderNumber] === order.guestToken) return true;
  if (ctx.tokenParam && ctx.tokenParam === order.guestToken) return true;
  return false;
}

export const GUEST_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
