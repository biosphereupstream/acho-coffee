import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { db, schema } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import type { UserAddressInput, UserAddressRecord } from "@/lib/types";

const DATA_DIR = process.env.ACHO_DATA_DIR
  ? path.resolve(process.env.ACHO_DATA_DIR)
  : path.join(process.cwd(), ".data");
const DEMO_FILE = path.join(DATA_DIR, "demo-addresses.json");

async function readDemoAddresses(): Promise<UserAddressRecord[]> {
  try {
    const raw = await fs.readFile(DEMO_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeDemoAddresses(items: UserAddressRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DEMO_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function getUserAddresses(userId: string): Promise<UserAddressRecord[]> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(schema.userAddresses)
        .where(eq(schema.userAddresses.userId, userId))
        .orderBy(desc(schema.userAddresses.isDefault), desc(schema.userAddresses.createdAt));

      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        label: r.label,
        recipientName: r.recipientName,
        phone: r.phone,
        address: r.address,
        city: r.city,
        postalCode: r.postalCode,
        areaId: r.areaId,
        areaName: r.areaName,
        isDefault: r.isDefault,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (e) {
      console.warn("Database error querying user_addresses, falling back to demo store:", e);
    }
  }

  const all = await readDemoAddresses();
  return all
    .filter((a) => a.userId === userId)
    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
}

export async function createUserAddress(
  userId: string,
  input: UserAddressInput
): Promise<UserAddressRecord> {
  const now = new Date().toISOString();

  if (db) {
    try {
      // Periksa apakah ini alamat pertama pengguna
      const existing = await db
        .select({ id: schema.userAddresses.id })
        .from(schema.userAddresses)
        .where(eq(schema.userAddresses.userId, userId));

      const isFirst = existing.length === 0;
      const shouldBeDefault = isFirst || Boolean(input.isDefault);

      // Jika disetel sebagai default, nonaktifkan default pada alamat lain milik pengguna
      if (shouldBeDefault && !isFirst) {
        await db
          .update(schema.userAddresses)
          .set({ isDefault: false, updatedAt: now })
          .where(eq(schema.userAddresses.userId, userId));
      }

      const [row] = await db
        .insert(schema.userAddresses)
        .values({
          userId,
          label: input.label.trim() || "Rumah",
          recipientName: input.recipientName.trim(),
          phone: input.phone.trim(),
          address: input.address.trim(),
          city: input.city.trim(),
          postalCode: input.postalCode.trim(),
          areaId: input.areaId ?? null,
          areaName: input.areaName ?? null,
          isDefault: shouldBeDefault,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        id: row.id,
        userId: row.userId,
        label: row.label,
        recipientName: row.recipientName,
        phone: row.phone,
        address: row.address,
        city: row.city,
        postalCode: row.postalCode,
        areaId: row.areaId,
        areaName: row.areaName,
        isDefault: row.isDefault,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    } catch (e) {
      console.warn("Database error inserting user_address, falling back to demo store:", e);
    }
  }

  // Demo store
  const all = await readDemoAddresses();
  const userAddrs = all.filter((a) => a.userId === userId);
  const isFirst = userAddrs.length === 0;
  const shouldBeDefault = isFirst || Boolean(input.isDefault);

  if (shouldBeDefault) {
    for (const a of all) {
      if (a.userId === userId) a.isDefault = false;
    }
  }

  const record: UserAddressRecord = {
    id: randomUUID(),
    userId,
    label: input.label.trim() || "Rumah",
    recipientName: input.recipientName.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    postalCode: input.postalCode.trim(),
    areaId: input.areaId ?? null,
    areaName: input.areaName ?? null,
    isDefault: shouldBeDefault,
    createdAt: now,
    updatedAt: now,
  };

  all.push(record);
  await writeDemoAddresses(all);
  return record;
}

export async function updateUserAddress(
  userId: string,
  id: string,
  input: Partial<UserAddressInput>
): Promise<UserAddressRecord | null> {
  const now = new Date().toISOString();

  if (db) {
    try {
      if (input.isDefault) {
        await db
          .update(schema.userAddresses)
          .set({ isDefault: false, updatedAt: now })
          .where(eq(schema.userAddresses.userId, userId));
      }

      const updateData: Record<string, unknown> = { updatedAt: now };
      if (input.label !== undefined) updateData.label = input.label.trim();
      if (input.recipientName !== undefined) updateData.recipientName = input.recipientName.trim();
      if (input.phone !== undefined) updateData.phone = input.phone.trim();
      if (input.address !== undefined) updateData.address = input.address.trim();
      if (input.city !== undefined) updateData.city = input.city.trim();
      if (input.postalCode !== undefined) updateData.postalCode = input.postalCode.trim();
      if (input.areaId !== undefined) updateData.areaId = input.areaId;
      if (input.areaName !== undefined) updateData.areaName = input.areaName;
      if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

      const [updated] = await db
        .update(schema.userAddresses)
        .set(updateData)
        .where(and(eq(schema.userAddresses.id, id), eq(schema.userAddresses.userId, userId)))
        .returning();

      if (!updated) return null;
      return {
        id: updated.id,
        userId: updated.userId,
        label: updated.label,
        recipientName: updated.recipientName,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        postalCode: updated.postalCode,
        areaId: updated.areaId,
        areaName: updated.areaName,
        isDefault: updated.isDefault,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (e) {
      console.warn("Database error updating user_address, falling back to demo store:", e);
    }
  }

  // Demo store
  const all = await readDemoAddresses();
  const idx = all.findIndex((a) => a.id === id && a.userId === userId);
  if (idx === -1) return null;

  if (input.isDefault) {
    for (const a of all) {
      if (a.userId === userId) a.isDefault = false;
    }
  }

  const existing = all[idx];
  const updated: UserAddressRecord = {
    ...existing,
    ...input,
    updatedAt: now,
  };
  all[idx] = updated;
  await writeDemoAddresses(all);
  return updated;
}

export async function deleteUserAddress(userId: string, id: string): Promise<boolean> {
  if (db) {
    try {
      const [existing] = await db
        .select()
        .from(schema.userAddresses)
        .where(and(eq(schema.userAddresses.id, id), eq(schema.userAddresses.userId, userId)));

      if (!existing) return false;

      await db
        .delete(schema.userAddresses)
        .where(and(eq(schema.userAddresses.id, id), eq(schema.userAddresses.userId, userId)));

      // Jika yang dihapus adalah default, pilih alamat tersisa yang paling baru sebagai default baru
      if (existing.isDefault) {
        const remaining = await db
          .select()
          .from(schema.userAddresses)
          .where(eq(schema.userAddresses.userId, userId))
          .orderBy(desc(schema.userAddresses.createdAt))
          .limit(1);

        if (remaining.length > 0) {
          await db
            .update(schema.userAddresses)
            .set({ isDefault: true })
            .where(eq(schema.userAddresses.id, remaining[0].id));
        }
      }
      return true;
    } catch (e) {
      console.warn("Database error deleting user_address, falling back to demo store:", e);
    }
  }

  // Demo store
  const all = await readDemoAddresses();
  const target = all.find((a) => a.id === id && a.userId === userId);
  if (!target) return false;

  const next = all.filter((a) => !(a.id === id && a.userId === userId));
  if (target.isDefault) {
    const nextUser = next.find((a) => a.userId === userId);
    if (nextUser) nextUser.isDefault = true;
  }
  await writeDemoAddresses(next);
  return true;
}
