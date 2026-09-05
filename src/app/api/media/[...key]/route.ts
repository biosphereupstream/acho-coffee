import { NextResponse } from "next/server";
import { getR2Object, deleteFromR2, purgeCloudflareCache } from "@/lib/r2";
import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";

async function checkAdminAuth(req: Request): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const isAdmin = user?.email ? env.adminEmails().includes(user.email.toLowerCase()) : false;
  const isDevBypass =
    process.env.NODE_ENV === "development" &&
    (req.headers.get("x-admin") === "true" || !env.supabaseConfigured());

  return isAdmin || isDevBypass || !env.supabaseConfigured();
}

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

/**
 * Hapus file dari Cloudflare R2 via proxy media route.
 */
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { key: segments } = await ctx.params;
  const key = segments.join("/");

  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "key tidak valid" }, { status: 400 });
  }

  const ok = await deleteFromR2(key);
  if (!ok) {
    return NextResponse.json({ error: "Gagal menghapus file dari Cloudflare R2" }, { status: 500 });
  }

  await purgeCloudflareCache([`/api/media/${key}`]);

  return NextResponse.json({
    success: true,
    message: `File '${key}' berhasil dihapus dari Cloudflare R2`,
  });
}

