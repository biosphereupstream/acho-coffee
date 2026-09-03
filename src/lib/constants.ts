export const SITE_NAME = "Biosphere Roast Works";
export const SITE_TAGLINE = "Where Science Meets Soul — Freshly Brewed · Straight to Your Door";
export const CURRENCY = "IDR";
export const BAG_WEIGHT_GRAMS = 250;

/** Berapa hari setelah tanggal pesan, kopi siap diambil/dikirim (roast + rest). */
export const ROAST_LEAD_DAYS = 2;
/** Kapasitas roasting per hari (dalam bungkus 250g) untuk jadwal antrian pickup. */
export const DAILY_CAPACITY_BAGS = 120;
/** Jam pickup yang tersedia. */
export const PICKUP_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "13:00 - 15:00", "15:00 - 17:00"] as const;

export const ROAST_STAGES = [
  { key: "green", label: "Green Bean", title: "Biji Kopi Hijau", desc: "Biji kopi pilihan dari petani lokal nusantara, dipilih dengan standar specialty grade." },
  { key: "light", label: "Light Roast", title: "Light Roast", desc: "First crack — aroma floral & fruity mulai muncul, keasaman cerah khas single origin." },
  { key: "medium", label: "Medium Roast", title: "Medium Roast", desc: "Keseimbangan sempurna: body mulai terbentuk, rasa karamel & kacang mulai dominan." },
  { key: "grind", label: "Grind", title: "Digiling Sesuai Pesanan", desc: "Digiling sesuai metode seduhmu — bean utuh, fine, medium, atau coarse." },
  { key: "brew", label: "Brew", title: "Siap Diseduh", desc: "Fresh dalam 72 jam, diambil di roastery atau dikirim ke pintu rumahmu." },
] as const;

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(value);
}

export function formatDateID(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

export const GRIND_LABELS: Record<string, string> = {
  bean: "Biji Utuh (Bean)",
  fine: "Giling Halus (Fine)",
  medium: "Giling Sedang (Medium)",
  coarse: "Giling Kasar (Coarse)",
};

