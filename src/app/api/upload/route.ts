import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadToR2 } from "@/lib/r2";
import { getSupabaseServer } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

/** Upload gambar produk (admin) ke Cloudflare R2. */
export async function POST(req: Request) {
  if (!env.r2.configured()) {
    return NextResponse.json({ error: "R2 belum dikonfigurasi" }, { status: 503 });
  }

  const supabase = await getSupabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const isAdmin = user?.email ? env.adminEmails().includes(user.email.toLowerCase()) : false;
  if (!isAdmin && env.supabaseConfigured()) {
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
