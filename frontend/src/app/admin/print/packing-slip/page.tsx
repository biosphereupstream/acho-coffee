import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByNumber } from "@/lib/store/orders";
import { PrintPackingSlipView } from "@/components/admin/print-packing-slip";

export const metadata: Metadata = {
  title: "Surat Jalan & Packing Slip Kurir — ACHO Roastery",
};

export default async function PrintPackingSlipPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; orderNumber?: string }>;
}) {
  const sp = await searchParams;
  const num = sp.order || sp.orderNumber;
  if (!num) notFound();

  const order = await getOrderByNumber(num);
  if (!order) notFound();

  return <PrintPackingSlipView order={order} />;
}
