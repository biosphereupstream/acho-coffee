import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadToR2, deleteFromR2, purgeCloudflareCache } from "@/lib/r2";
import { checkAdminAuth } from "@/lib/admin-auth";
import { env } from "@/lib/env";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

/** Upload gambar produk (admin) ke Cloudflare R2. */
export async function POST(req: Request) {
  if (!env.r2.configured()) {
    return NextResponse.json({ error: "R2 belum dikonfigurasi" }, { status: 503 });
  }

  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file wajib diisi" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Maksimal 5MB" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format harus JPEG/PNG/WebP/SVG" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const key = "products/" + randomUUID() + "." + ext;

  const url = await uploadToR2(key, bytes, file.type);
  if (!url) {
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
  return NextResponse.json({ url, key });
}

/** Hapus gambar produk/media (admin) dari Cloudflare R2. */
export async function DELETE(req: Request) {
  if (!env.r2.configured()) {
    return NextResponse.json({ error: "R2 belum dikonfigurasi" }, { status: 503 });
  }

  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    let keyOrUrl = "";
    try {
      const body = await req.json();
      keyOrUrl = body.key || body.url || "";
    } catch {
      const url = new URL(req.url);
      keyOrUrl = url.searchParams.get("key") || url.searchParams.get("url") || "";
    }

    if (!keyOrUrl) {
      return NextResponse.json({ error: "key atau url wajib diisi" }, { status: 400 });
    }

    const ok = await deleteFromR2(keyOrUrl);
    if (!ok) {
      return NextResponse.json({ error: "Gagal menghapus file dari Cloudflare R2 atau key tidak valid" }, { status: 500 });
    }

    // Purge Cloudflare CDN
    await purgeCloudflareCache();

    return NextResponse.json({
      success: true,
      message: "Media berhasil dihapus dari Cloudflare R2",
      target: keyOrUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menghapus file" },
      { status: 500 }
    );
  }
}

