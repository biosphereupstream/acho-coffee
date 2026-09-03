import { NextResponse } from "next/server";
import { searchAreas } from "@/lib/shipping/biteship";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q =
    url.searchParams.get("input") ||
    url.searchParams.get("query") ||
    url.searchParams.get("q") ||
    "";

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ success: true, areas: [] });
  }

  try {
    const areas = await searchAreas(q.trim());
    return NextResponse.json({
      success: true,
      areas,
    });
  } catch (error) {
    console.error("[shipping/areas] Gagal mencari area:", error);
    return NextResponse.json({
      success: false,
      areas: [],
    });
  }
}
