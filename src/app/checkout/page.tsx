import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { createClient as getSupabaseServer } from "@/lib/server";

export const metadata: Metadata = {
  title: "Checkout Pesanan Kopi",
  description: "Lengkapi data pengiriman dan pembayaran untuk pesanan roasting kopi segar ACHO.",
};

export default async function CheckoutPage() {
  const supabase = await getSupabaseServer();
  let user: { email?: string; name?: string } | null = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const meta = data.user.user_metadata ?? {};
      user = {
        email: data.user.email ?? "",
        name: (meta.full_name as string) ?? (meta.name as string) ?? data.user.email ?? "",
      };
    }
  }

  return <CheckoutView initialUser={user} />;
}
