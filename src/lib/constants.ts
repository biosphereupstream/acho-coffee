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
  {
    key: "drying",
    label: "Tahap 1",
    suhu: "100–160°C",
    title: "Drying phase",
    desc: "Penguapan air bebas dari dalam biji. Belum ada reaksi pencokelatan; biji masih hijau kekuningan.",
    isCritical: false,
  },
  {
    key: "yellowing",
    label: "Tahap 2",
    suhu: "160–170°C",
    title: "Yellowing",
    desc: "Kadar air turun drastis, reaksi Maillard mulai antara asam amino dan gula pereduksi. Muncul bau seperti roti panggang.",
    isCritical: false,
  },
  {
    key: "maillard",
    label: "Tahap 3",
    suhu: "170–200°C",
    title: "Maillard & karamelisasi",
    desc: "Ratusan senyawa volatil terbentuk di tahap ini. Gula mulai terkaramelisasi, warna coklat dan aroma khas kopi mulai terbentuk.",
    isCritical: false,
  },
  {
    key: "first_crack",
    label: "Tahap 4 • Titik Kritis",
    suhu: "196–205°C",
    title: "First crack",
    desc: "Tekanan uap air dan CO2 di dalam biji melebihi kekuatan struktur sel sehingga biji retak dan mengembang. Titik acuan untuk light roast.",
    isCritical: true,
  },
  {
    key: "development",
    label: "Tahap 5",
    suhu: "205–224°C",
    title: "Development time",
    desc: "Fase pasca first crack yang menentukan profil rasa akhir. Reaksi Strecker menghasilkan senyawa aromatik kompleks dan membangun body.",
    isCritical: false,
  },
  {
    key: "second_crack",
    label: "Tahap 6 • Titik Kritis",
    suhu: "224–230°C",
    title: "Second crack",
    desc: "Struktur sel pecah lebih jauh dan minyak dari dalam biji mulai keluar ke permukaan. Ciri khas dark roast.",
    isCritical: true,
  },
  {
    key: "cooling",
    label: "Tahap 7",
    suhu: "Pendinginan",
    title: "Cooling",
    desc: "Pendinginan cepat (biasanya dengan udara) untuk menghentikan reaksi kimia tepat pada titik yang diinginkan, mencegah carryover roast.",
    isCritical: false,
  },
] as const;

export const ROAST_IMPORTANT_NOTES = [
  {
    title: "First crack dan second crack adalah titik paling signifikan",
    desc: "Keduanya menandai perubahan struktur fisik biji akibat tekanan gas internal yang memecahkan dinding sel biji kopi.",
  },
  {
    title: "Development time penentu profil rasa akhir",
    desc: "Waktu setelah first crack adalah fase yang paling menentukan karakter rasa akhir dan menjadi variabel utama dalam kontrol kualitas roasting Biosphere.",
  },
  {
    title: "Pendinginan cepat mencegah carryover roast",
    desc: "Proses pendinginan harus dilakukan secepat mungkin karena panas sisa (residual heat) pada biji tetap memicu reaksi kimia meski sudah diangkat dari mesin roasting.",
  },
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

