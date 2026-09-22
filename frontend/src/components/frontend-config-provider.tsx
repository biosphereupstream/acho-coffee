"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface FrontendConfig {
  banner_enabled: boolean;
  banner_text: string;
  banner_link: string;
  announcement_text?: string;
  shop_open?: boolean;
  shop_notice?: string;
  b2b_max_discount_percent?: number;
  operating_hours?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  contact_address?: string;
  social_instagram?: string;
  social_tiktok?: string;
  free_shipping_threshold?: number;
  pickup_slots?: string[];
  updated_at?: string;
}

const FrontendConfigContext = createContext<FrontendConfig | null>(null);

/**
 * Hook to consume the live frontend config from the nearest provider.
 * Returns the latest config (auto-refreshed via polling).
 */
export function useFrontendConfig(): FrontendConfig | null {
  return useContext(FrontendConfigContext);
}

/**
 * Provider that wraps the app and serves live frontend configuration.
 * - Accepts initialConfig from SSR for instant first paint (no flash).
 * - Polls `/api/backend/config/frontend` every 30s for live updates.
 * - Refreshes on tab focus / visibility change for instant sync.
 */
export function FrontendConfigProvider({
  initialConfig,
  children,
}: {
  initialConfig?: FrontendConfig | null;
  children: ReactNode;
}) {
  const [config, setConfig] = useState<FrontendConfig | null>(initialConfig ?? null);

  useEffect(() => {
    let mounted = true;

    async function fetchConfig() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/backend/config/frontend", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setConfig(data);
      } catch {
        // Graceful ignore — keep last known config
      }
    }

    // Fetch immediately on mount to catch any recent admin updates
    fetchConfig();

    // Refresh on tab focus / visibility change
    const onFocus = () => fetchConfig();
    const onVisibility = () => {
      if (!document.hidden) fetchConfig();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // 30s heartbeat polling
    const interval = setInterval(fetchConfig, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <FrontendConfigContext.Provider value={config}>
      {children}
    </FrontendConfigContext.Provider>
  );
}
