import { NextResponse } from "next/server";
import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";
import { userAddressInputSchema } from "@/lib/validation";
import { deleteUserAddress, updateUserAddress } from "@/lib/store/addresses";

async function getAuthUserId(req?: Request): Promise<string | null> {
  if (process.env.NODE_ENV === "development" && req?.headers.get("x-user-id")) {
    return req.headers.get("x-user-id");
  }
  if (!env.supabaseConfigured()) {
    return "demo-user";
  }
  const supabase = await getSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const partialSchema = userAddressInputSchema.partial();
  const parse = partialSchema.safeParse(body);
  if (!parse.success) {
    const msg = parse.error.issues[0]?.message ?? "Validasi gagal";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const updated = await updateUserAddress(userId, id, parse.data);
  if (!updated) {
    return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ address: updated });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const ok = await deleteUserAddress(userId, id);
  if (!ok) {
    return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
