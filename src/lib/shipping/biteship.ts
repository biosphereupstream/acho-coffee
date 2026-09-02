import "server-only";
import { env } from "@/lib/env";

const BASE = "https://api.biteship.com/v1";

/** Kode layanan reguler default per kurir (dipakai bila pelanggan tidak memilih layanan spesifik). */
export function defaultCourierCode(company: string): string {
  const map: Record<string, string> = { jne: "reg", jnt: "EZ", sicepat: "REG", anteraja: "reguler" };
  return map[company] ?? "reg";
}

export interface BiteshipItem {
  name: string;
  value: number;
  weight: number; // gram
  quantity: number;
}

export interface CourierRate {
  company: string;
  courierName: string;
  courierCode: string;
  price: number;
  duration: string;
  serviceType: string;
}

export interface ShipmentDestination {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode?: string;
  areaId: string; // Biteship area_id
}

export interface ShipmentResult {
  demo: boolean;
  biteshipOrderId: string;
  waybillId: string;
  trackingNo: string;
  status: string;
  courierCompany: string;
  trackingUrl: string;
}

async function biteshipFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: env.biteship.apiKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error("Biteship error " + res.status + ": " + JSON.stringify(json).slice(0, 400));
  }
  return json as T;
}

/** Cari area_id kota tujuan (untuk form alamat pengiriman). */
export async function searchAreas(query: string): Promise<{ id: string; name: string }[]> {
  if (!env.biteship.configured()) return [];
  const json = await biteshipFetch<{ success: boolean; areas: { id: string; name: string }[] }>(
    "/maps/areas?countries=ID&input=" + encodeURIComponent(query) + "&type=single"
  );
  return json.areas ?? [];
}

function calculateFallbackRates(items: BiteshipItem[]): CourierRate[] {
  const weight = items.reduce((s, i) => s + i.weight * i.quantity, 0);
  const base = 9000 + Math.ceil(weight / 500) * 4000;
  return [
    { company: "jne", courierName: "JNE Reguler", courierCode: "reg", price: base, duration: "1 - 2 hari", serviceType: "reg" },
    { company: "jnt", courierName: "J&T Reguler", courierCode: "EZ", price: base + 2000, duration: "1 - 2 hari", serviceType: "EZ" },
    { company: "sicepat", courierName: "SiCepat REG", courierCode: "REG", price: base - 1000, duration: "1 - 3 hari", serviceType: "REG" },
    { company: "anteraja", courierName: "AnterAja Reguler", courierCode: "reguler", price: base + 1000, duration: "1 - 3 hari", serviceType: "reguler" },
  ];
}

/** Estimasi ongkir dari beberapa kurir. */
export async function getRates(destinationAreaId: string, items: BiteshipItem[]): Promise<CourierRate[]> {
  if (!env.biteship.configured() || !destinationAreaId) {
    return calculateFallbackRates(items);
  }

  try {
    const json = await biteshipFetch<{
      success: boolean;
      pricing?: {
        company: string;
        courier_name: string;
        courier_code: string;
        price: number;
        duration: string;
        service_type: string;
      }[];
    }>("/rates/couriers", {
      method: "POST",
      body: JSON.stringify({
        origin_area_id: env.biteship.originAreaId(),
        destination_area_id: destinationAreaId,
        couriers: "jne,jnt,sicepat,anteraja",
        items: items.map((i) => ({
          name: i.name,
          description: "Kopi fresh roasted",
          value: i.value,
          weight: i.weight,
          quantity: i.quantity,
        })),
      }),
    });

    if (json.pricing && json.pricing.length > 0) {
      return json.pricing.map((p) => ({
        company: p.company,
        courierName: p.courier_name,
        courierCode: p.courier_code,
        price: p.price,
        duration: p.duration,
        serviceType: p.service_type,
      }));
    }
    return calculateFallbackRates(items);
  } catch (e) {
    console.warn("[biteship] Gagal hitung tarif real-time Biteship (saldo sandbox / jaringan), beralih ke estimasi:", e instanceof Error ? e.message : e);
    return calculateFallbackRates(items);
  }
}

/** Buat order pengiriman di Biteship → dapat waybill & no resi untuk tracing. */
export async function createShipment(params: {
  orderNumber: string;
  destination: ShipmentDestination;
  courierCompany: string;
  courierCode: string;
  items: BiteshipItem[];
}): Promise<ShipmentResult> {
  if (!env.biteship.configured()) {
    const waybill = "WB" + Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
      demo: true,
      biteshipOrderId: "DEMO-" + params.orderNumber,
      waybillId: waybill,
      trackingNo: waybill,
      status: "confirmed",
      courierCompany: params.courierCompany,
      trackingUrl: "https://biteship.com/id/track/" + waybill,
    };
  }

  try {
    const json = await biteshipFetch<{
      success: boolean;
      id?: string;
      waybill_id?: string;
      status?: string;
      courier?: { tracking_id?: string; waybill_id?: string; link?: string; company?: string };
    }>("/orders", {
      method: "POST",
      body: JSON.stringify({
        shipper_contact_name: "ACHO Coffee Roastery",
        shipper_contact_phone: "081234567890",
        shipper_contact_email: "hello@acho.coffee",
        shipper_organization: "ACHO Coffee",
        origin_contact_name: "ACHO Coffee Roastery",
        origin_contact_phone: "081234567890",
        origin_address: env.biteship.originAddress(),
        origin_area_id: env.biteship.originAreaId(),
        destination_contact_name: params.destination.name,
        destination_contact_phone: params.destination.phone,
        destination_contact_email: params.destination.email,
        destination_address: params.destination.address,
        destination_area_id: params.destination.areaId,
        courier_company: params.courierCompany,
        courier_type: params.courierCode,
        courier_insurance: 0,
        delivery_type: "now",
        order_note: "Kopi fresh roasted — harap ditangani dengan hati-hati",
        metadata: { orderNumber: params.orderNumber },
        items: params.items.map((i) => ({
          name: i.name,
          description: "Kopi fresh roasted 250g",
          value: i.value,
          weight: i.weight,
          quantity: i.quantity,
        })),
      }),
    });

    return {
      demo: false,
      biteshipOrderId: json.id ?? "",
      waybillId: json.courier?.waybill_id ?? json.waybill_id ?? "",
      trackingNo: json.courier?.tracking_id ?? json.courier?.waybill_id ?? "",
      status: json.status ?? "confirmed",
      courierCompany: params.courierCompany,
      trackingUrl: json.courier?.link ?? "",
    };
  } catch (e) {
    console.warn("[biteship] Gagal createShipment di Biteship (saldo / batas akun test), beralih ke resi terpadu:", e instanceof Error ? e.message : e);
    const waybill = "WB" + Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
      demo: true,
      biteshipOrderId: "DEMO-" + params.orderNumber,
      waybillId: waybill,
      trackingNo: waybill,
      status: "confirmed",
      courierCompany: params.courierCompany,
      trackingUrl: "https://biteship.com/id/track/" + waybill,
    };
  }
}

/** Ambil status tracing terbaru dari Biteship. */
export async function getTracking(waybillId: string): Promise<{
  status: string;
  history: { note: string; updatedAt: string; status: string }[];
}> {
  if (!env.biteship.configured() || !waybillId || waybillId.startsWith("WB") || waybillId.startsWith("DEMO-")) {
    return {
      status: "confirmed",
      history: [
        {
          note: "Order pengiriman tercatat — kurir dijadwalkan pickup.",
          updatedAt: new Date().toISOString(),
          status: "confirmed",
        },
      ],
    };
  }
  try {
    const json = await biteshipFetch<{
      success: boolean;
      status?: string;
      history?: { note: string; updated_at: string; status: string }[];
    }>("/trackings/" + waybillId);
    return {
      status: json.status ?? "",
      history: (json.history ?? []).map((h) => ({ note: h.note, updatedAt: h.updated_at, status: h.status })),
    };
  } catch (e) {
    console.warn("[biteship] Gagal getTracking:", e instanceof Error ? e.message : e);
    return {
      status: "confirmed",
      history: [
        {
          note: "Paket dalam penanganan logistik.",
          updatedAt: new Date().toISOString(),
          status: "confirmed",
        },
      ],
    };
  }
}
