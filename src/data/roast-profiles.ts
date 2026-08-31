import type { BrewMethod, RoastLevel, RoastProfileOption, TasteProfile } from "@/lib/types";

export const ROAST_PROFILES: RoastProfileOption[] = [
  {
    code: "light",
    name: "Light Roast",
    level: "light",
    description:
      "Dipanggang hingga first crack. Keasaman cerah, aroma floral & fruity paling terasa. Menonjolkan karakter asli biji kopi.",
    notes: ["Floral", "Fruity", "Keasaman cerah"],
    bestFor: ["V60", "Pour Over", "Aeropress"],
  },
  {
    code: "medium",
    name: "Medium Roast",
    level: "medium",
    description:
      "Sweet spot favorit banyak orang: keseimbangan antara keasaman dan body, dengan manis karamel dan kacang yang hangat.",
    notes: ["Karamel", "Kacang", "Seimbang"],
    bestFor: ["V60", "Aeropress", "French Press", "Tubruk"],
  },
  {
    code: "medium_dark",
    name: "Medium Dark Roast",
    level: "medium_dark",
    description:
      "Menjelang second crack. Body lebih tebal, rasa cokelat pekat, dengan manis gula aren. Idola para pecinta espresso.",
    notes: ["Cokelat pekat", "Gula aren", "Body tebal"],
    bestFor: ["Espresso", "Moka Pot"],
  },
  {
    code: "dark",
    name: "Dark Roast",
    level: "dark",
    description:
      "Second crack penuh. Bold, smokey, pahit legit tanpa keasaman. Kuat untuk susu dan seduhan tubruk klasik.",
    notes: ["Bold", "Smokey", "Pahit legit"],
    bestFor: ["Espresso", "French Press", "Tubruk"],
  },
];

export function getRoastProfile(code: string): RoastProfileOption | undefined {
  return ROAST_PROFILES.find((r) => r.code === code);
}

export const BREW_METHODS: BrewMethod[] = [
  { id: "v60", name: "V60 / Pour Over", icon: "☕", desc: "Seduhan manual, rasa jernih" },
  { id: "espresso", name: "Espresso", icon: "⚡", desc: "Pekat, untuk latte & cappuccino" },
  { id: "moka", name: "Moka Pot", icon: "🍶", desc: "Espresso rumahan klasik" },
  { id: "french", name: "French Press", icon: "🫖", desc: "Body penuh, sederhana" },
  { id: "tubruk", name: "Tubruk", icon: "🥤", desc: "Seduhan klasik nusantara" },
];

export const TASTE_PROFILES: TasteProfile[] = [
  { id: "fruity", name: "Fruity & Floral", icon: "🍊", desc: "Cerah, asam segar, wangi bunga" },
  { id: "balanced", name: "Balanced", icon: "⚖️", desc: "Manis-asam seimbang" },
  { id: "chocolate", name: "Chocolate & Nutty", icon: "🍫", desc: "Manis cokelat, kacang" },
  { id: "bold", name: "Bold & Smokey", icon: "🔥", desc: "Pekat, kuat, pahit legit" },
];

interface Recommendation {
  level: RoastLevel;
  reason: string;
}

export function recommendRoast(
  brewMethodId: string,
  tasteId: string,
  coffeeType: "single_origin" | "blend"
): Recommendation {
  const score: Record<RoastLevel, number> = { light: 0, medium: 0, medium_dark: 0, dark: 0 };

  const brewScores: Record<string, Partial<Record<RoastLevel, number>>> = {
    v60: { light: 2, medium: 1 },
    espresso: { medium_dark: 2, dark: 1 },
    moka: { medium_dark: 2, medium: 1 },
    french: { dark: 2, medium: 1 },
    tubruk: { dark: 2, medium: 1 },
  };
  const tasteScores: Record<string, Partial<Record<RoastLevel, number>>> = {
    fruity: { light: 2, medium: 1 },
    balanced: { medium: 2, light: 1, medium_dark: 1 },
    chocolate: { medium_dark: 2, dark: 1, medium: 1 },
    bold: { dark: 2, medium_dark: 1 },
  };

  for (const [level, pts] of Object.entries(brewScores[brewMethodId] ?? {})) {
    score[level as RoastLevel] += pts ?? 0;
  }
  for (const [level, pts] of Object.entries(tasteScores[tasteId] ?? {})) {
    score[level as RoastLevel] += pts ?? 0;
  }
  if (coffeeType === "single_origin") {
    score.light += 1;
  } else {
    score.medium_dark += 1;
    score.dark += 1;
  }

  const sorted = (Object.entries(score) as [RoastLevel, number][]).sort((a, b) => b[1] - a[1]);
  const [level] = sorted[0];

  const reasons: Record<RoastLevel, string> = {
    light: "Metode seduh & selera kamu paling cocok dengan profil cerah — karakter asli biji kopi akan menonjol.",
    medium: "Pilihan paling seimbang: manis karamel bertemu keasaman lembut. Aman dan disukai banyak orang.",
    medium_dark: "Body tebal dan manis cokelat akan melengkapi cara seduh kamu — tekstur creamy di setiap tegukan.",
    dark: "Profil bold yang kuat, pas untuk seduhan pekat kamu. Cocok dicampur susu atau dinikmati tubruk.",
  };

  return { level, reason: reasons[level] };
}

export const GRIND_SIZES = [
  { id: "bean", name: "Biji Utuh (Bean)", desc: "Grinder sendiri di rumah — kesegaran maksimal", icon: "🫘" },
  { id: "fine", name: "Fine", desc: "Espresso & Moka Pot", icon: "⚡" },
  { id: "medium", name: "Medium", desc: "V60, Aeropress, Drip", icon: "☕" },
  { id: "coarse", name: "Coarse", desc: "French Press & Tubruk", icon: "🫖" },
] as const;
