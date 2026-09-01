// Uji Cloudflare R2: list bucket -> buat bucket -> upload objek uji
const fs = require("fs");
const {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  PutObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

const env = fs.readFileSync(".env.local", "utf8");
function getEnv(key, fallback) {
  const m = env.match(new RegExp("^" + key + "=(.*)$", "m"));
  return m ? m[1].trim() || fallback : fallback;
}
function getEnvStrict(key) {
  const m = env.match(new RegExp("^" + key + "=(.*)$", "m"));
  return m ? m[1].trim() : "";
}

(async () => {
  const accountId = getEnvStrict("R2_ACCOUNT_ID");
  if (!accountId || !getEnvStrict("R2_ACCESS_KEY_ID")) {
    console.log("ERROR: R2_ACCOUNT_ID / R2_ACCESS_KEY_ID kosong di .env.local");
    process.exit(1);
  }
  const bucket = getEnv("R2_BUCKET", "acho-coffee");
  const client = new S3Client({
    region: "auto",
    endpoint: "https://" + accountId + ".r2.cloudflarestorage.com",
    credentials: {
      accessKeyId: getEnvStrict("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnvStrict("R2_SECRET_ACCESS_KEY"),
    },
  });

  try {
    const list = await client.send(new ListBucketsCommand({}));
    console.log("BUCKET SAAT INI: " + (list.Buckets || []).map((b) => b.Name).join(", ") + " atau (kosong)");

    if (!(list.Buckets || []).some((b) => b.Name === bucket)) {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log("BUCKET '" + bucket + "' DIBUAT ✓");
    } else {
      console.log("BUCKET '" + bucket + "' sudah ada ✓");
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: "products/test-r2.txt",
        Body: "ACHO Coffee R2 test",
        ContentType: "text/plain",
      })
    );
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: "products/test-r2.txt" }));
    console.log("UPLOAD OK ✓ key=products/test-r2.txt size=" + head.ContentLength + " type=" + head.ContentType);
  } catch (e) {
    console.log("R2 GAGAL: " + e.message);
  }
  process.exit(0);
})();
