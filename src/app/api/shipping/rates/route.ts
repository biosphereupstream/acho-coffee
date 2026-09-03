import { NextResponse } from "next/server";
import { getRates, searchAreas } from "@/lib/shipping/biteship";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    areaId?: string;
    destinationAreaId?: string;
    destinationCity?: string;
    postalCode?: string;
    weightGrams?: number;
    items?: { name: string; value: number; weight: number; quantity: number }[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  // Cari areaId dari destinationAreaId atau areaId
  let targetAreaId = body?.destinationAreaId || body?.areaId || "";

  // Jika belum ada areaId, coba auto-resolve dari postalCode atau destinationCity
  if (!targetAreaId && (body?.postalCode || body?.destinationCity)) {
    try {
      // Prioritaskan postal code karena sangat spesifik di Biteship (mis. 16810 -> Citeureup)
      if (body.postalCode && body.postalCode.trim().length >= 4) {
        const postalAreas = await searchAreas(body.postalCode.trim());
        if (postalAreas.length > 0) {
          targetAreaId = postalAreas[0].id;
        }
      }
      // Jika belum ketemu, coba dari destinationCity
      if (!targetAreaId && body.destinationCity && body.destinationCity.trim().length >= 3) {
        const cityAreas = await searchAreas(body.destinationCity.trim());
        if (cityAreas.length > 0) {
          targetAreaId = cityAreas[0].id;
        }
      }
    } catch {
      // noop
    }
  }

  // Format items secara aman
  const rawItems =
    Array.isArray(body?.items) && body.items.length > 0
      ? body.items
      : [
          {
            name: "Kopi Specialty Biosphere",
            value: 100000,
            weight: body?.weightGrams || 250,
            quantity: 1,
          },
        ];

  const items = rawItems.map((item) => ({
    name: item.name || "Kopi Specialty",
    value: typeof item.value === "number" ? item.value : 100000,
    weight: typeof item.weight === "number" && item.weight > 0 ? item.weight : 250,
    quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
  }));

  try {
    const rates = await getRates(targetAreaId, items);
    return NextResponse.json({
      success: true,
      rates,
      pricing: rates,
      resolvedAreaId: targetAreaId || null,
    });
  } catch (err) {
    console.error("[shipping/rates] Gagal kalkulasi tarif kurir:", err);
    const fallbackRates = [
      { company: "jne", courierName: "JNE Reguler", courierCode: "reg", price: 18000, duration: "1 - 2 hari", serviceType: "reg" },
      { company: "jnt", courierName: "J&T Reguler", courierCode: "EZ", price: 20000, duration: "1 - 2 hari", serviceType: "EZ" },
      { company: "sicepat", courierName: "SiCepat REG", courierCode: "REG", price: 17000, duration: "1 - 3 hari", serviceType: "REG" },
      { company: "anteraja", courierName: "AnterAja Reguler", courierCode: "reguler", price: 19000, duration: "1 - 3 hari", serviceType: "reguler" },
    ];
    return NextResponse.json({
      success: true,
      rates: fallbackRates,
      pricing: fallbackRates,
      resolvedAreaId: null,
    });
  }
}
