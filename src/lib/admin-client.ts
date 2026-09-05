/**
 * Client-side helper to generate admin headers for fetch requests.
 * Safe for use in "use client" components (zero server-only dependencies).
 */
export function getAdminHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return { "x-admin": "true" };
  }

  const token =
    localStorage.getItem("acho_admin_token") ||
    sessionStorage.getItem("acho_admin_token") ||
    "";

  return {
    "x-admin": "true",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
          "x-admin-token": token,
        }
      : {}),
  };
}
