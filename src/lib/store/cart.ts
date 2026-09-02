import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import type { CartItemInput, CartItemRecord } from "@/lib/types";

const DATA_DIR = process.env.ACHO_DATA_DIR
  ? path.resolve(process.env.ACHO_DATA_DIR)
  : path.join(process.cwd(), ".data");
const CART_DATA_FILE = path.join(DATA_DIR, "demo-cart.json");

async function readDemoCartStore(): Promise<CartItemRecord[]> {
  try {
    const raw = await fs.readFile(CART_DATA_FILE, "utf8");
    return JSON.parse(raw) as CartItemRecord[];
  } catch {
    return [];
  }
}

async function writeDemoCartStore(items: CartItemRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = CART_DATA_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(items), "utf8");
  await fs.rename(tmp, CART_DATA_FILE);
}

export async function getCartItems({
  userId,
  guestId,
}: {
  userId?: string | null;
  guestId?: string | null;
}): Promise<CartItemRecord[]> {
  if (!userId && !guestId) return [];

  if (db) {
    try {
      const condition = userId
        ? eq(schema.cartItems.userId, userId)
        : eq(schema.cartItems.guestId, guestId!);

      const rows = await db
        .select()
        .from(schema.cartItems)
        .where(condition)
        .orderBy(schema.cartItems.createdAt);

      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        guestId: r.guestId,
        coffeeSlug: r.coffeeSlug,
        coffeeName: r.coffeeName,
        roastProfileCode: r.roastProfileCode,
        roastProfileName: r.roastProfileName,
        grindSize: r.grindSize,
        quantity: r.quantity,
        unitPriceIdr: r.unitPriceIdr,
        weightGrams: r.weightGrams ?? 250,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (err) {
      console.warn("Database error querying cart_items, falling back to demo store:", err);
    }
  }

  // Fallback demo file store
  const all = await readDemoCartStore();
  return all.filter((i) => (userId ? i.userId === userId : i.guestId === guestId));
}

export async function addToCart(
  input: CartItemInput & { userId?: string | null; guestId?: string | null }
): Promise<CartItemRecord> {
  const now = new Date().toISOString();

  if (db) {
    try {
      const existing = await db
        .select()
        .from(schema.cartItems)
        .where(
          and(
            input.userId
              ? eq(schema.cartItems.userId, input.userId)
              : eq(schema.cartItems.guestId, input.guestId!),
            eq(schema.cartItems.coffeeSlug, input.coffeeSlug),
            eq(schema.cartItems.roastProfileCode, input.roastProfileCode),
            eq(schema.cartItems.grindSize, input.grindSize)
          )
        );

      if (existing.length > 0) {
        const item = existing[0];
        const newQty = item.quantity + input.quantity;
        const [updated] = await db
          .update(schema.cartItems)
          .set({ quantity: newQty, updatedAt: now })
          .where(eq(schema.cartItems.id, item.id))
          .returning();

        return {
          id: updated.id,
          userId: updated.userId,
          guestId: updated.guestId,
          coffeeSlug: updated.coffeeSlug,
          coffeeName: updated.coffeeName,
          roastProfileCode: updated.roastProfileCode,
          roastProfileName: updated.roastProfileName,
          grindSize: updated.grindSize,
          quantity: updated.quantity,
          unitPriceIdr: updated.unitPriceIdr,
          weightGrams: updated.weightGrams ?? 250,
          imageUrl: updated.imageUrl,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      }

      const [inserted] = await db
        .insert(schema.cartItems)
        .values({
          userId: input.userId,
          guestId: input.guestId,
          coffeeSlug: input.coffeeSlug,
          coffeeName: input.coffeeName,
          roastProfileCode: input.roastProfileCode,
          roastProfileName: input.roastProfileName,
          grindSize: input.grindSize,
          quantity: input.quantity,
          unitPriceIdr: input.unitPriceIdr,
          weightGrams: input.weightGrams ?? 250,
          imageUrl: input.imageUrl,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        id: inserted.id,
        userId: inserted.userId,
        guestId: inserted.guestId,
        coffeeSlug: inserted.coffeeSlug,
        coffeeName: inserted.coffeeName,
        roastProfileCode: inserted.roastProfileCode,
        roastProfileName: inserted.roastProfileName,
        grindSize: inserted.grindSize,
        quantity: inserted.quantity,
        unitPriceIdr: inserted.unitPriceIdr,
        weightGrams: inserted.weightGrams ?? 250,
        imageUrl: inserted.imageUrl,
        createdAt: inserted.createdAt,
        updatedAt: inserted.updatedAt,
      };
    } catch (err) {
      console.warn("Database error inserting to cart_items, falling back to demo store:", err);
    }
  }

  // Fallback demo file store
  const all = await readDemoCartStore();
  const existingIdx = all.findIndex(
    (i) =>
      (input.userId ? i.userId === input.userId : i.guestId === input.guestId) &&
      i.coffeeSlug === input.coffeeSlug &&
      i.roastProfileCode === input.roastProfileCode &&
      i.grindSize === input.grindSize
  );

  if (existingIdx >= 0) {
    all[existingIdx].quantity += input.quantity;
    all[existingIdx].updatedAt = now;
    await writeDemoCartStore(all);
    return all[existingIdx];
  }

  const newItem: CartItemRecord = {
    id: randomUUID(),
    userId: input.userId,
    guestId: input.guestId,
    coffeeSlug: input.coffeeSlug,
    coffeeName: input.coffeeName,
    roastProfileCode: input.roastProfileCode,
    roastProfileName: input.roastProfileName,
    grindSize: input.grindSize,
    quantity: input.quantity,
    unitPriceIdr: input.unitPriceIdr,
    weightGrams: input.weightGrams ?? 250,
    imageUrl: input.imageUrl,
    createdAt: now,
    updatedAt: now,
  };
  all.push(newItem);
  await writeDemoCartStore(all);
  return newItem;
}

export async function updateCartItemQuantity(id: string, quantity: number): Promise<CartItemRecord | null> {
  const now = new Date().toISOString();

  if (quantity <= 0) {
    await removeCartItem(id);
    return null;
  }

  if (db) {
    try {
      const [updated] = await db
        .update(schema.cartItems)
        .set({ quantity, updatedAt: now })
        .where(eq(schema.cartItems.id, id))
        .returning();

      if (updated) {
        return {
          id: updated.id,
          userId: updated.userId,
          guestId: updated.guestId,
          coffeeSlug: updated.coffeeSlug,
          coffeeName: updated.coffeeName,
          roastProfileCode: updated.roastProfileCode,
          roastProfileName: updated.roastProfileName,
          grindSize: updated.grindSize,
          quantity: updated.quantity,
          unitPriceIdr: updated.unitPriceIdr,
          weightGrams: updated.weightGrams ?? 250,
          imageUrl: updated.imageUrl,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      }
    } catch (err) {
      console.warn("Database error updating cart item quantity, falling back to demo store:", err);
    }
  }

  // Fallback demo file store
  const all = await readDemoCartStore();
  const item = all.find((i) => i.id === id);
  if (!item) return null;
  item.quantity = quantity;
  item.updatedAt = now;
  await writeDemoCartStore(all);
  return item;
}

export async function removeCartItem(id: string): Promise<boolean> {
  if (db) {
    try {
      await db.delete(schema.cartItems).where(eq(schema.cartItems.id, id));
      return true;
    } catch (err) {
      console.warn("Database error deleting cart item, falling back to demo store:", err);
    }
  }

  const all = await readDemoCartStore();
  const next = all.filter((i) => i.id !== id);
  await writeDemoCartStore(next);
  return true;
}

export async function clearCart({
  userId,
  guestId,
}: {
  userId?: string | null;
  guestId?: string | null;
}): Promise<boolean> {
  if (!userId && !guestId) return false;

  if (db) {
    try {
      const condition = userId
        ? eq(schema.cartItems.userId, userId)
        : eq(schema.cartItems.guestId, guestId!);
      await db.delete(schema.cartItems).where(condition);
      return true;
    } catch (err) {
      console.warn("Database error clearing cart, falling back to demo store:", err);
    }
  }

  const all = await readDemoCartStore();
  const next = all.filter((i) => (userId ? i.userId !== userId : i.guestId !== guestId));
  await writeDemoCartStore(next);
  return true;
}

export async function mergeGuestCart({
  guestId,
  userId,
}: {
  guestId: string;
  userId: string;
}): Promise<void> {
  if (!guestId || !userId) return;

  if (db) {
    try {
      await db
        .update(schema.cartItems)
        .set({ userId, guestId: null })
        .where(eq(schema.cartItems.guestId, guestId));
      return;
    } catch (err) {
      console.warn("Database error merging guest cart, falling back to demo store:", err);
    }
  }

  const all = await readDemoCartStore();
  for (const item of all) {
    if (item.guestId === guestId) {
      item.userId = userId;
      item.guestId = null;
    }
  }
  await writeDemoCartStore(all);
}
