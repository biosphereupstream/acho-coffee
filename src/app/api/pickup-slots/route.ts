import { NextResponse } from "next/server";
import { getPickupAvailability } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const days = await getPickupAvailability(14);
  return NextResponse.json(days);
}
