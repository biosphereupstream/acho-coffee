import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

let client: S3Client | null = null;

function getClient(): S3Client | null {
  if (!env.r2.configured()) return null;
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: "https://" + process.env.R2_ACCOUNT_ID + ".r2.cloudflarestorage.com",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return client;
}

export function r2PublicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  if (!base) return "";
  // *.r2.dev diblokir ISP Indonesia (Trust Positif) — arahkan lewat proxy server kita
  if (base.includes("r2.dev")) {
    return "/api/media/" + key;
  }
  return base + "/" + key;
}

export interface R2Object {
  body: Uint8Array;
  contentType: string;
}

/** Ambil objek dari R2 (dipakai media proxy). */
export async function getR2Object(key: string): Promise<R2Object | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const res = await c.send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })
    );
    const body = await res.Body?.transformToByteArray();
    if (!body) return null;
    return { body, contentType: res.ContentType ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/** Upload file ke Cloudflare R2. Return URL publik, atau null bila R2 belum dikonfigurasi. */
export async function uploadToR2(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  await c.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body as Buffer,
      ContentType: contentType,
    })
  );
  return r2PublicUrl(key);
}

export function extractR2Key(urlOrKey: string): string | null {
  if (!urlOrKey) return null;
  const clean = urlOrKey.trim().split("?")[0];

  // If already a key like "products/abc.jpg"
  if (!clean.includes("://") && !clean.startsWith("/")) {
    return clean;
  }

  // Matches /api/media/key...
  if (clean.includes("/api/media/")) {
    const parts = clean.split("/api/media/");
    return parts[1] || null;
  }

  // Matches any domain containing products/...
  const match = clean.match(/(products\/[^/?#]+)/i);
  if (match) {
    return match[1];
  }

  // Fallback: last segment if in bucket URL
  const bucket = process.env.R2_BUCKET || "acho-coffee";
  if (clean.includes(bucket + "/")) {
    const parts = clean.split(bucket + "/");
    return parts[1] || null;
  }

  return null;
}

export async function deleteFromR2(keyOrUrl: string): Promise<boolean> {
  const key = extractR2Key(keyOrUrl);
  if (!key) return false;

  const c = getClient();
  if (!c) return false;

  try {
    await c.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    console.error(`[Cloudflare R2] Failed to delete object key '${key}':`, err);
    return false;
  }
}

/**
 * Purge Cloudflare Edge CDN cache for given file URLs or entire cache if empty.
 */
export async function purgeCloudflareCache(files?: string[]): Promise<boolean> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!zoneId || !apiToken) return false;

  try {
    const body = files && files.length > 0
      ? { files }
      : { purge_everything: true };

    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch (err) {
    console.warn("[Cloudflare] Purge cache failed:", err);
    return false;
  }
}

