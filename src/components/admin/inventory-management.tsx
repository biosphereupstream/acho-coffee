"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  History, 
  ArrowUpDown, 
  Check, 
  X, 
  RefreshCw,
  Boxes,
  MapPin,
  Tag,
  CheckSquare,
  Square,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  min_threshold: number;
  cost_per_unit_idr: number;
  location: string;
  batch_number: string;
  last_restocked_at: string;
  updated_at: string;
}

interface InventoryLog {
  id: string;
  inventory_item_id: string;
  item_name: string;
  change_amount: number;
  balance_after: number;
  action_type: string;
  reason: string;
  created_by: string;
  created_at: string;
}

export function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Single Item Edit Modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Bulk Edit Modal
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkLocation, setBulkLocation] = useState("");
  const [bulkThreshold, setBulkThreshold] = useState<number | "">("");

  // Modals
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustAction, setAdjustAction] = useState<string>("restock");
  const [adjustReason, setAdjustReason] = useState<string>("");

  const [logsItem, setLogsItem] = useState<InventoryItem | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    code: "",
    name: "",
    category: "packaging_bottle",
    current_stock: 100,
    unit: "pcs",
    min_threshold: 30,
    cost_per_unit_idr: 2000,
    location: "Gudang Utama",
    batch_number: "LOT-" + new Date().toISOString().slice(0, 10).replace(/-/g, ""),
  });

  async function fetchInventory() {
    setLoading(true);
    try {
      let url = `/api/backend/inventory?search=${encodeURIComponent(search)}`;
      if (categoryFilter !== "all") url += `&category=${categoryFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load inventory");
      const json = await res.json();
      setItems(json.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter]);

  function handleSelectAllToggle() {
    if (selectAll) {
      setSelectAll(false);
      setSelectedIds([]);
    } else {
      setSelectAll(true);
      setSelectedIds(items.map((i) => i.id));
    }
  }

  function handleSelectItem(id: string) {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      setSelectedIds(next);
      setSelectAll(next.length === items.length);
    } else {
      const next = [...selectedIds, id];
      setSelectedIds(next);
      setSelectAll(next.length === items.length);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/backend/inventory/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });
      if (!res.ok) throw new Error("Gagal memperbarui item inventaris");
      setEditingItem(null);
      await fetchInventory();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus item inventaris ini?")) return;
    try {
      const res = await fetch(`/api/backend/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus item inventaris");
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      await fetchInventory();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleBulkDelete() {
    const count = selectAll ? items.length : selectedIds.length;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${count} item inventaris terpilih?`)) return;
    try {
      const res = await fetch("/api/backend/inventory/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select_all: selectAll,
          item_ids: selectedIds,
        }),
      });
      if (!res.ok) throw new Error("Gagal menghapus item secara massal");
      setSelectedIds([]);
      setSelectAll(false);
      await fetchInventory();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleBulkEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: any = {
        select_all: selectAll,
        item_ids: selectedIds,
      };
      if (bulkCategory) payload.category = bulkCategory;
      if (bulkLocation) payload.location = bulkLocation;
      if (bulkThreshold !== "") payload.min_threshold = Number(bulkThreshold);

      const res = await fetch("/api/backend/inventory/bulk-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal update massal inventaris");
      setShowBulkEdit(false);
      setSelectedIds([]);
      setSelectAll(false);
      await fetchInventory();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingItem || adjustAmount === 0) return;

    try {
      const res = await fetch(`/api/backend/inventory/${adjustingItem.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          change_amount: Number(adjustAmount),
          action_type: adjustAction,
          reason: adjustReason || "Penyesuaian stok inventaris manual",
          created_by: "Admin Roastery",
        }),
      });

      if (!res.ok) throw new Error("Gagal menyesuaikan stok");
      setAdjustingItem(null);
      setAdjustAmount(0);
      setAdjustReason("");
      await fetchInventory();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleViewLogs(item: InventoryItem) {
    setLogsItem(item);
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/backend/inventory/${item.id}/logs`);
      if (!res.ok) throw new Error("Failed to load logs");
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/backend/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) throw new Error("Gagal membuat item");
      setShowAddModal(false);
      await fetchInventory();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  function formatIDR(val: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  }

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 backdrop-blur p-4 rounded-2xl border border-border/80">
        <div className="flex flex-wrap items-center gap-1 bg-secondary/80 p-1 rounded-xl">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              categoryFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setCategoryFilter("green_beans")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              categoryFilter === "green_beans" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Biji Hijau (Green Beans)
          </button>
          <button
            onClick={() => setCategoryFilter("packaging_bottle")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              categoryFilter === "packaging_bottle" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Botol
          </button>
          <button
            onClick={() => setCategoryFilter("packaging_can")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              categoryFilter === "packaging_can" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pet Can
          </button>
          <button
            onClick={() => setCategoryFilter("packaging_pouch")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              categoryFilter === "packaging_pouch" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pouch & Bag
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari kode, nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInventory()}
              className="w-full bg-background/80 border border-input rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5 text-xs shrink-0">
            <Plus className="h-3.5 w-3.5" /> Tambah Bahan/Kemasan
          </Button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedIds.length} item inventaris dipilih</span>
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

      {/* Inventory Table */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAllToggle} className="text-foreground hover:text-primary">
                    {selectAll ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="p-3">Kode & Item</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Stok Saat Ini</th>
                <th className="p-3">Batas Minimum</th>
                <th className="p-3">Lokasi & Batch</th>
                <th className="p-3">Harga Satuan (COGS)</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-gold" />
                    Memuat inventaris...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground">
                    Tidak ada item inventaris yang ditemukan
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow = item.current_stock <= item.min_threshold;
                  return (
                    <tr key={item.id} className="hover:bg-accent/40 transition">
                      <td className="p-3 text-center">
                        <button onClick={() => handleSelectItem(item.id)} className="text-foreground hover:text-primary">
                          {selectedIds.includes(item.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <p className="font-mono text-[10px] text-muted-foreground">{item.code}</p>
                        <p className="font-bold text-foreground">{item.name}</p>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground capitalize">
                          {item.category.replace("packaging_", "").replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${isLow ? "text-destructive font-black" : "text-foreground"}`}>
                            {item.current_stock.toLocaleString()} {item.unit}
                          </span>
                          {isLow && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-bold">
                              <AlertTriangle className="h-3 w-3" /> Rendah
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {item.min_threshold.toLocaleString()} {item.unit}
                      </td>
                      <td className="p-3">
                        <p className="text-[11px] text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{item.location}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.batch_number}</p>
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        {formatIDR(item.cost_per_unit_idr)} / {item.unit}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustAmount(0);
                              setAdjustAction("restock");
                            }}
                            className="h-7 text-xs font-bold gap-1"
                          >
                            <ArrowUpDown className="h-3 w-3" /> Sesuaikan
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingItem({ ...item })}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit Item Inventaris"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewLogs(item)}
                            className="h-7 w-7 p-0"
                            title="Riwayat Mutasi"
                          >
                            <History className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            title="Hapus Item"
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

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Sesuaikan Stok Inventaris</h3>
                <p className="text-xs text-muted-foreground">{adjustingItem.name} ({adjustingItem.code})</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 flex justify-between items-center">
                <span className="text-muted-foreground">Stok Saat Ini:</span>
                <span className="font-bold text-base text-foreground">
                  {adjustingItem.current_stock.toLocaleString()} {adjustingItem.unit}
                </span>
              </div>

              <div>
                <label className="font-semibold text-foreground">Jenis Penyesuaian:</label>
                <select
                  value={adjustAction}
                  onChange={(e) => setAdjustAction(e.target.value)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                >
                  <option value="restock">Penerimaan Stok / Restock (+)</option>
                  <option value="roast_deduction">Pemakaian Batch Roasting (-)</option>
                  <option value="sale_deduction">Pemakaian Bar Minuman / Penjualan (-)</option>
                  <option value="damage_spoil">Rusak, Bocor, atau Tumpah (-)</option>
                  <option value="manual_adjustment">Koreksi Stok Fisik / Opname (+/-)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  Jumlah Penyesuaian ({adjustingItem.unit}):
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs font-mono font-bold"
                  placeholder="Gunakan tanda minus (-) untuk pengurangan"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Hasil akhir: {Math.max(0, adjustingItem.current_stock + adjustAmount).toLocaleString()} {adjustingItem.unit}
                </p>
              </div>

              <div>
                <label className="font-semibold text-foreground">Alasan / Catatan:</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  placeholder="Contoh: Penerimaan 50kg lot Frinsa dari petani"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" size="sm" variant="outline" onClick={() => setAdjustingItem(null)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Konfirmasi Penyesuaian
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* View Logs Modal */}
      {logsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Riwayat Mutasi Stok</h3>
                <p className="text-xs text-muted-foreground">{logsItem.name}</p>
              </div>
              <button onClick={() => setLogsItem(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border/40 text-xs">
              {loadingLogs ? (
                <div className="py-8 text-center text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-gold" />
                  Memuat riwayat...
                </div>
              ) : logs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Belum ada mutasi tercatat</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground capitalize">
                        {log.action_type.replace("_", " ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{log.reason}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(log.created_at).toLocaleString("id-ID")} • Oleh {log.created_by}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${log.change_amount > 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                      </span>
                      <p className="text-[10px] text-muted-foreground">Sisa: {log.balance_after}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/50">
              <Button size="sm" variant="outline" onClick={() => setLogsItem(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-bold text-base text-foreground">Tambah Item Inventaris Baru</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Kode Item:</label>
                  <input
                    type="text"
                    required
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                    placeholder="Contoh: PKG-BOT-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Kategori:</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  >
                    <option value="green_beans">Biji Hijau (Green Beans)</option>
                    <option value="roasted_beans">Biji Sangrai (Roasted Beans)</option>
                    <option value="packaging_bottle">Botol</option>
                    <option value="packaging_can">Pet Can</option>
                    <option value="packaging_pouch">Pouch & Bag</option>
                    <option value="ingredient">Bahan Baku (Susu/Gula Aren)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Nama Item / Bahan:</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Stok Awal:</label>
                  <input
                    type="number"
                    required
                    value={newItem.current_stock}
                    onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Satuan:</label>
                  <input
                    type="text"
                    required
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                    placeholder="pcs / grams / bottles"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Batas Minimum:</label>
                  <input
                    type="number"
                    required
                    value={newItem.min_threshold}
                    onChange={(e) => setNewItem({ ...newItem, min_threshold: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Harga Pokok (IDR):</label>
                  <input
                    type="number"
                    required
                    value={newItem.cost_per_unit_idr}
                    onChange={(e) => setNewItem({ ...newItem, cost_per_unit_idr: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Lokasi Penyimpanan:</label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" size="sm" variant="outline" onClick={() => setShowAddModal(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Simpan Item
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Inventory Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveItem}
            className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Edit Item Inventaris</h3>
                <p className="text-xs text-muted-foreground">{editingItem.name} ({editingItem.code})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Kode Barang:</label>
                  <input
                    type="text"
                    required
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Kategori:</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  >
                    <option value="green_beans">Green Beans (Biji Mentah)</option>
                    <option value="packaging_bottle">Kemasan: Botol Kale</option>
                    <option value="packaging_can">Kemasan: Pet Can</option>
                    <option value="packaging_pouch">Kemasan: Pouch / Bag</option>
                    <option value="ingredient">Bahan Baku & Sirup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Nama Barang / Deskripsi:</label>
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
                  <label className="font-semibold text-foreground">Stok Saat Ini:</label>
                  <input
                    type="number"
                    required
                    value={editingItem.current_stock}
                    onChange={(e) => setEditingItem({ ...editingItem, current_stock: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Satuan:</label>
                  <input
                    type="text"
                    required
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Ambang Batas Minimum (Alert):</label>
                  <input
                    type="number"
                    required
                    value={editingItem.min_threshold}
                    onChange={(e) => setEditingItem({ ...editingItem, min_threshold: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Biaya per Satuan (COGS IDR):</label>
                  <input
                    type="number"
                    required
                    value={editingItem.cost_per_unit_idr}
                    onChange={(e) => setEditingItem({ ...editingItem, cost_per_unit_idr: Number(e.target.value) })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Lokasi Penyimpanan:</label>
                  <input
                    type="text"
                    value={editingItem.location}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Nomor Batch / Lot:</label>
                  <input
                    type="text"
                    value={editingItem.batch_number}
                    onChange={(e) => setEditingItem({ ...editingItem, batch_number: e.target.value })}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Edit Inventory Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleBulkEditSubmit}
            className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Edit Massal Inventaris</h3>
                <p className="text-xs text-muted-foreground">{selectedIds.length} item dipilih (atau semua)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkEdit(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Ubah Kategori (Opsional):</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                >
                  <option value="">-- Jangan Ubah Kategori --</option>
                  <option value="green_beans">Green Beans</option>
                  <option value="packaging_bottle">Botol Kale</option>
                  <option value="packaging_can">Pet Can</option>
                  <option value="packaging_pouch">Pouch / Bag</option>
                  <option value="ingredient">Bahan Baku</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Ubah Lokasi Gudang (Opsional):</label>
                <input
                  type="text"
                  value={bulkLocation}
                  onChange={(e) => setBulkLocation(e.target.value)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  placeholder="Contoh: Gudang Utama - Rak B2"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Ubah Ambang Batas Minimum (Opsional):</label>
                <input
                  type="number"
                  value={bulkThreshold}
                  onChange={(e) => setBulkThreshold(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  placeholder="Kosongkan jika tidak diubah"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" size="sm" variant="outline" onClick={() => setShowBulkEdit(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Terapkan ke {selectedIds.length} Item
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
