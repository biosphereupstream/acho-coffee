import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import type { DokuCreateParams, DokuPaymentResult } from "@/lib/payments/doku-shared";

export type { DokuChannel, DokuCreateParams, DokuPaymentResult, DokuNotifyPayload } from "@/lib/payments/doku-shared";
export { DOKU_CHANNELS } from "@/lib/payments/doku-shared";

/** Path DOKU yang dituju (dipakai pada komponen Request-Target). */
const CHECKOUT_PATH = "/checkout/v1/payment";

/**
 * DOKU Jokul strictly restricts characters in string fields to:
 * a-z A-Z 0-9 . - / + , = _ : ' @ % ( ) and spaces.
 * Any character outside this regex causes HTTP 400 "Invalid character".
 */
export function sanitizeDokuString(input: string | undefined | null, maxLength = 64): string {
  if (!input || input === "null" || input === "undefined") return "Pesanan Kopi";
  let sanitized = String(input)
    // Replace ampersand with "dan"
    .replace(/&/g, "dan")
    // Replace hash with "No."
    .replace(/#/g, "No. ")
    // Replace double quotes and fancy quotes with single quote
    .replace(/["“”„]/g, "'")
    .replace(/[’‘`]/g, "'")
    // Replace bullet points, asterisks, stars with hyphen
    .replace(/[•✦★*~]/g, "-")
    // Replace exclamation and question marks with dot
    .replace(/[!?]/g, ".")
    // Replace brackets with parentheses
    .replace(/[\[{]/g, "(")
    .replace(/[\]}]/g, ")")
    // Replace tabs, newlines with space
    .replace(/[\r\n\t]/g, " ")
    // Remove any character NOT in the allowed DOKU character set
    .replace(/[^a-zA-Z0-9.\-\/+,=_:'@%() ]/g, "")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) sanitized = "Pesanan Kopi";
  return sanitized.slice(0, maxLength).trim();
}

/**
 * Sanitize phone number for DOKU (numbers only, min 8 max 16 digits).
 */
export function sanitizeDokuPhone(phone: string | undefined | null): string {
  if (!phone) return "08123456789";
  const cleaned = String(phone).replace(/[^0-9]/g, "");
  if (cleaned.length < 8) return "08123456789";
  return cleaned.slice(0, 16);
}

/** Format timestamp yang diharapkan Doku: yyyy-MM-ddTHH:mm:ssZ (UTC). */
function dokuTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Digest = base64(SHA-256(rawBody)). */
export function generateDigest(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("base64");
}

/**
 * Signature Doku (skema resmi): komponen = Client-Id, Request-Id,
 * Request-Timestamp, Request-Target, Digest — tiap baris dipisah "\n",
 * lalu Signature = "HMACSHA256=" + base64(HMAC-SHA256(secretKey, komponen)).
 */
export function generateSignature(params: {
  clientId: string;
  requestId: string;
  timestamp: string;
  target: string;
  digest: string;
}): string {
  const component =
    "Client-Id:" + params.clientId + "\n" +
    "Request-Id:" + params.requestId + "\n" +
    "Request-Timestamp:" + params.timestamp + "\n" +
    "Request-Target:" + params.target + "\n" +
    "Digest:" + params.digest;
  const hmac = createHmac("sha256", env.doku.sharedKey()).update(component, "utf8").digest("base64");
  return "HMACSHA256=" + hmac;
}

/** Buat pembayaran via Doku Jokul Checkout API. Fallback demo bila env belum diset atau kanal belum aktif. */
export async function createDokuPayment(params: DokuCreateParams): Promise<DokuPaymentResult> {
  const isQris = params.channel === "QRIS";
  const digits = params.invoiceNumber.replace(/\D/g, "").slice(-10);
  const fakeVa = "8801" + digits + Math.floor(Math.random() * 90 + 10);
  const fakeQr = `00020101021226680016ID.CO.DOKU.WWW01189360091800000000000215${params.invoiceNumber}520458125303360540${params.amount}5802ID5921BIOSPHERE ROAST WORKS6007BANDUNG62070703A016304`;

  if (!env.doku.configured()) {
    // Demo mode: generate VA / QRIS palsu agar alur bisa dicoba end-to-end
    return {
      demo: true,
      paymentId: "DEMO-" + randomUUID(),
      paymentUrl: null,
      virtualAccount: isQris ? undefined : fakeVa,
      qrContent: isQris ? fakeQr : undefined,
      channel: params.channel,
      howToPay: isQris
        ? "Scan QRIS di bawah menggunakan aplikasi BCA Mobile, GoPay, OVO, Dana, ShopeePay, atau m-banking lainnya."
        : "Demo: klik tombol \"Simulasi Pembayaran Berhasil\" di bawah untuk melanjutkan pesanan ke antrean roasting.",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
  }

  const timestamp = dokuTimestamp();
  const requestId = randomUUID();

  // DOKU invoice number only allows alphanumeric, dot, hyphen, underscore (max 64 chars)
  const sanitizedInvoice = params.invoiceNumber.replace(/[^a-zA-Z0-9.\-_]/g, "").slice(0, 64);
  const cleanSiteUrl = env.siteUrl().replace(/\/+$/, "");

  // DOKU requires that the sum of line_items[].price * line_items[].quantity EXACTLY equals order.amount
  const lineItemsSum = params.lineItems.reduce((acc, li) => acc + li.price * li.quantity, 0);
  const sourceLineItems =
    lineItemsSum === params.amount && params.lineItems.length > 0
      ? params.lineItems
      : [
          {
            name: `Pesanan Kopi ${sanitizedInvoice}`,
            quantity: 1,
            price: params.amount,
          },
        ];

  const sanitizedLineItems = sourceLineItems.map((li) => ({
    name: sanitizeDokuString(li.name, 64),
    price: Math.max(1, Math.round(li.price)),
    quantity: Math.max(1, Math.round(li.quantity)),
  }));

  // Jika DOKU_HOSTED, jangan batasi payment_method_types agar DOKU menampilkan semua metode yang aktif
  const paymentObj: Record<string, unknown> = {
    payment_due_date: 60,
  };
  if (params.channel !== "DOKU_HOSTED") {
    paymentObj.payment_method_types = [params.channel];
  }

  const body = JSON.stringify({
    order: {
      amount: Math.max(1, Math.round(params.amount)),
      invoice_number: sanitizedInvoice,
      currency: "IDR",
      callback_url: `${cleanSiteUrl}/api/webhooks/doku`,
      line_items: sanitizedLineItems,
    },
    payment: paymentObj,
    customer: {
      name: sanitizeDokuString(params.customerName || "Pelanggan", 64),
      email: (params.customerEmail || "customer@example.com").trim().toLowerCase().slice(0, 64),
      phone: sanitizeDokuPhone(params.customerPhone),
      address: "Indonesia",
      country: "ID",
    },
  });

  const digest = generateDigest(body);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Client-Id": env.doku.clientId(),
    "Request-Id": requestId,
    "Request-Timestamp": timestamp,
    Digest: digest,
    Signature: generateSignature({
      clientId: env.doku.clientId(),
      requestId,
      timestamp,
      target: CHECKOUT_PATH,
      digest,
    }),
  };

  let res: Response;
  try {
    res = await fetch(env.doku.baseUrl() + CHECKOUT_PATH, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
  } catch (e) {
    if (env.doku.demoFallback() || env.doku.env() === "sandbox") {
      // Jaringan lokal / sandbox tidak bisa mencapai Doku — fallback aman ke simulasi
      return {
        demo: true,
        paymentId: "DEMO-" + randomUUID(),
        paymentUrl: null,
        virtualAccount: isQris ? undefined : fakeVa,
        qrContent: isQris ? fakeQr : undefined,
        channel: params.channel,
        howToPay: isQris
          ? "Scan QRIS di bawah menggunakan aplikasi BCA Mobile, GoPay, OVO, Dana, ShopeePay, atau m-banking lainnya."
          : "Fallback demo: Doku tidak terjangkau dari jaringan ini (pembayaran sungguhan aktif di lingkungan produksi/Vercel).",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      };
    }
    throw new Error("Doku tidak terjangkau: " + (e instanceof Error ? e.message : "network error"));
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = "Doku error " + res.status + ": " + JSON.stringify(json).slice(0, 400);
    console.error("[DOKU API Error]", res.status, json, "Sent Body:", body);
    if (env.doku.demoFallback() || env.doku.env() === "sandbox") {
      // Sandbox fallback jika kanal Doku di akun sandbox belum diaktifkan oleh admin Doku
      return {
        demo: true,
        paymentId: "SANDBOX-" + randomUUID(),
        paymentUrl: null,
        virtualAccount: isQris ? undefined : fakeVa,
        qrContent: isQris ? fakeQr : undefined,
        channel: params.channel,
        howToPay: isQris
          ? "Scan QRIS di bawah menggunakan aplikasi BCA Mobile, GoPay, OVO, Dana, ShopeePay, atau m-banking lainnya."
          : "Akun Sandbox Doku: Kanal disimulasikan untuk pengujian (" + detail + ")",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      };
    }
    throw new Error(detail);
  }

  const paymentUrl: string | null = json?.response?.payment?.url ?? null;
  const vaInfo = json?.response?.virtual_account_info ?? null;
  const qrInfo = json?.response?.qr_code_info ?? null;

  function parseDokuDate(val?: string): string | undefined {
    if (!val) return undefined;
    if (val.includes("-") || val.includes("T")) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    }
    if (val.length === 14) {
      const y = val.slice(0, 4);
      const m = val.slice(4, 6);
      const d = val.slice(6, 8);
      const h = val.slice(8, 10);
      const min = val.slice(10, 12);
      const s = val.slice(12, 14);
      const parsed = new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`);
      return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  return {
    demo: false,
    paymentId: json?.response?.payment?.token_id ?? requestId,
    paymentUrl,
    virtualAccount: vaInfo?.virtual_account_number ?? undefined,
    qrContent: qrInfo?.qr_content ?? undefined,
    howToPay: vaInfo?.how_to_pay_page ?? qrInfo?.how_to_pay_page ?? undefined,
    channel: params.channel,
    expiresAt: parseDokuDate(
      json?.response?.payment?.expired_datetime || json?.response?.payment?.expired_date
    ),
  };
}

/** Verifikasi signature webhook notifikasi Doku (target = path merchant). */
export function verifyDokuNotification(params: {
  clientId: string;
  requestId: string;
  timestamp: string;
  digest: string;
  target: string;
  rawBody: string;
  signature: string;
}): boolean {
  const digest = params.digest || generateDigest(params.rawBody);
  const expected = generateSignature({
    clientId: params.clientId,
    requestId: params.requestId,
    timestamp: params.timestamp,
    target: params.target,
    digest,
  });
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
