import { NextRequest, NextResponse } from "next/server";

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || "http://127.0.0.1:8080";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

async function proxyRequest(req: NextRequest, { path }: { path: string[] }) {
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

    const body = ["POST", "PUT", "PATCH"].includes(req.method)
      ? await req.text()
      : undefined;

    const resp = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await resp.text();
    return new NextResponse(data, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Gagal terhubung ke Go backend di " + GO_BACKEND_URL,
        detail: message,
        tip: "Pastikan Go backend berjalan: cd backend && go run ./cmd/server",
      },
      { status: 502 }
    );
  }
}
