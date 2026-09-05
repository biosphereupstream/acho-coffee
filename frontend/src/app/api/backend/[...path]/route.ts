import { NextRequest, NextResponse } from "next/server";
import { handleServerlessBackend } from "@/lib/backend-serverless";

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || "http://127.0.0.1:8080";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return dispatchRequest(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return dispatchRequest(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return dispatchRequest(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return dispatchRequest(req, await params);
}

async function dispatchRequest(req: NextRequest, { path }: { path: string[] }) {
  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const isLocalBackend =
    !process.env.GO_BACKEND_URL ||
    GO_BACKEND_URL.includes("127.0.0.1") ||
    GO_BACKEND_URL.includes("localhost");

  // On Vercel / serverless cloud without a remote Go daemon, route directly to the embedded serverless engine
  if (isVercel && isLocalBackend) {
    return handleServerlessBackend(req, path);
  }

  let body: string | undefined = undefined;

  try {
    const subPath = path.join("/");
    const searchParams = req.nextUrl.search;
    const targetUrl = `${GO_BACKEND_URL}/api/${subPath}${searchParams}`;

    const headers = new Headers();
    req.headers.forEach((val, key) => {
      if (key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length") {
        headers.set(key, val);
      }
    });
    headers.set("X-Admin-Key", process.env.ADMIN_API_KEY || "acho_admin_secret_key_2026");

    body = ["POST", "PUT", "PATCH"].includes(req.method)
      ? await req.text()
      : undefined;

    // 2.5 second timeout so if local Go daemon is not running, it falls back swiftly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const resp = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await resp.text();
    return new NextResponse(data, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err: unknown) {
    // If the Go backend is unreachable, automatically fall back to the built-in serverless engine
    console.warn(`[Proxy Fallback] Go backend at ${GO_BACKEND_URL} unreachable, falling back to serverless engine:`, err);
    return handleServerlessBackend(req, path, body);
  }
}
