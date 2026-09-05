import { NextResponse } from "next/server";
import { getLiveMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const coffees = await getLiveMenu({ includeInactive: false });
    return NextResponse.json(
      { coffees, total: coffees.length },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to fetch live menu", details: msg }, { status: 500 });
  }
}
