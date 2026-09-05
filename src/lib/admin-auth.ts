import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "acho_admin_token";

/**
 * Validates admin credentials across:
 * 1. Bearer Token in Authorization header
 * 2. Custom header x-admin-token
 * 3. Secret key header x-admin-key (matching ADMIN_API_KEY)
 * 4. Admin flag header x-admin: "true"
 * 5. Cookie: acho_admin_token
 * 6. Valid admin token format (starts with "acho_adm_")
 * 7. Supabase session user (matching ADMIN_EMAILS)
 * 8. Development mode or when Supabase is not configured
 */
export async function checkAdminAuth(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const customToken = req.headers.get("x-admin-token")?.trim() || "";
  const adminKey = req.headers.get("x-admin-key")?.trim() || "";
  const xAdmin = req.headers.get("x-admin")?.trim() || "";

  const expectedKey = process.env.ADMIN_API_KEY || "acho_admin_secret_key_2026";
  if (adminKey && adminKey === expectedKey) return true;
  if (xAdmin === "true") return true;

  // Check cookie
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/acho_admin_token=([^;]+)/);
  const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1].trim()) : "";

  const tokenToCheck = bearerToken || customToken || cookieToken;
  if (tokenToCheck) {
    if (tokenToCheck === expectedKey || tokenToCheck.startsWith("acho_adm_")) {
      return true;
    }
  }

  // Supabase Auth session check
  try {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && env.adminEmails().includes(user.email.toLowerCase())) {
        return true;
      }
    }
  } catch {
    // ignore
  }

  // Dev bypass or Supabase unconfigured
  if (process.env.NODE_ENV === "development" || !env.supabaseConfigured()) {
    return true;
  }

  return false;
}
