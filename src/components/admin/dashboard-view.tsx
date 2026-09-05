"use client";

import { useEffect, useState } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Coffee, 
  Wine, 
  RefreshCw,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardAnalytics {
  stats: {
    total_revenue_idr: number;
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    active_customers: number;
    low_stock_alerts_count: number;
    beans_total_sold: number;
    beverages_total_sold: number;
  };
  revenue_history: Array<{
    date: string;
    revenue_idr: number;
    order_count: number;
  }>;
  category_breakdown: Array<{
    category: string;
    display_name: string;
    total_quantity: number;
    total_revenue_idr: number;
    percentage: number;
  }>;
  top_products: Array<{
    id: string;
    slug: string;
    name: string;
    category: string;
    total_quantity: number;
    total_revenue_idr: number;
  }>;
  recent_orders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    status: string;
    fulfillment: string;
    total: number;
    items_count: number;
    created_at: string;
  }>;
  low_stock_items: Array<{
    id: string;
    code: string;
    name: string;
    current_stock: number;
    unit: string;
    min_threshold: number;
  }>;
}

export function DashboardView() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backend/dashboard/analytics");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function formatIDR(val: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin text-gold mb-3" />
        <p className="text-sm">Memuat analitik dari Go backend...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <h3 className="font-bold text-destructive">Gagal Memuat Analitik</h3>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
        <Button onClick={fetchData} size="sm" variant="outline" className="mt-4">
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const maxRev = Math.max(...data.revenue_history.map((r) => r.revenue_idr), 1);

  return (
    <div className="space-y-6">
      {/* Alert Banner if Low Stock */}
      {data.stats.low_stock_alerts_count > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold">
                Peringatan Stok Rendah: {data.stats.low_stock_alerts_count} item perlu restock
              </p>
              <p className="text-xs opacity-80">
                {data.low_stock_items.map((it) => `${it.name} (${it.current_stock} ${it.unit})`).join(", ")}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => {
            const btn = document.querySelector('[data-value="inventory"]') as HTMLButtonElement;
            if (btn) btn.click();
          }} className="shrink-0 text-xs">
            Lihat Stok
          </Button>
        </div>
      )}

      {/* Stats 4-Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Pendapatan</span>
            <DollarSign className="h-4 w-4 text-gold-deep" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-green-deep">
            {formatIDR(data.stats.total_revenue_idr)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            <span>Real-time dari Supabase & Go</span>
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Pesanan</span>
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-foreground">
            {data.stats.total_orders} Pesanan
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {data.stats.completed_orders} selesai • {data.stats.pending_orders} proses
          </p>
        </div>

        {/* Active Customers */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Pelanggan Aktif</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-foreground">
            {data.stats.active_customers} Mitra & Retail
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Termasuk B2B Silver & Gold
          </p>
        </div>

        {/* Sales Volumes */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Volume Penjualan</span>
            <Coffee className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-sm sm:text-base font-bold text-foreground">
            {data.stats.beans_total_sold} Bag Biji Kopi
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {data.stats.beverages_total_sold} Botol/Can Minuman
          </p>
        </div>
      </div>

      {/* 2-Column: Revenue Trends & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">Tren Penjualan 7 Hari</h3>
              <p className="text-xs text-muted-foreground">Omzet harian roastery & coffee bar</p>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchData} className="h-8 px-2 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" /> Update
            </Button>
          </div>

          <div className="flex items-end gap-2 h-44 pt-4 border-b border-border/50">
            {data.revenue_history.map((day) => {
              const heightPct = Math.round((day.revenue_idr / maxRev) * 100);
              const label = day.date.slice(5); // MM-DD
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                    {Math.round(day.revenue_idr / 1000)}k
                  </div>
                  <div className="w-full bg-secondary rounded-t-md relative flex items-end justify-center h-32 overflow-hidden">
                    <div
                      style={{ height: `${Math.max(heightPct, 8)}%` }}
                      className="w-full bg-gradient-to-t from-primary/80 to-gold rounded-t-md transition-all group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-5 shadow-sm">
          <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">Distribusi Kategori</h3>
          <p className="text-xs text-muted-foreground mb-4">Porsi penjualan per format kemasan</p>

          <div className="space-y-3">
            {data.category_breakdown.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-[160px]">
                    {cat.display_name}
                  </span>
                  <span className="font-bold text-muted-foreground">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-primary rounded-full transition-all"
                  />
                </div>
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{cat.total_quantity} qty</span>
                  <span>{formatIDR(cat.total_revenue_idr)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column: Top Selling Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-5 shadow-sm">
          <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">Produk Terlaris</h3>
          <p className="text-xs text-muted-foreground mb-4">Item favorit pilihan pelanggan & mitra</p>

          <div className="divide-y divide-border/40">
            {data.top_products.map((p, idx) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 font-bold text-muted-foreground text-center">{idx + 1}</span>
                  <div>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {p.category.replace("drinks_", "").replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-deep">{formatIDR(p.total_revenue_idr)}</p>
                  <p className="text-[11px] text-muted-foreground">{p.total_quantity} terjual</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur p-5 shadow-sm">
          <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">Pesanan Terbaru</h3>
          <p className="text-xs text-muted-foreground mb-4">Status pemrosesan pesanan terakhir</p>

          <div className="divide-y divide-border/40">
            {data.recent_orders.slice(0, 5).map((o) => (
              <div key={o.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-foreground">{o.order_number}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.customer_name} • {o.items_count} item ({o.fulfillment})
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{formatIDR(o.total)}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    o.status === "completed" || o.status === "delivered" 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : o.status === "roasting"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  }`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
