import { NextResponse } from "next/server";
import { getRates } from "@/lib/shipping/biteship";

export async function POST(req: Request) {
  let body: { areaId?: string; items?: { name: string; value: number; weight: number; quantity: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  if (!body?.areaId || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "areaId dan items wajib diisi" }, { status: 400 });
  }
  const rates = await getRates(body.areaId, body.items);
  return NextResponse.json(rates);
}
