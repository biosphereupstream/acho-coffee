import { NextResponse } from "next/server";
import { getTracking } from "@/lib/shipping/biteship";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const waybill = url.searchParams.get("waybill") ?? "";
  if (!waybill) return NextResponse.json({ status: "", history: [] });
  const data = await getTracking(waybill);
  return NextResponse.json(data);
}
