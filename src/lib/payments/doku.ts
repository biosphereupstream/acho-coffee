import "server-only";
import { createHmac, randomUUID } from "crypto";
import { env } from "@/lib/env";
import type { DokuChannel, DokuCreateParams, DokuPaymentResult } from "@/lib/payments/doku-shared";

export type { DokuChannel, DokuCreateParams, DokuPaymentResult, DokuNotifyPayload } from "@/lib/payments/doku-shared";
export { DOKU_CHANNELS } from "@/lib/payments/doku-shared";

function sign(clientId: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", env.doku.sharedKey())
    .update(clientId + "|" + timestamp + "|" + rawBody)
    .digest("base64");
}

/** Buat pembayaran via Doku Jokul Checkout API. Fallback demo bila env belum diset. */
export async function createDokuPayment(params: DokuCreateParams): Promise<DokuPaymentResult> {
  if (!env.doku.configured()) {
    // Demo mode: generate VA palsu agar alur bisa dicoba end-to-end
    const digits = params.invoiceNumber.replace(/\D/g, "").slice(-10);
    const va = "8801" + digits + Math.floor(Math.random() * 90 + 10);
    return {
      demo: true,
      paymentId: "DEMO-" + randomUUID(),
      paymentUrl: null,
      virtualAccount: va,
      channel: params.channel,
      howToPay:
        "Demo: klik tombol \"Simulasi Pembayaran Berhasil\" di halaman pembayaran untuk melanjutkan alur.",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
  }

  const timestamp = new Date().toISOString();
  const requestId = randomUUID();
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
    payment: {
      payment_due_date: 60,
      payment_method_types: [params.channel],
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      address: "Indonesia",
      country: "ID",
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Client-Id": env.doku.clientId(),
    "Request-Id": requestId,
    "Request-Timestamp": timestamp,
    Signature: sign(env.doku.clientId(), timestamp, body),
  };

  const res = await fetch(env.doku.baseUrl() + "/checkout/v1/payment", {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error("Doku error " + res.status + ": " + JSON.stringify(json).slice(0, 400));
  }

  const paymentUrl: string | null = json?.response?.payment?.url ?? null;
  const vaInfo = json?.response?.virtual_account_info ?? null;

  return {
    demo: false,
    paymentId: json?.response?.payment?.token_id ?? requestId,
    paymentUrl,
    virtualAccount: vaInfo?.virtual_account_number ?? undefined,
    howToPay: vaInfo?.how_to_pay_page ?? undefined,
    channel: params.channel,
    expiresAt: json?.response?.payment?.expired_date
      ? new Date(json.response.payment.expired_date).toISOString()
      : undefined,
  };
}

/** Verifikasi signature webhook notifikasi Doku. */
export function verifyDokuNotification(
  clientIdHeader: string,
  timestampHeader: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const expected = sign(clientIdHeader, timestampHeader, rawBody);
  const a = Buffer.from(expected, "base64");
  const b = Buffer.from(signatureHeader, "base64");
  return a.length === b.length && a.equals(b);
}
