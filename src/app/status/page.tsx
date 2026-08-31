import type { Metadata } from "next";
import { StatusLookup } from "@/components/order/status-lookup";

export const metadata: Metadata = { title: "Lacak Pesanan" };

export default function StatusLookupPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <StatusLookup />
    </div>
  );
}
