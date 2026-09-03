import { cn } from "@/lib/utils";
import type { CatalogCoffee } from "@/lib/types";

/** Ilustrasi kemasan kopi (SVG) — pengganti foto produk sebelum terhubung ke R2. */
export function CoffeeBagArt({ coffee, className }: { coffee: CatalogCoffee; className?: string }) {
  const bagId = "bag-" + coffee.slug;
  const goldId = "gold-" + coffee.slug;
  return (
    <svg viewBox="0 0 400 460" className={cn("h-full w-full", className)} role="img" aria-label={coffee.name}>
      <defs>
        <linearGradient id={bagId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={coffee.art.bg} />
          <stop offset="1" stopColor="#0a3d28" />
        </linearGradient>
        <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f6f1d" />
          <stop offset="0.5" stopColor="#c9a227" />
          <stop offset="1" stopColor="#f0d678" />
        </linearGradient>
      </defs>

      {/* bayangan */}
      <ellipse cx="200" cy="438" rx="120" ry="14" fill="#0a3d28" opacity="0.18" />

      {/* badan tas */}
      <path
        d="M120 120 C 120 150, 125 380, 150 420 L 250 420 C 275 380, 280 150, 280 120 Z"
        fill={"url(#" + bagId + ")"}
      />
      {/* lipatan atas */}
      <path d="M108 120 L 120 150 L 280 150 L 292 120 L 280 108 L 120 108 Z" fill="#0a3d28" />
      <path d="M108 120 L 200 138 L 292 120 L 280 108 L 200 96 L 120 108 Z" fill={"url(#" + goldId + ")"} opacity="0.9" />

      {/* label */}
      <rect x="150" y="185" width="100" height="130" rx="10" fill="#fdfaf3" stroke={"url(#" + goldId + ")"} strokeWidth="3" />
      <text x="200" y="210" textAnchor="middle" fontSize="12" fontWeight="900" fill="#0d3b26" letterSpacing="1">
        BIOSPHERE
      </text>
      <text x="200" y="223" textAnchor="middle" fontSize="8" fontWeight="800" fill="#c9a227" letterSpacing="1.5">
        ROAST WORKS
      </text>
      <text x="200" y="238" textAnchor="middle" fontSize="10" fontWeight="700" fill="#666" letterSpacing="1">
        {coffee.category === "beans" ? (coffee.type === "single_origin" ? "SINGLE ORIGIN" : "HOUSE BLEND") : (coffee.packageType || "FRESH BREW")}
      </text>

      {/* biji kopi */}
      <ellipse cx="200" cy="272" rx="26" ry="32" fill={coffee.art.bean} transform="rotate(18 200 272)" />
      <path d="M178 272 C 186 264, 214 264, 222 272" stroke="#3c2a14" strokeWidth="4" fill="none" strokeLinecap="round" />

      <text x="200" y="305" textAnchor="middle" fontSize="12" fontWeight="600" fill="#0d3b26">
        FRESH ROASTED
      </text>

      {/* nama kopi */}
      <text x="200" y="368" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fdfaf3" fontFamily="Georgia, serif">
        {coffee.name.length > 16 ? coffee.name.slice(0, 15) + "…" : coffee.name}
      </text>
      <text x="200" y="392" textAnchor="middle" fontSize="13" fill="#c9a227" fontWeight="600">
        {coffee.origin} • {coffee.weightGrams}g
      </text>
    </svg>
  );
}
