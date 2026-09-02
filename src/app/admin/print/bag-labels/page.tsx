import type { Metadata } from "next";
import { getOrderByNumber, listOrdersForAdmin } from "@/lib/store/orders";
import { PrintBagLabelsView } from "@/components/admin/print-bag-labels";
import type { OrderRecord } from "@/lib/types";

export const metadata: Metadata = {
  title: "Cetak Label Stiker Kantong Kopi — ACHO Roastery",
};

export default async function PrintBagLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; orders?: string }>;
}) {
  const sp = await searchParams;
  let orders: OrderRecord[] = [];

  if (sp.order) {
    const o = await getOrderByNumber(sp.order);
    if (o) orders.push(o);
  } else if (sp.orders) {
    const nums = sp.orders.split(",").map((s) => s.trim()).filter(Boolean);
    for (const num of nums) {
      const o = await getOrderByNumber(num);
      if (o) orders.push(o);
    }
  } else {
    // Default: all active open roasting orders
    const all = await listOrdersForAdmin();
    orders = all.filter((o: OrderRecord) => ["paid", "queued", "roasting", "resting"].includes(o.status));
  }

  return <PrintBagLabelsView orders={orders} />;
}
