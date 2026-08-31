/** Konstanta & tipe Doku yang aman diimpor dari komponen client maupun server. */

export type DokuChannel =
  | "VIRTUAL_ACCOUNT_BCA"
  | "VIRTUAL_ACCOUNT_BANK_MANDIRI"
  | "VIRTUAL_ACCOUNT_BANK_BRI"
  | "VIRTUAL_ACCOUNT_BANK_BNI"
  | "VIRTUAL_ACCOUNT_DOKU"
  | "EWALLET_OVO"
  | "EWALLET_DANA"
  | "EWALLET_LINKAJA"
  | "EWALLET_SHOPEEPAY"
  | "QRIS";

export const DOKU_CHANNELS: { id: DokuChannel; label: string; fee: number }[] = [
  { id: "VIRTUAL_ACCOUNT_BCA", label: "Virtual Account BCA", fee: 4500 },
  { id: "VIRTUAL_ACCOUNT_BANK_MANDIRI", label: "Virtual Account Mandiri", fee: 4500 },
  { id: "VIRTUAL_ACCOUNT_BANK_BRI", label: "Virtual Account BRI", fee: 3500 },
  { id: "VIRTUAL_ACCOUNT_BANK_BNI", label: "Virtual Account BNI", fee: 3500 },
  { id: "EWALLET_OVO", label: "OVO", fee: 2500 },
  { id: "EWALLET_DANA", label: "DANA", fee: 2500 },
  { id: "EWALLET_LINKAJA", label: "LinkAja", fee: 2500 },
  { id: "EWALLET_SHOPEEPAY", label: "ShopeePay", fee: 2500 },
  { id: "QRIS", label: "QRIS (semua aplikasi)", fee: 0 },
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
