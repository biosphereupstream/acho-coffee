const fs = require("fs");
const crypto = require("crypto");

// Read env
const envText = fs.readFileSync(".env.local", "utf8");
function getEnv(key) {
  const m = envText.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

const clientId = getEnv("DOKU_CLIENT_ID");
const sharedKey = getEnv("DOKU_SHARED_KEY");
const dokuEnv = getEnv("DOKU_ENV") || "sandbox";
const baseUrl = dokuEnv === "production" ? "https://api.doku.com" : "https://api-sandbox.doku.com";

console.log("=========================================");
console.log("DOKU CONFIGURATION TEST");
console.log("=========================================");
console.log("Env:", dokuEnv);
console.log("Base URL:", baseUrl);
console.log("Client ID:", clientId);
console.log("Shared Key Length:", sharedKey.length);

function dokuTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function generateDigest(rawBody) {
  return crypto.createHash("sha256").update(rawBody, "utf8").digest("base64");
}

function generateSignature({ clientId, requestId, timestamp, target, digest }) {
  const component =
    "Client-Id:" + clientId + "\n" +
    "Request-Id:" + requestId + "\n" +
    "Request-Timestamp:" + timestamp + "\n" +
    "Request-Target:" + target + "\n" +
    "Digest:" + digest;
  const hmac = crypto.createHmac("sha256", sharedKey).update(component, "utf8").digest("base64");
  return "HMACSHA256=" + hmac;
}

async function testChannel(channelName) {
  const target = "/checkout/v1/payment";
  const timestamp = dokuTimestamp();
  const requestId = crypto.randomUUID();
  const invoiceNumber = "TEST-" + Date.now();

  const paymentObj = channelName ? { payment_due_date: 60, payment_method_types: [channelName] } : { payment_due_date: 60 };

  const bodyObj = {
    order: {
      amount: 95000,
      invoice_number: invoiceNumber,
      currency: "IDR",
      callback_url: "https://acho.coffee/api/webhooks/doku",
      line_items: [
        {
          name: "Aceh Gayo Natural 250g",
          price: 95000,
          quantity: 1,
        },
      ],
    },
    payment: paymentObj,
    customer: {
      name: "Budi Santoso",
      email: "budi.test@acho.coffee",
      phone: "081234567890",
      address: "Jl. Dago No. 128",
      country: "ID",
    },
  };

  const rawBody = JSON.stringify(bodyObj);
  const digest = generateDigest(rawBody);
  const signature = generateSignature({
    clientId,
    requestId,
    timestamp,
    target,
    digest,
  });

  try {
    const res = await fetch(baseUrl + target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        Digest: digest,
        Signature: signature,
      },
      body: rawBody,
    });

    const status = res.status;
    const json = await res.json().catch((e) => ({ rawError: e.message }));
    console.log(`Channel [${channelName || "ALL"}]: Status ${status}`);
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.log(`Channel [${channelName}]: Error ->`, err.message);
  }
}

async function run() {
  console.log("\n--- TESTING VIRTUAL_ACCOUNT_DOKU ---");
  await testChannel("VIRTUAL_ACCOUNT_DOKU");
  console.log("\n--- TESTING HOSTED CHECKOUT (ALL) ---");
  await testChannel("");
}

run();
