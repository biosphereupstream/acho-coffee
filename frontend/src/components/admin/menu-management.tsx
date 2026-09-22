"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  CheckSquare, 
  Square, 
  Edit, 
  Trash2, 
  DollarSign, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Check, 
  X,
  Coffee,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: string;
  packaging: string;
  process: string;
  price_idr: number;
  stock_quantity: number;
  image_url: string;
  is_active: boolean;
  description: string;
}

export interface CategoryConfig {
  label: string;
  badgeClass: string;
  defaultPackaging: string;
  type: "beans" | "drinks";
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryConfig> = {
  beans: {
    label: "Biji Kopi Sangrai",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    defaultPackaging: "250g Valve Bag",
    type: "beans",
  },
  botol_kale: {
    label: "Botol Kale 250ml",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    defaultPackaging: "Botol Kale 250ml",
    type: "drinks",
  },
  pet_can: {
    label: "Pet Can 250ml",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    defaultPackaging: "Pet Can 250ml",
    type: "drinks",
  },
  botol_1000: {
    label: "Botol 1 Liter",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    defaultPackaging: "Botol 1000ml (1 Liter)",
    type: "drinks",
  },
  simplicity_pouch: {
    label: "Simplicity Pouch",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    defaultPackaging: "Pouch 200ml",
    type: "drinks",
  },
  espresso_pouch: {
    label: "Espresso Pouch",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    defaultPackaging: "Pouch 100ml Concentrate",
    type: "drinks",
  },
};

export function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "beans" | "drinks">("all");
  const [subTab, setSubTab] = useState<string>("all");
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modals
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkAction, setBulkAction] = useState<"price_percent" | "price_fixed" | "status" | "stock">("price_percent");
  const [bulkPercent, setBulkPercent] = useState<number>(5);
  const [bulkFixed, setBulkFixed] = useState<number>(5000);
  const [bulkStatus, setBulkStatus] = useState<boolean>(true);
  const [bulkStock, setBulkStock] = useState<number>(50);

  // Edit / Add Modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  async function fetchMenu() {
    setLoading(true);
    try {
      const url = `/api/backend/menu?search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load menu");
      const json = await res.json();
      setItems(json.items || []);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMenu();
  }, []);

  function handleTabChange(tab: "all" | "beans" | "drinks") {
    setActiveTab(tab);
    setSubTab("all");
    setSelectedIds([]);
    setSelectAll(false);
  }

  function handleSubTabChange(sub: string) {
    setSubTab(sub);
    setSelectedIds([]);
    setSelectAll(false);
  }

  // Filter items based on activeTab & subTab
  const displayedItems = items.filter((item) => {
    if (activeTab === "beans") {
      if (item.category !== "beans" && item.type !== "roasted_bean") return false;
    } else if (activeTab === "drinks") {
      if (item.category === "beans" || item.type === "roasted_bean") return false;
      if (subTab !== "all" && item.category !== subTab) return false;
    }
    return true;
  });

  // Category counts
  const beansCount = items.filter((i) => i.category === "beans" || i.type === "roasted_bean").length;
  const drinksCount = items.filter((i) => i.category !== "beans" && i.type !== "roasted_bean").length;

  const getSubCategoryCount = (catKey: string) => {
    return items.filter((i) => i.category === catKey).length;
  };

  // Dynamic summary stats based on current filtered view
  const totalVariants = displayedItems.length;
  const totalStock = displayedItems.reduce((acc, curr) => acc + (Number(curr.stock_quantity) || 0), 0);
  const activeCount = displayedItems.filter((i) => i.is_active).length;
  const inactiveCount = totalVariants - activeCount;

  function handleSelectAllToggle() {
    if (selectAll) {
      setSelectAll(false);
      setSelectedIds([]);
    } else {
      setSelectAll(true);
      setSelectedIds(displayedItems.map((i) => i.id));
    }
  }

  function handleSelectItem(id: string) {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      setSelectedIds(next);
      setSelectAll(next.length === displayedItems.length && displayedItems.length > 0);
    } else {
      const next = [...selectedIds, id];
      setSelectedIds(next);
      setSelectAll(next.length === displayedItems.length && displayedItems.length > 0);
    }
  }

  async function handleBulkSubmit() {
    if (selectedIds.length === 0) return;

    const payload: any = {
      select_all: false,
      item_ids: selectedIds,
    };

    if (bulkAction === "price_percent") {
      payload.action = "price_adjust_percent";
      payload.adjust_percent = Number(bulkPercent);
    } else if (bulkAction === "price_fixed") {
      payload.action = "price_adjust_fixed";
      payload.adjust_fixed = Number(bulkFixed);
    } else if (bulkAction === "status") {
      payload.action = "set_active";
      payload.set_active = bulkStatus;
    } else if (bulkAction === "stock") {
      payload.action = "set_stock";
      payload.set_stock = Number(bulkStock);
    }

    try {
      const res = await fetch("/api/backend/menu/bulk-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Bulk edit failed");
      setShowBulkEdit(false);
      setSelectedIds([]);
      setSelectAll(false);
      await fetchMenu();
    } catch (err) {
      alert("Gagal melakukan aksi massal: " + String(err));
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const url = isNewItem ? "/api/backend/menu" : `/api/backend/menu/${editingItem.id}`;
      const method = isNewItem ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      if (!res.ok) throw new Error("Gagal menyimpan item");
      setEditingItem(null);
      await fetchMenu();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus item menu ini?")) return;
    try {
      const res = await fetch(`/api/backend/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus item");
      await fetchMenu();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${count} item menu terpilih?`)) return;

    try {
      const res = await fetch("/api/backend/menu/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select_all: false,
          item_ids: selectedIds,
        }),
      });
      if (!res.ok) throw new Error("Gagal menghapus item menu secara massal");
      setSelectedIds([]);
      setSelectAll(false);
      await fetchMenu();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  function formatIDR(val: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  }

  return (
    <div className="space-y-4">
      {/* 4 Dynamic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card/70 backdrop-blur-sm border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Varian</p>
            <p className="text-2xl font-black text-foreground">{totalVariants} <span className="text-xs font-normal text-muted-foreground">menu</span></p>
            <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
              {activeTab === "all" ? "Semua kategori" : activeTab === "beans" ? "Biji kopi sangrai" : subTab === "all" ? "Semua minuman" : CATEGORY_DEFINITIONS[subTab]?.label || "Kategori aktif"}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card/70 backdrop-blur-sm border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Stok Total</p>
            <p className="text-2xl font-black text-foreground">{totalStock} <span className="text-xs font-normal text-muted-foreground">unit</span></p>
            <p className="text-[10px] text-muted-foreground">Ketersediaan fisik</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Coffee className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card/70 backdrop-blur-sm border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Produk Aktif</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground">Tayang di storefront</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Eye className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card/70 backdrop-blur-sm border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Produk Nonaktif</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{inactiveCount}</p>
            <p className="text-[10px] text-muted-foreground">Disembunyikan</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <EyeOff className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="space-y-3 bg-card/60 backdrop-blur p-4 rounded-2xl border border-border/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tingkat 1: Kategori Utama */}
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl">
            <button
              onClick={() => handleTabChange("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Semua Menu</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {items.length}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("beans")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "beans" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Biji Kopi Sangrai</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {beansCount}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("drinks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "drinks" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Minuman Siap Minum</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {drinksCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama, proses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchMenu()}
                className="w-full bg-background/80 border border-input rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              size="sm"
              onClick={() => {
                setIsNewItem(true);
                const defaultCat = activeTab === "beans" ? "beans" : (subTab !== "all" ? subTab : "botol_kale");
                const catDef = CATEGORY_DEFINITIONS[defaultCat] || CATEGORY_DEFINITIONS.beans;
                setEditingItem({
                  id: "",
                  slug: "",
                  name: "",
                  category: defaultCat,
                  type: catDef.type === "beans" ? "roasted_bean" : "drink",
                  packaging: catDef.defaultPackaging,
                  process: defaultCat === "beans" ? "Full Washed" : "Cold Brewed / Ready to Drink",
                  price_idr: defaultCat === "beans" ? 95000 : 25000,
                  stock_quantity: 50,
                  image_url: "",
                  is_active: true,
                  description: "",
                });
              }}
              className="gap-1.5 text-xs shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Menu
            </Button>
          </div>
        </div>

        {/* Tingkat 2: Sub-kategori Kemasan Minuman (Hanya jika tab Minuman aktif) */}
        {activeTab === "drinks" && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-border/40 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1 shrink-0">Kemasan:</span>
            <button
              onClick={() => handleSubTabChange("all")}
              className={`px-2.5 py-1 rounded-lg text-xs transition shrink-0 flex items-center gap-1.5 ${
                subTab === "all"
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Semua Kemasan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                subTab === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {drinksCount}
              </span>
            </button>
            {Object.entries(CATEGORY_DEFINITIONS)
              .filter(([_, config]) => config.type === "drinks")
              .map(([key, config]) => {
                const count = getSubCategoryCount(key);
                const isActive = subTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSubTabChange(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{config.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedIds.length} item menu dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowBulkEdit(true)}
              className="text-xs font-bold gap-1"
            >
              <Edit className="h-3 w-3" /> Edit Massal
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="text-xs font-bold gap-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3 w-3" /> Hapus Terpilih ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedIds([]);
                setSelectAll(false);
              }}
              className="text-xs hover:bg-primary-foreground/20 text-primary-foreground"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Menu Table */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAllToggle} className="text-foreground hover:text-primary">
                    {selectAll && displayedItems.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="p-3">Produk</th>
                <th className="p-3">Kategori & Kemasan</th>
                <th className="p-3">Harga</th>
                <th className="p-3">Stok</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-gold" />
                    Memuat menu...
                  </td>
                </tr>
              ) : displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    Tidak ada item menu yang sesuai dengan filter ini
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-accent/40 transition ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="p-3 text-center">
                        <button onClick={() => handleSelectItem(item.id)}>
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover bg-secondary"
                          />
                          <div>
                            <p className="font-bold text-foreground text-xs">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">{item.process || item.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {(() => {
                          const catDef = CATEGORY_DEFINITIONS[item.category] || {
                            label: item.category === "beans" ? "Biji Kopi Sangrai" : "Minuman",
                            badgeClass: "bg-secondary text-secondary-foreground border-border",
                          };
                          return (
                            <div className="space-y-0.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${catDef.badgeClass}`}>
                                {catDef.label}
                              </span>
                              <p className="text-[10px] text-muted-foreground">{item.packaging}</p>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3 font-bold text-foreground">
                        {formatIDR(item.price_idr)}
                      </td>
                      <td className="p-3">
                        <span className={`font-semibold ${item.stock_quantity < 10 ? "text-destructive" : "text-foreground"}`}>
                          {item.stock_quantity} unit
                        </span>
                      </td>
                      <td className="p-3">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <Eye className="h-3 w-3" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <EyeOff className="h-3 w-3" /> Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsNewItem(false);
                              setEditingItem(item);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-bold text-base text-foreground">
                Edit Massal ({selectedIds.length} item)
              </h3>
              <button onClick={() => setShowBulkEdit(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-foreground">Pilih Tindakan Massal:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkAction("price_percent")}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    bulkAction === "price_percent" ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  Ubah Harga (%)
                </button>
                <button
                  type="button"
                  onClick={() => setBulkAction("price_fixed")}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    bulkAction === "price_fixed" ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  Ubah Harga (IDR)
                </button>
                <button
                  type="button"
                  onClick={() => setBulkAction("status")}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    bulkAction === "status" ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  Status Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setBulkAction("stock")}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    bulkAction === "stock" ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  Setel Stok
                </button>
              </div>

              {bulkAction === "price_percent" && (
                <div className="space-y-1 pt-2">
                  <label className="text-muted-foreground">Persentase Penyesuaian Harga (+/- %):</label>
                  <input
                    type="number"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(Number(e.target.value))}
                    className="w-full bg-background border border-input rounded-xl p-2 text-xs focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: 5 untuk naik 5%, -5 untuk turun 5%"
                  />
                  <p className="text-[10px] text-muted-foreground">Harga otomatis dibulatkan ke kelipatan Rp 1.000 terdekat.</p>
                </div>
              )}

              {bulkAction === "price_fixed" && (
                <div className="space-y-1 pt-2">
                  <label className="text-muted-foreground">Nominal Penyesuaian (+/- IDR):</label>
                  <input
                    type="number"
                    value={bulkFixed}
                    onChange={(e) => setBulkFixed(Number(e.target.value))}
                    className="w-full bg-background border border-input rounded-xl p-2 text-xs focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: 5000 untuk naik Rp 5.000"
                  />
                </div>
              )}

              {bulkAction === "status" && (
                <div className="space-y-1 pt-2">
                  <label className="text-muted-foreground">Status Katalog:</label>
                  <select
                    value={bulkStatus ? "true" : "false"}
                    onChange={(e) => setBulkStatus(e.target.value === "true")}
                    className="w-full bg-background border border-input rounded-xl p-2 text-xs"
                  >
                    <option value="true">Aktifkan Semua (Tampil di Katalog)</option>
                    <option value="false">Nonaktifkan Semua (Sembunyikan dari Pembeli)</option>
                  </select>
                </div>
              )}

              {bulkAction === "stock" && (
                <div className="space-y-1 pt-2">
                  <label className="text-muted-foreground">Jumlah Stok Baru:</label>
                  <input
                    type="number"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(Number(e.target.value))}
                    className="w-full bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button size="sm" variant="outline" onClick={() => setShowBulkEdit(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleBulkSubmit} className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Terapkan ke {selectedIds.length} Item
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Single Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveItem}
            className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-bold text-base text-foreground">
                {isNewItem ? "Tambah Item Menu Baru" : `Edit: ${editingItem.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Nama Produk:</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Kategori:</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const catDef = CATEGORY_DEFINITIONS[newCat];
                      setEditingItem({
                        ...editingItem,
                        category: newCat,
                        type: catDef?.type === "beans" ? "roasted_bean" : "drink",
                        packaging: (!editingItem.packaging || isNewItem) ? (catDef?.defaultPackaging || editingItem.packaging) : editingItem.packaging,
                      });
                    }}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  >
                    <option value="beans">[Biji Kopi] Biji Kopi Sangrai</option>
                    <optgroup label="Minuman Siap Minum">
                      <option value="botol_kale">[Minuman] Botol Kale 250ml</option>
                      <option value="pet_can">[Minuman] Pet Can 250ml</option>
                      <option value="botol_1000">[Minuman] Botol 1 Liter</option>
                      <option value="simplicity_pouch">[Minuman] Simplicity Pouch</option>
                      <option value="espresso_pouch">[Minuman] Espresso Pouch</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Format Kemasan:</label>
                  <input
                    type="text"
                    value={editingItem.packaging}
                    onChange={(e) => setEditingItem({ ...editingItem, packaging: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                    placeholder="Contoh: 250g Valve Bag"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Harga (IDR):</label>
                  <input
                    type="number"
                    required
                    value={editingItem.price_idr}
                    onChange={(e) => setEditingItem({ ...editingItem, price_idr: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">Stok Tersedia:</label>
                  <input
                    type="number"
                    required
                    value={editingItem.stock_quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, stock_quantity: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Proses / Catatan Pembuatan:</label>
                <input
                  type="text"
                  value={editingItem.process}
                  onChange={(e) => setEditingItem({ ...editingItem, process: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  placeholder="Contoh: Bio-Natural Anaerobic"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">URL Foto (Cloudflare R2 / CDN):</label>
                <input
                  type="text"
                  value={editingItem.image_url}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  placeholder="https://pub-xxx.r2.dev/..."
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Deskripsi Produk:</label>
                <textarea
                  rows={3}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingItem.is_active}
                  onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="isActiveToggle" className="font-medium text-foreground cursor-pointer">
                  Tampilkan di katalog toko (Status Aktif)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Simpan Produk
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
