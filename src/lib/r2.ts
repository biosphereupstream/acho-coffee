import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
  return base ? base + "/" + key : "";
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

export async function deleteFromR2(key: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  await c.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
}
