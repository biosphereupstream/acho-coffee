import type { Metadata } from "next";
import { env } from "@/lib/env";
import { listOrdersForAdmin } from "@/lib/store/orders";
import { AdminGate } from "@/components/admin/admin-gate";
import type { OrderRecord } from "@/lib/types";

export const metadata: Metadata = { 
  title: "Admin Roastery Command Center | ACHO Coffee",
  description: "Panel manajemen backend ACHO Coffee",
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const demo = !env.supabaseConfigured();
  let orders: OrderRecord[] = [];
  try {
    orders = await listOrdersForAdmin();
  } catch {
    orders = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AdminGate orders={orders} demo={demo} />
    </div>
  );
}
