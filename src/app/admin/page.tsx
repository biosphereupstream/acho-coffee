import type { Metadata } from "next";
import { createClient as getSupabaseServer } from "@/lib/server";
import { env } from "@/lib/env";
import { listOrdersForAdmin } from "@/lib/store/orders";
import { AdminPanel } from "@/components/admin/admin-panel";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const demo = !env.supabaseConfigured();
  let allowed = demo;

  if (!demo) {
    const supabase = await getSupabaseServer();
    const { data } = await supabase!.auth.getUser();
    const email = data.user?.email?.toLowerCase() ?? "";
    allowed = env.adminEmails().includes(email);
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-destructive">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman ini khusus admin. Tambahkan emailmu di <code>ADMIN_EMAILS</code> pada environment variable.
        </p>
      </div>
    );
  }

  const orders = await listOrdersForAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-[var(--font-display)] text-3xl font-bold text-green-deep">Panel Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {orders.length} pesanan • kelola status & antrian roasting
      </p>
      <div className="mt-8">
        <AdminPanel orders={orders} demo={demo} />
      </div>
    </div>
  );
}
