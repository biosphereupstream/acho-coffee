"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Flame, 
  Package, 
  Calendar, 
  RotateCw, 
  Tag, 
  BarChart3, 
  Coffee, 
  Boxes, 
  Users, 
  Settings, 
  Activity,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchPlanner } from "@/components/admin/batch-planner";
import { OrderManagement } from "@/components/admin/order-management";
import { PickupScheduleView } from "@/components/admin/pickup-schedule-view";
import { DashboardView } from "@/components/admin/dashboard-view";
import { MenuManagement } from "@/components/admin/menu-management";
import { InventoryManagement } from "@/components/admin/inventory-management";
import { CustomerManagement } from "@/components/admin/customer-management";
import { ConfigView } from "@/components/admin/config-view";
import type { OrderRecord } from "@/lib/types";

export function AdminPanel({ 
  orders, 
  demo,
  adminUser = "admin",
  onLogout
}: { 
  orders: OrderRecord[]; 
  demo: boolean;
  adminUser?: string;
  onLogout?: () => void;
}) {
  const router = useRouter();

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Header with Refresh & Quick Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur p-5 rounded-2xl border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-[var(--font-display)] text-xl sm:text-2xl font-black text-green-deep">
              Roastery Command Center
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Go Backend Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Backend Golang terintegrasi: Analitik, Kelola Menu, Inventaris, Pelanggan & Promosi, Supabase, Cloudflare.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {adminUser && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border text-xs font-semibold text-foreground">
              <User className="h-3.5 w-3.5 text-gold-deep" />
              <span>{adminUser}</span>
            </div>
          )}

          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-semibold">
            <Link href="/admin/print/bag-labels">
              <Tag className="h-3.5 w-3.5 text-gold-deep" /> Cetak Label Bag
            </Link>
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5 text-xs font-semibold">
            <RotateCw className="h-3.5 w-3.5" /> Refresh
          </Button>

          {onLogout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              title="Keluar dari sesi admin"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Tab Navigation */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max sm:w-full sm:grid sm:grid-cols-7 h-auto p-1 bg-secondary/80 rounded-2xl">
            <TabsTrigger value="dashboard" data-value="dashboard" className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Ringkasan</span>
            </TabsTrigger>
            <TabsTrigger value="menu" data-value="menu" className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl">
              <Coffee className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Kelola Menu</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" data-value="inventory" className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl">
              <Boxes className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Inventaris</span>
            </TabsTrigger>
            <TabsTrigger value="customers" data-value="customers" className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl">
              <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>Pelanggan</span>
            </TabsTrigger>
            <TabsTrigger value="orders" data-value="orders" className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl">
              <Package className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Pesanan</span>
            </TabsTrigger>
            <TabsTrigger value="planner" data-value="planner" className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl">
              <Flame className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Planner</span>
            </TabsTrigger>
            <TabsTrigger value="config" data-value="config" className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl">
              <Settings className="h-3.5 w-3.5 text-gold-deep shrink-0" />
              <span>Konfigurasi</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Dashboard Analytics */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardView />
        </TabsContent>

        {/* Tab 2: Menu Management (Select All & Bulk Edit) */}
        <TabsContent value="menu" className="space-y-6">
          <MenuManagement />
        </TabsContent>

        {/* Tab 3: Inventory Management & Alerts */}
        <TabsContent value="inventory" className="space-y-6">
          <InventoryManagement />
        </TabsContent>

        {/* Tab 4: Customer Management & Promotions */}
        <TabsContent value="customers" className="space-y-6">
          <CustomerManagement />
        </TabsContent>

        {/* Tab 5: Orders & Roasting Queue */}
        <TabsContent value="orders" className="space-y-6">
          <OrderManagement orders={orders} onOrderUpdated={handleRefresh} />
        </TabsContent>

        {/* Tab 6: Batch Roasting Planner */}
        <TabsContent value="planner" className="space-y-6">
          <BatchPlanner orders={orders} onBatchUpdated={handleRefresh} />
        </TabsContent>

        {/* Tab 7: Database, Supabase, Cloudflare & Frontend Config */}
        <TabsContent value="config" className="space-y-6">
          <ConfigView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
