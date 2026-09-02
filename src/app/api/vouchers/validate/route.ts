import { NextResponse } from "next/server";
import { validateVoucher } from "@/data/vouchers";

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

  const result = validateVoucher(body.code, subtotal, shippingFee);

  if (!result.valid) {
    return NextResponse.json(
      { error: result.message ?? "Kode voucher tidak valid" },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
