import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/middleware";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Tangkap redirect OAuth yang salah mendarat di root (/) alih-alih di /auth/callback
  if (pathname === "/") {
    const code = searchParams.get("code");
    if (code) {
      const callbackUrl = new URL("/auth/callback", request.url);
      searchParams.forEach((val, key) => callbackUrl.searchParams.set(key, val));
      return NextResponse.redirect(callbackUrl);
    }
    const errorParam = searchParams.get("error") || searchParams.get("error_code");
    if (errorParam) {
      const masukUrl = new URL("/masuk", request.url);
      const errorDesc = searchParams.get("error_description") || errorParam;
      masukUrl.searchParams.set("error", errorDesc);
      return NextResponse.redirect(masukUrl);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
