"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Package, Calendar, RotateCw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchPlanner } from "@/components/admin/batch-planner";
import { OrderManagement } from "@/components/admin/order-management";
import { PickupScheduleView } from "@/components/admin/pickup-schedule-view";
import type { OrderRecord } from "@/lib/types";

export function AdminPanel({ orders, demo }: { orders: OrderRecord[]; demo: boolean }) {
  const router = useRouter();

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div>
      {demo && (
        <div className="mb-6 rounded-xl border border-gold/40 bg-accent/60 px-5 py-3 text-sm text-accent-foreground">
          🧪 <b>Mode demo aktif:</b> Supabase belum terkonfigurasi, panel admin terbuka untuk pengujian. Setelah Supabase terkonfigurasi penuh, hanya email di <code>ADMIN_EMAILS</code> yang dapat mengakses.
        </div>
      )}

      {/* Top Bar Header with Refresh & Quick Print */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-display)] text-2xl font-black text-green-deep">
            Roastery Command Center
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen batch sangrai artisan, penugasan kurir ekspedisi, dan cetak label termal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-semibold">
            <Link href="/admin/print/bag-labels">
              <Tag className="h-3.5 w-3.5 text-gold-deep" /> Cetak Semua Label Kantong
            </Link>
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5 text-xs font-semibold">
            <RotateCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* 3-Tab Command Center */}
      <Tabs defaultValue="planner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg h-11 p-1 bg-secondary/80">
          <TabsTrigger value="planner" className="flex items-center gap-1.5 text-xs font-bold">
            <Flame className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">Batch</span> Planner
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-1.5 text-xs font-bold">
            <Package className="h-3.5 w-3.5 text-primary" />
            Kelola Pesanan
          </TabsTrigger>
          <TabsTrigger value="pickups" className="flex items-center gap-1.5 text-xs font-bold">
            <Calendar className="h-3.5 w-3.5 text-gold-deep" />
            Jadwal Pickup
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Batch Roasting Planner */}
        <TabsContent value="planner" className="space-y-6">
          <BatchPlanner orders={orders} onBatchUpdated={handleRefresh} />
        </TabsContent>

        {/* Tab 2: Orders & Courier Dispatch */}
        <TabsContent value="orders" className="space-y-6">
          <OrderManagement orders={orders} onOrderUpdated={handleRefresh} />
        </TabsContent>

        {/* Tab 3: Pickup Schedule */}
        <TabsContent value="pickups" className="space-y-6">
          <PickupScheduleView orders={orders} onOrderUpdated={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
