import { NextResponse } from "next/server";
import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";
import { userAddressInputSchema } from "@/lib/validation";
import { createUserAddress, getUserAddresses } from "@/lib/store/addresses";

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

export async function GET(req: Request) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await getUserAddresses(userId);
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parse = userAddressInputSchema.safeParse(body);
  if (!parse.success) {
    const msg = parse.error.issues[0]?.message ?? "Validasi gagal";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const record = await createUserAddress(userId, parse.data);
  return NextResponse.json({ address: record }, { status: 201 });
}
