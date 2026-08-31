import { NextResponse } from "next/server";
import { searchAreas } from "@/lib/shipping/biteship";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const areas = await searchAreas(q);
  return NextResponse.json(areas);
}
