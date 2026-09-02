import { NextResponse } from "next/server";
import { getR2Object } from "@/lib/r2";

/**
 * Media proxy: streaming file R2 lewat server sendiri.
 * Dipakai otomatis saat R2_PUBLIC_URL berakhiran r2.dev (diblokir ISP Indonesia).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await ctx.params;
  const key = segments.join("/");

  // cegah path traversal
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "key tidak valid" }, { status: 400 });
  }

  const obj = await getR2Object(key);
  if (!obj) {
    return NextResponse.json({ error: "file tidak ditemukan" }, { status: 404 });
  }

  return new NextResponse(obj.body as unknown as BodyInit, {
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
