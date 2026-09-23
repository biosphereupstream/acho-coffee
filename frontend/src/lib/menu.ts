import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { COFFEES } from "@/data/coffees";
import { getBackendState } from "@/lib/backend-serverless";
import type { CatalogCoffee, ProductCategory } from "@/lib/types";

const DEFAULT_ART = {
  bg: "#1e130c",
  accent: "#d4af37",
  bean: "#d97706",
};

/**
 * Infer the ProductCategory based on slug, category, packaging, and item name.
 */
export function inferProductCategory(item: {
  category?: string;
  slug?: string;
  packaging?: string;
  name?: string;
  packageType?: string;
}): ProductCategory {
  const cat = (item.category || "").toLowerCase();
  const slug = (item.slug || "").toLowerCase();
  const pkg = (item.packaging || item.packageType || "").toLowerCase();
  const name = (item.name || "").toLowerCase();

  if (cat === "beans" || cat === "roasted_bean" || slug.includes("bean") || pkg.includes("valve") || pkg.includes("roast") || name.includes("roasted bean") || name.includes("biji kopi")) {
    return "beans";
  }
  if (cat === "espresso_pouch" || slug.startsWith("espresso-") || slug.includes("espresso-pouch") || pkg.includes("espresso") || name.includes("espresso pouch") || name.includes("espresso shot")) {
    return "espresso_pouch";
  }
  if (cat === "simplicity_pouch" || slug.startsWith("pouch-") || slug.includes("simplicity") || pkg.includes("pouch") || name.includes("pouch")) {
    return "simplicity_pouch";
  }
  if (cat === "botol_1000" || slug.startsWith("liter-") || slug.includes("1000") || slug.includes("1-liter") || pkg.includes("1l") || pkg.includes("liter") || pkg.includes("1000") || name.includes("1 liter") || name.includes("1000ml")) {
    return "botol_1000";
  }
  if (cat === "botol_kale" || slug.startsWith("kale-") || slug.includes("kale") || pkg.includes("kale") || name.includes("kale")) {
    return "botol_kale";
  }
  if (cat === "pet_can" || slug.startsWith("can-") || slug.includes("pet-can") || pkg.includes("pet can") || pkg.includes("can 250") || name.includes("pet can")) {
    return "pet_can";
  }

  // Fallbacks for drinks
  if (slug.includes("americano") || slug.includes("latte") || slug.includes("cold-brew") || slug.includes("es-") || slug.includes("kopi-susu") || slug.includes("tea") || slug.includes("matcha")) {
    return "botol_kale";
  }

  return "beans";
}

/**
 * Generate standard package variants for a bean product if not provided.
 */
function buildPackageVariants(price100gOrBase: number) {
  return [
    { size: "100 gram", weightGrams: 100, priceIdr: price100gOrBase },
    { size: "200 gram", weightGrams: 200, priceIdr: Math.round(price100gOrBase * 1.92) },
    { size: "500 gram", weightGrams: 500, priceIdr: Math.round(price100gOrBase * 4.7) },
    { size: "1 kg", weightGrams: 1000, priceIdr: Math.round(price100gOrBase * 9.2) },
  ];
}

/**
 * Normalizes any menu item (from DB or custom serverless state) into a fully typed CatalogCoffee object.
 */
function toCatalogCoffee(raw: any, staticMatch?: CatalogCoffee): CatalogCoffee {
  const category = (raw.category as ProductCategory) || staticMatch?.category || inferProductCategory(raw);
  const isBean = category === "beans";

  const priceIdr = Number(raw.priceIdr ?? raw.price_idr ?? staticMatch?.priceIdr ?? 85000);
  const weightGrams = Number(raw.weightGrams ?? raw.weight_grams ?? staticMatch?.weightGrams ?? (isBean ? 100 : 250));

  let packageVariants = staticMatch?.packageVariants;
  if (!packageVariants && isBean) {
    packageVariants = buildPackageVariants(priceIdr);
  }

  return {
    slug: raw.slug || raw.id,
    name: raw.name || staticMatch?.name || raw.slug,
    type: raw.type === "blend" ? "blend" : (staticMatch?.type || "single_origin"),
    category,
    subCategory: raw.subCategory || staticMatch?.subCategory || (isBean ? "beans" : "creamy"),
    packageType: raw.packageType || raw.packaging || staticMatch?.packageType || (isBean ? "Roasted Bean" : "Ready to Drink"),
    origin: raw.origin || staticMatch?.origin || "Indonesia",
    region: raw.region || staticMatch?.region || "Jawa Barat",
    process: raw.process || staticMatch?.process || "Washed",
    altitude: raw.altitude || raw.altitudeMeters || staticMatch?.altitude || "1.400 - 1.650 mdpl",
    varietal: raw.varietal || staticMatch?.varietal || "Arabica",
    tastingNotes: Array.isArray(raw.tastingNotes)
      ? raw.tastingNotes
      : (staticMatch?.tastingNotes || ["Caramel", "Chocolate", "Clean"]),
    description: raw.description || staticMatch?.description || "Kopi artisan pilihan Biosphere Roast Works.",
    story: raw.story || staticMatch?.story || "Disangrai segar on-demand dengan presisi rasa terbaik.",
    priceIdr,
    weightGrams,
    volumeMl: raw.volumeMl ?? staticMatch?.volumeMl ?? (isBean ? undefined : 250),
    packageVariants,
    imageUrl: raw.imageUrl ?? raw.image_url ?? staticMatch?.imageUrl ?? null,
    badge: raw.badge ?? staticMatch?.badge ?? (raw.is_new ? "Baru" : undefined),
    art: staticMatch?.art || DEFAULT_ART,
  };
}

export interface GetLiveMenuOptions {
  includeInactive?: boolean;
}

// In-Memory SWR Cache for sub-millisecond storefront response times
const CACHE_TTL_MS = 15_000; // 15s cache TTL

/**
 * Instantly purges the menu cache when admin updates or deletes menu items.
 * Clears the actual state.cachedCatalogMenu used by getLiveMenu().
 */
export function invalidateLiveMenuCache() {
  const state = getBackendState();
  state.cachedCatalogMenu = null;
  state.cachedCatalogMenuTime = 0;
}

/**
 * Retrieves the full live menu catalog, integrating:
 * 1. Fast in-memory cache (< 0.1ms response time)
 * 2. Supabase PostgreSQL `coffees` table (with 2s timeout guard)
 * 3. In-memory serverless backend state (customMenuItems, menuOverrides, deletedMenuSlugs)
 * 4. Static default catalog (COFFEES) as dependable baseline
 */
export async function getLiveMenu(options: GetLiveMenuOptions = {}): Promise<CatalogCoffee[]> {
  const state = getBackendState();
  const now = Date.now();

  // Fast path: if state cache is valid, return immediately (< 0.1ms)
  if (!options.includeInactive && state.cachedCatalogMenu && now - (state.cachedCatalogMenuTime || 0) < CACHE_TTL_MS) {
    return state.cachedCatalogMenu;
  }

  const staticMap = new Map<string, CatalogCoffee>();
  for (const c of COFFEES) {
    staticMap.set(c.slug, c);
  }

  // Combined dictionary of active items keyed by slug
  const resultMap = new Map<string, CatalogCoffee>();

  // 1. Load from Supabase PostgreSQL if database connection is alive (with 2s timeout guard)
  let dbRows: any[] = [];
  if (db) {
    try {
      const timeoutPromise = new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase query timeout")), 2000)
      );
      dbRows = await Promise.race([db.select().from(schema.coffees), timeoutPromise]);
    } catch (err) {
      console.warn("[Menu Provider] Supabase query failed/timeout, falling back to serverless state:", err);
      dbRows = [];
    }
  }

  if (dbRows.length > 0) {
    for (const row of dbRows) {
      if (state.deletedMenuSlugs.has(row.slug)) continue;
      if (!options.includeInactive && row.isActive === false) continue;

      const staticMatch = staticMap.get(row.slug);
      const catalogItem = toCatalogCoffee(
        {
          ...row,
          category: row.category,
          packaging: row.packaging,
          price_idr: row.priceIdr,
          image_url: row.imageUrl,
          is_active: row.isActive,
        },
        staticMatch
      );
      resultMap.set(row.slug, catalogItem);
    }

    // Merge any static items that are missing from DB (resilience fallback)
    for (const [slug, staticCoffee] of staticMap.entries()) {
      if (!resultMap.has(slug) && !state.deletedMenuSlugs.has(slug)) {
        resultMap.set(slug, { ...staticCoffee });
      }
    }
  } else {
    // Fall back to static COFFEES list
    for (const c of COFFEES) {
      if (state.deletedMenuSlugs.has(c.slug)) continue;
      resultMap.set(c.slug, { ...c });
    }
  }

  // 2. Overlay serverless state custom menu items
  for (const [id, custom] of state.customMenuItems.entries()) {
    if (state.deletedMenuSlugs.has(id)) continue;
    const isActive = custom.is_active ?? true;
    if (!options.includeInactive && !isActive) {
      resultMap.delete(id);
      continue;
    }

    const staticMatch = staticMap.get(id);
    resultMap.set(id, toCatalogCoffee(custom, staticMatch));
  }

  // 3. Overlay serverless state menu overrides (price, image, active, name)
  for (const [slug, override] of state.menuOverrides.entries()) {
    if (state.deletedMenuSlugs.has(slug)) {
      resultMap.delete(slug);
      continue;
    }

    const existing = resultMap.get(slug);
    if (!existing) continue;

    if (!options.includeInactive && override.is_active === false) {
      resultMap.delete(slug);
      continue;
    }

    const updated: CatalogCoffee = {
      ...existing,
      name: override.name || existing.name,
      description: override.description || existing.description,
      process: override.process || existing.process,
      origin: override.origin || existing.origin,
      region: override.region || existing.region,
      imageUrl: override.image_url !== undefined ? override.image_url : existing.imageUrl,
      priceIdr: override.price_idr ? Number(override.price_idr) : existing.priceIdr,
      badge: override.badge !== undefined ? override.badge : existing.badge,
    };

    // If price changed and it's beans, scale package variants
    if (override.price_idr && existing.category === "beans") {
      updated.packageVariants = buildPackageVariants(Number(override.price_idr));
    }

    resultMap.set(slug, updated);
  }

  // Remove any deleted slugs explicitly
  for (const deletedSlug of state.deletedMenuSlugs) {
    resultMap.delete(deletedSlug);
  }

  const result = Array.from(resultMap.values());
  if (!options.includeInactive) {
    state.cachedCatalogMenu = result;
    state.cachedCatalogMenuTime = Date.now();
  }
  return result;
}

/**
 * Retrieves a single coffee by its slug from the live menu.
 */
export async function getLiveCoffee(slug: string): Promise<CatalogCoffee | null> {
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  const all = await getLiveMenu({ includeInactive: true });

  const aliasMap: Record<string, string> = {
    "sukarasa-ciwidey-natural": "ciwidey-bio-natural",
    "sukarasa-natural": "ciwidey-bio-natural",
    "sukarasa-ciwidey-honey": "ciwidey-bio-honey",
    "sukarasa-honey": "ciwidey-bio-honey",
    "sukarasa-ciwidey-semi-washed": "ciwidey-semi-washed",
    "sukarasa-semi-washed": "ciwidey-semi-washed",
  };
  const targetSlug = aliasMap[cleanSlug] || cleanSlug;

  return (
    all.find(
      (c) =>
        c.slug.toLowerCase() === targetSlug ||
        c.slug.toLowerCase().replace(/_/g, "-") === targetSlug ||
        c.slug.toLowerCase() === cleanSlug ||
        c.name.toLowerCase().replace(/\s+/g, "-") === cleanSlug
    ) || null
  );
}

/**
 * Retrieves the current live frontend configuration.
 * Queries Supabase site_config first so SSR gets persisted configuration immediately.
 */
export async function getLiveFrontendConfig() {
  const state = getBackendState();
  if (db) {
    try {
      const rows = await Promise.race([
        db.select().from(schema.siteConfig).where(eq(schema.siteConfig.key, "frontend_config")),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error("Timeout loading site_config")), 3500)),
      ]);
      if (rows && rows.length > 0 && rows[0].value) {
        state.frontendConfig = { ...state.frontendConfig, ...(rows[0].value as any) };
      }
    } catch (err) {
      console.warn("[Menu] Failed to load site_config for SSR:", err);
    }
  }
  return state.frontendConfig;
}
