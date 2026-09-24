import { NextResponse } from "next/server";
import { validateVoucher } from "@/data/vouchers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  let body: { code?: string; subtotal?: number; shippingFee?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  if (!body.code || typeof body.code !== "string") {
    return NextResponse.json({ error: "Kode voucher wajib diisi" }, { status: 400 });
  }

  const subtotal = typeof body.subtotal === "number" ? body.subtotal : 0;
  const shippingFee = typeof body.shippingFee === "number" ? body.shippingFee : 0;

  // 1. Cek voucher statis terlebih dahulu
  const result = validateVoucher(body.code, subtotal, shippingFee);
  if (result.valid) {
    return NextResponse.json(result);
  }

  // 2. Cek voucher promosi dinamis dari database (customer_broadcasts)
  const normalizedCode = body.code.trim().toUpperCase();

  if (db) {
    try {
      const records = await db
        .select()
        .from(schema.customerBroadcasts)
        .where(eq(schema.customerBroadcasts.promoCode, normalizedCode))
        .limit(1);

      if (records.length > 0) {
        const promo = records[0];

        if (promo.status === "cancelled" || promo.status === "expired") {
          return NextResponse.json(
            { error: `Voucher "${normalizedCode}" sudah tidak aktif atau dibatalkan.` },
            { status: 400 }
          );
        }

        const discountAmount = Math.round((subtotal * (promo.discountPercent || 10)) / 100);

        return NextResponse.json({
          valid: true,
          voucher: {
            code: promo.promoCode,
            description: promo.title,
            type: "percentage",
            value: promo.discountPercent,
            minOrder: 0,
          },
          discountAmount,
          message: `Voucher promosi "${promo.promoCode}" (${promo.discountPercent}%) berhasil diterapkan!`,
        });
      }
    } catch (err) {
      console.warn("[Voucher Validate DB] Gagal memeriksa voucher di database:", err);
    }
  }

  return NextResponse.json(
    { error: result.message ?? `Kode voucher "${normalizedCode}" tidak ditemukan atau sudah kedaluwarsa.` },
    { status: 400 }
  );
}

