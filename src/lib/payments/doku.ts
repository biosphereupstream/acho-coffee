import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import type { DokuCreateParams, DokuPaymentResult } from "@/lib/payments/doku-shared";

export type { DokuChannel, DokuCreateParams, DokuPaymentResult, DokuNotifyPayload } from "@/lib/payments/doku-shared";
export { DOKU_CHANNELS } from "@/lib/payments/doku-shared";

/** Path DOKU yang dituju (dipakai pada komponen Request-Target). */
const CHECKOUT_PATH = "/checkout/v1/payment";

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
  const fakeQr = `00020101021226680016ID.CO.DOKU.WWW01189360091800000000000215${params.invoiceNumber}520458125303360540${params.amount}5802ID5911ACHO COFFEE6007BANDUNG62070703A016304`;

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

  // Jika DOKU_HOSTED, jangan batasi payment_method_types agar DOKU menampilkan semua metode yang aktif
  const paymentObj: Record<string, unknown> = {
    payment_due_date: 60,
  };
  if (params.channel !== "DOKU_HOSTED") {
    paymentObj.payment_method_types = [params.channel];
  }

  const body = JSON.stringify({
    order: {
      amount: params.amount,
      invoice_number: params.invoiceNumber,
      currency: "IDR",
      callback_url: env.siteUrl() + "/api/webhooks/doku",
      line_items: params.lineItems.map((li) => ({
        name: li.name,
        price: li.price,
        quantity: li.quantity,
      })),
    },
    payment: paymentObj,
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
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
    if (env.doku.demoFallback()) {
      // Jaringan lokal tidak bisa mencapai Doku — kembali ke mode demo
      return {
        demo: true,
        paymentId: "DEMO-" + randomUUID(),
        paymentUrl: null,
        virtualAccount: isQris ? undefined : fakeVa,
        qrContent: isQris ? fakeQr : undefined,
        channel: params.channel,
        howToPay:
          "Fallback demo: Doku tidak terjangkau dari jaringan ini (pembayaran sungguhan aktif di lingkungan produksi/Vercel).",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      };
    }
    throw new Error("Doku tidak terjangkau: " + (e instanceof Error ? e.message : "network error"));
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = "Doku error " + res.status + ": " + JSON.stringify(json).slice(0, 400);
    if (env.doku.demoFallback()) {
      // Dev lokal: Doku menolak (mis. kanal belum aktif) — tetap beri alur demo / simulasi
      return {
        demo: true,
        paymentId: "DEMO-" + randomUUID(),
        paymentUrl: null,
        virtualAccount: isQris ? undefined : fakeVa,
        qrContent: isQris ? fakeQr : undefined,
        channel: params.channel,
        howToPay: isQris
          ? "Scan QRIS di bawah menggunakan aplikasi BCA Mobile, GoPay, OVO, Dana, ShopeePay, atau m-banking lainnya."
          : "Fallback demo — " + detail,
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
