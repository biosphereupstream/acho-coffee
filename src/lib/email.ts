import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { STATUS_LABELS, type OrderRecord, type OrderStatus } from "@/lib/types";

const BRAND = "#0d3b26";
const GOLD = "#c9a227";

function shell(inner: string): string {
  const parts: string[] = [];
  parts.push("<!DOCTYPE html>");
  parts.push('<html lang="id"><body style="margin:0;padding:0;background:#f7f9f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">');
  parts.push('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9f8;padding:24px 12px;"><tr><td align="center">');
  parts.push('<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5ebe8;">');
  parts.push('<tr><td style="background:linear-gradient(120deg,' + BRAND + ' 0%,#0a5234 60%,#0d3b26 100%);padding:28px 32px;">');
  parts.push('<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">ACHO <span style="color:' + GOLD + ';">COFFEE</span></div>');
  parts.push('<div style="font-size:12px;color:#d9e8e0;margin-top:4px;">Fresh Roasting • Dipesan Hari Ini, Dipanggang Khusus</div>');
  parts.push("</td></tr>");
  parts.push('<tr><td style="padding:32px;">' + inner + "</td></tr>");
  parts.push('<tr><td style="padding:20px 32px;background:#0d3b26;color:#9fc3b2;font-size:11px;text-align:center;">&copy; ACHO Coffee Roastery — Jl. Kopi No. 1, Bandung, Indonesia</td></tr>');
  parts.push("</table></td></tr></table></body></html>");
  return parts.join("");
}

function orderSummaryHtml(order: OrderRecord): string {
  const rows = order.items
    .map((it) => {
      return (
        "<tr>" +
        '<td style="padding:8px 0;border-bottom:1px solid #eef2f0;font-size:13px;color:#1f2937;"><b>' +
        it.coffeeName +
        "</b><br/><span style='color:#6b7280;'>" +
        it.roastProfileName +
        " • " +
        it.grindSize +
        " • " +
        it.quantity +
        " pcs</span></td>" +
        '<td style="padding:8px 0;border-bottom:1px solid #eef2f0;font-size:13px;color:#1f2937;text-align:right;white-space:nowrap;">Rp ' +
        it.subtotalIdr.toLocaleString("id-ID") +
        "</td></tr>"
      );
    })
    .join("");

  return (
    '<p style="font-size:14px;color:#374151;margin:0 0 16px;">Halo <b>' +
    order.customerName +
    "</b>,</p>" +
    '<p style="font-size:14px;color:#374151;margin:0 0 20px;line-height:1.6;">Nomor pesanan: <b style="color:' +
    BRAND +
    ';">' +
    order.orderNumber +
    "</b><br/>Metode: <b>" +
    (order.fulfillment === "pickup" ? "Ambil di Roastery" : "Dikirim via kurir") +
    "</b></p>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    rows +
    '<tr><td style="padding:10px 0;font-size:14px;color:#1f2937;">Total</td><td style="padding:10px 0;font-size:16px;font-weight:800;color:' +
    BRAND +
    ';text-align:right;">Rp ' +
    order.total.toLocaleString("id-ID") +
    "</td></tr></table>" +
    '<p style="font-size:12px;color:#9ca3af;margin-top:16px;">Lacak pesananmu: <a href="' +
    env.siteUrl() +
    "/status/" +
    order.orderNumber +
    (order.guestToken ? "?t=" + order.guestToken : "") +
    '" style="color:' +
    GOLD +
    ';">' +
    env.siteUrl() +
    "/status/" +
    order.orderNumber +
    "</a></p>"
  );
}

async function send(to: string, subject: string, html: string) {
  if (!env.resendApiKey()) {
    console.log("[email:demo] ke " + to + ' — "' + subject + '"');
    return { skipped: true };
  }
  try {
    const resend = new Resend(env.resendApiKey());
    await resend.emails.send({ from: env.resendFrom(), to, subject, html });
    return { skipped: false };
  } catch (e) {
    console.error("[email] gagal kirim:", e);
    return { skipped: false, error: String(e) };
  }
}

export const emails = {
  async orderCreated(order: OrderRecord) {
    return send(
      order.customerEmail,
      "Pesanan " + order.orderNumber + " diterima — selesaikan pembayaran",
      shell(
        orderSummaryHtml(order) +
          '<p style="font-size:14px;color:#374151;line-height:1.6;">Pesananmu sudah masuk antrian roasting. Segera selesaikan pembayaran agar jadwal roasting terkunci. Kopi akan dipanggang <b>fresh setelah pembayaran diterima</b>.</p>' +
          '<a href="' +
          env.siteUrl() +
          "/pembayaran/" +
          order.orderNumber +
          '" style="display:inline-block;background:' +
          BRAND +
          ";color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;margin-top:8px;'>Bayar Sekarang</a>"
      )
    );
  },

  async paymentSuccess(order: OrderRecord) {
    return send(
      order.customerEmail,
      "Pembayaran " + order.orderNumber + " diterima — roasting dimulai",
      shell(
        orderSummaryHtml(order) +
          '<p style="font-size:14px;color:#374151;line-height:1.6;">✅ Pembayaran kamu sudah kami terima. Biji kopimu akan di-<b>roasting fresh</b> sesuai profil pilihanmu. Kami akan mengirim update di setiap tahap.</p>'
      )
    );
  },

  async statusUpdate(order: OrderRecord, status: OrderStatus, note?: string) {
    const pickup = order.fulfillment === "pickup" && status === "ready_pickup";
    const subject = pickup
      ? "Kopimu siap diambil! " + order.orderNumber
      : "Update pesanan " + order.orderNumber + ": " + STATUS_LABELS[status];
    const trackingHtml = order.trackingNo
      ? '<p style="font-size:13px;color:#374151;">No. Resi: <b>' +
        order.trackingNo +
        "</b> " +
        (order.trackingUrl ? '— <a href="' + order.trackingUrl + '" style="color:' + GOLD + ';">lacak di sini</a>' : "") +
        "</p>"
      : "";
    return send(
      order.customerEmail,
      subject,
      shell(
        orderSummaryHtml(order) +
          '<div style="background:#f0f7f3;border:1px solid #cde5d8;border-radius:10px;padding:16px;margin-top:8px;">' +
          '<p style="margin:0;font-size:14px;color:' +
          BRAND +
          ';font-weight:700;">📦 Status: ' +
          STATUS_LABELS[status] +
          "</p>" +
          '<p style="margin:6px 0 0;font-size:13px;color:#4b5563;line-height:1.6;">' +
          (note ?? "") +
          "</p></div>" +
          trackingHtml
      )
    );
  },
};
