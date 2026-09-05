/** Konstanta & tipe Doku yang aman diimpor dari komponen client maupun server. */

export type DokuChannel =
  | "DOKU_HOSTED"
  | "VIRTUAL_ACCOUNT_BCA"
  | "VIRTUAL_ACCOUNT_BANK_MANDIRI"
  | "VIRTUAL_ACCOUNT_BANK_BRI"
  | "VIRTUAL_ACCOUNT_BRI"
  | "VIRTUAL_ACCOUNT_BANK_BNI"
  | "VIRTUAL_ACCOUNT_BNI"
  | "VIRTUAL_ACCOUNT_BANK_PERMATA"
  | "VIRTUAL_ACCOUNT_DOKU"
  | "ONLINE_TO_OFFLINE_ALFA"
  | "ONLINE_TO_OFFLINE_INDOMARET"
  | "EWALLET_OVO"
  | "EWALLET_DANA"
  | "EWALLET_LINKAJA"
  | "EWALLET_SHOPEEPAY"
  | "QRIS";

export const DOKU_CHANNELS: { id: DokuChannel; label: string; fee: number; group?: "hosted" | "qris" | "va" | "retail" | "ewallet" }[] = [
  { id: "DOKU_HOSTED", label: "DOKU Checkout (Semua Metode & Gerai)", fee: 0, group: "hosted" },
  { id: "QRIS", label: "QRIS (Semua E-Wallet & M-Banking)", fee: 0, group: "qris" },
  { id: "VIRTUAL_ACCOUNT_BRI", label: "Virtual Account BRI", fee: 3500, group: "va" },
  { id: "VIRTUAL_ACCOUNT_BNI", label: "Virtual Account BNI", fee: 3500, group: "va" },
  { id: "VIRTUAL_ACCOUNT_BANK_PERMATA", label: "Virtual Account Permata", fee: 3500, group: "va" },
  { id: "VIRTUAL_ACCOUNT_BCA", label: "Virtual Account BCA", fee: 4500, group: "va" },
  { id: "VIRTUAL_ACCOUNT_BANK_MANDIRI", label: "Virtual Account Mandiri", fee: 4500, group: "va" },
  { id: "VIRTUAL_ACCOUNT_DOKU", label: "Virtual Account DOKU", fee: 2000, group: "va" },
  { id: "ONLINE_TO_OFFLINE_ALFA", label: "Alfamart / Alfa Midi", fee: 3500, group: "retail" },
  { id: "ONLINE_TO_OFFLINE_INDOMARET", label: "Indomaret", fee: 3500, group: "retail" },
  { id: "EWALLET_OVO", label: "OVO", fee: 2500, group: "ewallet" },
  { id: "EWALLET_DANA", label: "DANA", fee: 2500, group: "ewallet" },
  { id: "EWALLET_LINKAJA", label: "LinkAja", fee: 2500, group: "ewallet" },
  { id: "EWALLET_SHOPEEPAY", label: "ShopeePay", fee: 2500, group: "ewallet" },
];

export interface DokuCreateParams {
  invoiceNumber: string;
  amount: number;
  channel: DokuChannel;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  lineItems: { name: string; quantity: number; price: number }[];
}

export interface DokuPaymentResult {
  demo: boolean;
  paymentId: string;
  paymentUrl: string | null;
  virtualAccount?: string;
  qrContent?: string;
  howToPay?: string;
  channel: DokuChannel;
  expiresAt?: string;
}

export interface DokuNotifyPayload {
  order?: {
    invoice_number?: string;
    amount?: number;
    status?: string;
    result_code?: string;
    how_to_pay_api?: string;
  };
  transaction?: {
    status?: string;
    date?: string;
  };
  payment?: {
    payment_method_type?: string;
  };
}
