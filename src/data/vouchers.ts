import type { Voucher } from "@/lib/types";

export const STARTER_VOUCHERS: Voucher[] = [
  {
    code: "ACHO10",
    description: "Diskon 10% untuk semua varian kopi segar",
    type: "percentage",
    value: 10,
    minOrder: 0,
  },
  {
    code: "FREESHIP",
    description: "Gratis ongkir untuk pengiriman ke seluruh Indonesia",
    type: "free_shipping",
    value: 100, // 100% discount on shipping fee
    minOrder: 50000,
  },
  {
    code: "NGOPI20",
    description: "Potongan langsung Rp 20.000 (Min. belanja Rp 100.000)",
    type: "fixed",
    value: 20000,
    minOrder: 100000,
  },
];

export interface VoucherValidationResult {
  valid: boolean;
  message?: string;
  voucher?: Voucher;
  discountAmount: number;
}

export function validateVoucher(
  rawCode: string,
  subtotal: number,
  shippingFee: number = 0
): VoucherValidationResult {
  const code = rawCode.trim().toUpperCase();
  const voucher = STARTER_VOUCHERS.find((v) => v.code === code);

  if (!voucher) {
    return {
      valid: false,
      message: `Kode voucher "${code}" tidak ditemukan atau sudah kedaluwarsa.`,
      discountAmount: 0,
    };
  }

  if (voucher.minOrder && subtotal < voucher.minOrder) {
    return {
      valid: false,
      message: `Minimum pembelian untuk voucher ini adalah Rp ${voucher.minOrder.toLocaleString("id-ID")}.`,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;
  if (voucher.type === "percentage") {
    discountAmount = Math.round((subtotal * voucher.value) / 100);
  } else if (voucher.type === "fixed") {
    discountAmount = Math.min(voucher.value, subtotal);
  } else if (voucher.type === "free_shipping") {
    discountAmount = shippingFee;
  }

  return {
    valid: true,
    voucher,
    discountAmount,
    message: `Voucher ${voucher.code} berhasil digunakan!`,
  };
}
