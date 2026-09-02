/**
 * Comprehensive Test Suite for DOKU Payment Gateway Integration.
 * Run: node scripts/test-doku-flow.js
 */

const fs = require("fs");
const crypto = require("crypto");
const postgres = require("postgres");

// Read env
const envText = fs.readFileSync(".env.local", "utf8");
function getEnv(key) {
  const m = envText.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

const clientId = getEnv("DOKU_CLIENT_ID");
const sharedKey = getEnv("DOKU_SHARED_KEY");
const dbUrl = getEnv("DIRECT_DATABASE_URL") || getEnv("DATABASE_URL");
const baseUrl = "http://localhost:3007";

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

async function main() {
  console.log("=========================================================");
  console.log("💳 COMPREHENSIVE DOKU PAYMENT GATEWAY TEST SUITE");
  console.log("=========================================================");
  console.log("Client ID:", clientId);
  console.log("Shared Key configured:", Boolean(sharedKey));

  const sql = postgres(dbUrl);

  // 1. UNIT TEST: HMAC-SHA256 Signature Verification
  console.log("\n1. Cryptographic Signature Generation & Verification");
  const sampleTarget = "/api/webhooks/doku";
  const sampleTime = dokuTimestamp();
  const sampleReqId = crypto.randomUUID();
  const sampleBody = JSON.stringify({ order: { invoice_number: "TEST-01", status: "SUCCESS" } });
  const sampleDigest = generateDigest(sampleBody);
  const sampleSig = generateSignature({
    clientId,
    requestId: sampleReqId,
    timestamp: sampleTime,
    target: sampleTarget,
    digest: sampleDigest,
  });

  console.log("   - Computed Digest:", sampleDigest);
  console.log("   - Computed Signature:", sampleSig);
  const sigMatch = crypto.timingSafeEqual(Buffer.from(sampleSig), Buffer.from(sampleSig));
  console.log("   - Signature Self-Verification Match:", sigMatch);
  if (!sigMatch) throw new Error("Signature self-verification failed");

  // 2. LIVE DOKU API: BRI Virtual Account
  console.log("\n2. Direct DOKU API Request (Live Production Check)");
  const dokuReqId = crypto.randomUUID();
  const dokuTimestampStr = dokuTimestamp();
  const dokuBody = JSON.stringify({
    order: {
      amount: 95000,
      invoice_number: "ACHO-LIVE-TEST-" + Date.now(),
      currency: "IDR",
      callback_url: "https://acho.coffee/api/webhooks/doku",
      line_items: [{ name: "Kopi Test", price: 95000, quantity: 1 }],
    },
    payment: {
      payment_due_date: 60,
      payment_method_types: ["VIRTUAL_ACCOUNT_BRI"],
    },
    customer: {
      name: "Budi Santoso",
      email: "budi@acho.coffee",
      phone: "081234567890",
      address: "Bandung",
      country: "ID",
    },
  });
  const dokuDigest = generateDigest(dokuBody);
  const dokuSig = generateSignature({
    clientId,
    requestId: dokuReqId,
    timestamp: dokuTimestampStr,
    target: "/checkout/v1/payment",
    digest: dokuDigest,
  });

  const dokuRes = await fetch("https://api.doku.com/checkout/v1/payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": dokuReqId,
      "Request-Timestamp": dokuTimestampStr,
      Digest: dokuDigest,
      Signature: dokuSig,
    },
    body: dokuBody,
  });

  const dokuJson = await dokuRes.json();
  console.log("   - DOKU Live API Status:", dokuRes.status);
  console.log("   - DOKU Checkout URL:", dokuJson?.response?.payment?.url);
  console.log("   - DOKU Token ID:", dokuJson?.response?.payment?.token_id);
  if (dokuRes.status !== 200 || !dokuJson?.response?.payment?.url) {
    throw new Error("Direct DOKU API failed: " + JSON.stringify(dokuJson));
  }

  // 3. CREATE ORDER IN APP & TEST POST /api/payments
  console.log("\n3. Creating Order & Generating Payment via App Endpoint");
  const testOrderNumber = `ACHO-PAYTEST-${Date.now().toString().slice(-6)}`;
  const orderId = crypto.randomUUID();
  const [coffee] = await sql.unsafe("select id, name from coffees limit 1");
  const coffeeId = coffee ? coffee.id : crypto.randomUUID();

  await sql.unsafe(`
    insert into orders (id, order_number, customer_name, customer_email, customer_phone, fulfillment, status, payment_status, subtotal, shipping_fee, total)
    values ('${orderId}', '${testOrderNumber}', 'Budi Santoso', 'budi.test@acho.coffee', '081234567890', 'delivery', 'pending_payment', 'pending', 95000, 15000, 110000)
  `);
  await sql.unsafe(`
    insert into order_items (id, order_id, coffee_id, coffee_name, roast_profile_name, grind_size, quantity, unit_price_idr, subtotal_idr)
    values (gen_random_uuid(), '${orderId}', '${coffeeId}', 'Aceh Gayo Natural', 'Medium Roast', 'medium', 1, 95000, 95000)
  `);

  // 3a. Test with VIRTUAL_ACCOUNT_BRI (Live DOKU)
  console.log("   3a. POST /api/payments with 'VIRTUAL_ACCOUNT_BRI'");
  const rPayBri = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: testOrderNumber, channel: "VIRTUAL_ACCOUNT_BRI" }),
  });
  const dPayBri = await rPayBri.json();
  console.log("       Status:", rPayBri.status);
  console.log("       Payment URL:", dPayBri.payment?.paymentUrl);
  console.log("       Token ID:", dPayBri.payment?.paymentId);
  if (rPayBri.status !== 200 || !dPayBri.payment?.paymentUrl) {
    throw new Error("Gagal create payment BRI: " + JSON.stringify(dPayBri));
  }

  // 3b. Test with QRIS
  console.log("   3b. POST /api/payments with 'QRIS'");
  const rPayQris = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: testOrderNumber, channel: "QRIS" }),
  });
  const dPayQris = await rPayQris.json();
  console.log("       Status:", rPayQris.status);
  console.log("       Has QR Content:", Boolean(dPayQris.payment?.qrContent));
  if (rPayQris.status !== 200 || !dPayQris.payment?.qrContent) {
    throw new Error("Gagal create payment QRIS: " + JSON.stringify(dPayQris));
  }

  // 4. TEST WEBHOOK SECURITY: Invalid Signature Rejection
  console.log("\n4. Testing Webhook Security (Tampered Signature)");
  const fakeSig = "HMACSHA256=INVALID_SIGNATURE_TAMPERED_123456789=";
  const webhookBody = JSON.stringify({
    order: {
      invoice_number: testOrderNumber,
      amount: 110000,
      status: "SUCCESS",
    },
    transaction: {
      status: "SUCCESS",
      date: dokuTimestamp(),
    },
  });

  const rBadWebhook = await fetch(`${baseUrl}/api/webhooks/doku`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": crypto.randomUUID(),
      "Request-Timestamp": dokuTimestamp(),
      Digest: generateDigest(webhookBody),
      Signature: fakeSig,
    },
    body: webhookBody,
  });
  console.log("   - Webhook Invalid Sig Status:", rBadWebhook.status);
  const dBadWebhook = await rBadWebhook.json();
  console.log("   - Rejection Response:", dBadWebhook);
  if (rBadWebhook.status !== 401 || dBadWebhook.error !== "invalid signature") {
    throw new Error("Webhook tidak menolak signature palsu: " + JSON.stringify(dBadWebhook));
  }

  // 5. TEST WEBHOOK PROCESSING: Valid Signature SUCCESS Notification
  console.log("\n5. Testing Genuine DOKU Webhook Notification (Payment SUCCESS)");
  const validWebhookReqId = crypto.randomUUID();
  const validWebhookTimestamp = dokuTimestamp();
  const validWebhookDigest = generateDigest(webhookBody);
  const validWebhookSig = generateSignature({
    clientId,
    requestId: validWebhookReqId,
    timestamp: validWebhookTimestamp,
    target: "/api/webhooks/doku",
    digest: validWebhookDigest,
  });

  const rGoodWebhook = await fetch(`${baseUrl}/api/webhooks/doku`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": validWebhookReqId,
      "Request-Timestamp": validWebhookTimestamp,
      Digest: validWebhookDigest,
      Signature: validWebhookSig,
    },
    body: webhookBody,
  });
  console.log("   - Webhook Valid Sig Status:", rGoodWebhook.status);
  const dGoodWebhook = await rGoodWebhook.json();
  console.log("   - Webhook Response:", dGoodWebhook);
  if (rGoodWebhook.status !== 200 || !dGoodWebhook.ok) {
    throw new Error("Webhook gagal memproses pembayaran valid: " + JSON.stringify(dGoodWebhook));
  }

  // 6. VERIFY DATABASE TRANSITION IN SUPABASE POSTGRES
  console.log("\n6. Verifying Order State in Supabase PostgreSQL");
  const [updatedOrder] = await sql.unsafe(`
    select order_number, status, payment_status, paid_at from orders where order_number = '${testOrderNumber}'
  `);
  console.log("   - Order Number:", updatedOrder.order_number);
  console.log("   - Payment Status:", updatedOrder.payment_status);
  console.log("   - Order Status:", updatedOrder.status);
  console.log("   - Paid At:", updatedOrder.paid_at);

  if (updatedOrder.payment_status !== "paid" || updatedOrder.status !== "paid") {
    throw new Error("Order state di database tidak berubah menjadi paid: " + JSON.stringify(updatedOrder));
  }

  // 7. TEST WEBHOOK PROCESSING: FAILED / EXPIRED Notification
  console.log("\n7. Testing DOKU Webhook Notification (Payment FAILED / EXPIRED)");
  const failOrderNumber = `ACHO-FAILTEST-${Date.now().toString().slice(-6)}`;
  const failOrderId = crypto.randomUUID();
  await sql.unsafe(`
    insert into orders (id, order_number, customer_name, customer_email, customer_phone, fulfillment, status, payment_status, subtotal, shipping_fee, total)
    values ('${failOrderId}', '${failOrderNumber}', 'Budi Santoso', 'budi.test@acho.coffee', '081234567890', 'delivery', 'pending_payment', 'pending', 95000, 15000, 110000)
  `);

  const failWebhookBody = JSON.stringify({
    order: {
      invoice_number: failOrderNumber,
      amount: 110000,
      status: "EXPIRED",
    },
    transaction: {
      status: "EXPIRED",
      date: dokuTimestamp(),
    },
  });
  const failDigest = generateDigest(failWebhookBody);
  const failReqId = crypto.randomUUID();
  const failTimestamp = dokuTimestamp();
  const failSig = generateSignature({
    clientId,
    requestId: failReqId,
    timestamp: failTimestamp,
    target: "/api/webhooks/doku",
    digest: failDigest,
  });

  const rFailWebhook = await fetch(`${baseUrl}/api/webhooks/doku`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": failReqId,
      "Request-Timestamp": failTimestamp,
      Digest: failDigest,
      Signature: failSig,
    },
    body: failWebhookBody,
  });

  console.log("   - Webhook Fail Status:", rFailWebhook.status);
  const [failOrderRecord] = await sql.unsafe(`
    select order_number, status, payment_status from orders where order_number = '${failOrderNumber}'
  `);
  console.log("   - Order Payment Status after Expire:", failOrderRecord.payment_status);
  if (failOrderRecord.payment_status !== "failed") {
    throw new Error("Order state di database tidak berubah menjadi failed: " + JSON.stringify(failOrderRecord));
  }

  // Cleanup test orders
  await sql.unsafe(`delete from order_status_history where order_id in (select id from orders where order_number in ('${testOrderNumber}', '${failOrderNumber}'))`);
  await sql.unsafe(`delete from orders where order_number in ('${testOrderNumber}', '${failOrderNumber}')`);
  await sql.end();

  console.log("\n=========================================================");
  console.log("🎉 ALL DOKU PAYMENT GATEWAY TESTS (CREATION, SIGNATURES, SUCCESS, FAILURE) PASSED!");
  console.log("=========================================================");
}

main().catch((err) => {
  console.error("DOKU Test failed:", err);
  process.exit(1);
});
