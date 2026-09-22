"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useFrontendConfig } from "@/components/frontend-config-provider";

export function AnnouncementBanner({ initialConfig }: { initialConfig?: any }) {
  // Use live config from context (auto-polled) — initialConfig is only for SSR hydration fallback
  const liveConfig = useFrontendConfig();
  const config = liveConfig ?? initialConfig ?? null;

  const [dismissed, setDismissed] = useState(false);
  const [lastDismissedText, setLastDismissedText] = useState("");

  if (!config || !config.banner_enabled || !config.banner_text?.trim()) {
    return null;
  }

  // If dismissed earlier for the exact same text, keep hidden; if admin updated text, re-show!
  if (dismissed && lastDismissedText === config.banner_text) {
    return null;
  }

  const hasLink = Boolean(config.banner_link && config.banner_link.trim() !== "");

  return (
    <aside
      aria-label="Pengumuman Toko"
      className="relative z-50 bg-gradient-to-r from-emerald-950 via-forest-900 to-emerald-950 text-white border-b border-gold/40 shadow-xs"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs font-semibold sm:px-6">
        <div className="flex flex-1 items-center justify-center gap-2 text-center text-[11px] sm:text-xs">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-light">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="text-white/95 leading-tight">{config.banner_text}</span>
          {hasLink && (
            <Link
              href={config.banner_link}
              className="inline-flex items-center gap-1 font-bold text-gold-light underline underline-offset-4 hover:text-white transition-colors ml-1 shrink-0"
            >
              Lihat Promo <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setLastDismissedText(config.banner_text);
          }}
          className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Tutup Pengumuman"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
