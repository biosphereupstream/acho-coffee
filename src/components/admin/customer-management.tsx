"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  CheckSquare, 
  Square, 
  Send, 
  Tag, 
  Edit, 
  X, 
  Check, 
  RefreshCw, 
  Phone, 
  Mail, 
  ShieldCheck,
  Award,
  Sparkles,
  MessageCircle,
  Copy,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_brew: string;
  loyalty_tier: string;
  total_orders: number;
  total_spent_idr: number;
  tags: string[];
  notes: string;
  is_active: boolean;
  created_at: string;
  last_order_at?: string;
}

interface PromotionBroadcast {
  id: string;
  promo_code: string;
  title: string;
  discount_percent: number;
  recipients_count: number;
  channel: string;
  message_preview: string;
  status: string;
  sent_at: string;
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Bulk Edit Modal
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkTier, setBulkTier] = useState("b2b_silver");
  const [bulkTag, setBulkTag] = useState("");

  // Send Promotion Modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoTitle, setPromoTitle] = useState("Promo Spesial Mitra ACHO");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [channel, setChannel] = useState<"whatsapp" | "email" | "both">("whatsapp");
  const [customMsg, setCustomMsg] = useState("");
  const [validUntil, setValidUntil] = useState("30 September 2026");
  const [sendingPromo, setSendingPromo] = useState(false);
  const [promoResult, setPromoResult] = useState<any | null>(null);

  // Broadcasts History Modal
  const [showBroadcasts, setShowBroadcasts] = useState(false);
  const [broadcasts, setBroadcasts] = useState<PromotionBroadcast[]>([]);

  // Add Single Customer Modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    email: "",
    phone: "",
    preferred_brew: "V60 / Pour Over",
    loyalty_tier: "retail",
    notes: "",
    tags: ["retail"],
  });

  // Edit Single Customer
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  async function fetchCustomers() {
    setLoading(true);
    try {
      let url = `/api/backend/customers?search=${encodeURIComponent(search)}`;
      if (tierFilter !== "all") url += `&tier=${tierFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load customers");
      const json = await res.json();
      setCustomers(json.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, [tierFilter]);

  function handleSelectAllToggle() {
    if (selectAll) {
      setSelectAll(false);
      setSelectedIds([]);
    } else {
      setSelectAll(true);
      setSelectedIds(customers.map((c) => c.id));
    }
  }

  function handleSelectCustomer(id: string) {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      setSelectedIds(next);
      setSelectAll(next.length === customers.length);
    } else {
      const next = [...selectedIds, id];
      setSelectedIds(next);
      setSelectAll(next.length === customers.length);
    }
  }

  async function handleBulkEditSubmit() {
    try {
      const res = await fetch("/api/backend/customers/bulk-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select_all: selectAll,
          customer_ids: selectedIds,
          action: "set_tier",
          set_tier: bulkTier,
        }),
      });
      if (!res.ok) throw new Error("Gagal update tier");

      if (bulkTag.trim() !== "") {
        await fetch("/api/backend/customers/bulk-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select_all: selectAll,
            customer_ids: selectedIds,
            action: "add_tag",
            tag: bulkTag.trim(),
          }),
        });
      }

      setShowBulkEdit(false);
      setSelectedIds([]);
      setSelectAll(false);
      await fetchCustomers();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleSendPromotion(e: React.FormEvent) {
    e.preventDefault();
    setSendingPromo(true);
    setPromoResult(null);

    // Enforce max 10% for B2B
    let finalDiscount = discountPercent;
    if (tierFilter.includes("b2b") && finalDiscount > 10) {
      finalDiscount = 10;
      setDiscountPercent(10);
    }

    try {
      const res = await fetch("/api/backend/customers/send-promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select_all: selectAll,
          customer_ids: selectedIds,
          tier_filter: tierFilter !== "all" ? tierFilter : undefined,
          promo_title: promoTitle,
          promo_code: promoCode,
          discount_percent: finalDiscount,
          channel: channel,
          message_template: customMsg,
          valid_until: validUntil,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengirim promosi");
      setPromoResult(json);
    } catch (err) {
      alert("Error: " + String(err));
    } finally {
      setSendingPromo(false);
    }
  }

  async function fetchBroadcasts() {
    try {
      const res = await fetch("/api/backend/customers/promotions");
      if (!res.ok) throw new Error("Gagal load riwayat siaran");
      const json = await res.json();
      setBroadcasts(json.promotions || []);
      setShowBroadcasts(true);
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      const res = await fetch(`/api/backend/customers/${editingCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      });
      if (!res.ok) throw new Error("Gagal update profil pelanggan");
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleDeleteCustomer(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus pelanggan ini?")) return;
    try {
      const res = await fetch(`/api/backend/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus pelanggan");
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      await fetchCustomers();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleBulkDeleteCustomers() {
    const count = selectAll ? customers.length : selectedIds.length;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${count} pelanggan terpilih?`)) return;
    try {
      const res = await fetch("/api/backend/customers/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select_all: selectAll,
          customer_ids: selectedIds,
        }),
      });
      if (!res.ok) throw new Error("Gagal menghapus pelanggan massal");
      setSelectedIds([]);
      setSelectAll(false);
      await fetchCustomers();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  async function handleAddCustomerSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/backend/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error("Gagal menambahkan pelanggan");
      setShowAddCustomer(false);
      setNewCustomer({
        full_name: "",
        email: "",
        phone: "",
        preferred_brew: "V60 / Pour Over",
        loyalty_tier: "retail",
        notes: "",
        tags: ["retail"],
      });
      await fetchCustomers();
    } catch (err) {
      alert("Error: " + String(err));
    }
  }

  function formatIDR(val: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  }

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 backdrop-blur p-4 rounded-2xl border border-border/80">
        <div className="flex flex-wrap items-center gap-1 bg-secondary/80 p-1 rounded-xl">
          <button
            onClick={() => setTierFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tierFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua ({customers.length})
          </button>
          <button
            onClick={() => setTierFilter("retail")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tierFilter === "retail" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Retail
          </button>
          <button
            onClick={() => setTierFilter("b2b_bronze")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tierFilter === "b2b_bronze" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            B2B Bronze
          </button>
          <button
            onClick={() => setTierFilter("b2b_silver")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tierFilter === "b2b_silver" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            B2B Silver
          </button>
          <button
            onClick={() => setTierFilter("b2b_gold")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tierFilter === "b2b_gold" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            B2B Gold (Max 10%)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama, email, no HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchCustomers()}
              className="w-full bg-background/80 border border-input rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button size="sm" variant="outline" onClick={fetchBroadcasts} className="gap-1.5 text-xs shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-gold-deep" /> Riwayat Promo
          </Button>

          <Button size="sm" onClick={() => setShowAddCustomer(true)} className="gap-1.5 text-xs shrink-0 bg-primary text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> Tambah Pelanggan
          </Button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedIds.length} pelanggan dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setPromoCode("");
                setPromoResult(null);
                setShowPromoModal(true);
              }}
              className="text-xs font-bold gap-1 bg-gold text-amber-950 hover:bg-gold-light"
            >
              <Send className="h-3.5 w-3.5" /> Kirim Promosi
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowBulkEdit(true)}
              className="text-xs font-bold gap-1"
            >
              <Edit className="h-3 w-3" /> Ubah Tier / Tag
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDeleteCustomers}
              className="text-xs font-bold gap-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Terpilih ({selectedIds.length})
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

      {/* Customer Table */}
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
                <th className="p-3">Pelanggan</th>
                <th className="p-3">Tier Loyalitas</th>
                <th className="p-3">Kontak & Seduh</th>
                <th className="p-3">Total Belanja</th>
                <th className="p-3">Tag</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-gold" />
                    Memuat pelanggan...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    Tidak ada pelanggan ditemukan
                  </td>
                </tr>
              ) : (
                customers.map((cust) => {
                  const isSelected = selectedIds.includes(cust.id);
                  const isB2B = cust.loyalty_tier.startsWith("b2b");
                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-accent/40 transition ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="p-3 text-center">
                        <button onClick={() => handleSelectCustomer(cust.id)}>
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-foreground text-xs">{cust.full_name}</p>
                        <p className="text-[11px] text-muted-foreground">{cust.email}</p>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          cust.loyalty_tier === "b2b_gold"
                            ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                            : isB2B
                            ? "bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950 dark:text-blue-200"
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          <Award className="h-3 w-3" />
                          {cust.loyalty_tier.toUpperCase().replace("_", " ")}
                        </span>
                        {isB2B && (
                          <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                            Diskon Max 10%
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-[11px] text-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{cust.phone}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">{cust.preferred_brew}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-foreground">{formatIDR(cust.total_spent_idr)}</p>
                        <p className="text-[10px] text-muted-foreground">{cust.total_orders} pesanan</p>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {cust.tags.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-secondary text-muted-foreground rounded text-[9px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCustomer(cust)}
                            className="h-7 w-7 p-0"
                            title="Edit Pelanggan"
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCustomer(cust.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Hapus Pelanggan"
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

      {/* Send Promotion Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleSendPromotion}
            className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-gold-deep" />
                <h3 className="font-bold text-base text-foreground">
                  Kirim Promosi ke {selectedIds.length} Pelanggan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* B2B Constraint Notice */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                Aturan Bisnis: Diskon B2B Maksimal 10%
              </p>
              <p className="mt-0.5 text-[11px] opacity-80">
                Sistem secara otomatis memvalidasi bahwa pelanggan kategori B2B (Mitra Cafe/Grosir) menerima diskon maksimal 10% untuk menjaga margin roastery.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Judul Promo / Kampanye:</label>
                <input
                  type="text"
                  required
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Diskon (%):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={tierFilter.includes("b2b") ? 10 : 50}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {tierFilter.includes("b2b") ? "Maksimal 10% untuk B2B" : "Maksimal 50%"}
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Kode Voucher (Opsional):</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs font-mono uppercase"
                    placeholder="Auto: ACHO-XXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Saluran Pengiriman:</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  >
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="email">Email Transaksional</option>
                    <option value="both">WhatsApp & Email</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Masa Berlaku Hingga:</label>
                  <input
                    type="text"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Pesan Tambahan (Opsional):</label>
                <textarea
                  rows={2}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  placeholder="Contoh: Diskon khusus roasted beans 1kg dan botol cold brew untuk mitra cafe setia kami."
                />
              </div>

              {promoResult && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs space-y-2">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="h-4 w-4" /> {promoResult.message}
                  </p>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border font-mono text-[11px] whitespace-pre-wrap">
                    {promoResult.whatsapp_template}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" size="sm" variant="outline" onClick={() => setShowPromoModal(false)}>
                Tutup
              </Button>
              <Button type="submit" size="sm" disabled={sendingPromo} className="gap-1.5 font-bold">
                {sendingPromo ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Kirim Siaran Sekarang
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-bold text-base text-foreground">
                Ubah Tier & Tag ({selectedIds.length} Pelanggan)
              </h3>
              <button onClick={() => setShowBulkEdit(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Tetapkan Tier Loyalitas:</label>
                <select
                  value={bulkTier}
                  onChange={(e) => setBulkTier(e.target.value)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                >
                  <option value="retail">Retail (Regular)</option>
                  <option value="b2b_bronze">B2B Bronze</option>
                  <option value="b2b_silver">B2B Silver</option>
                  <option value="b2b_gold">B2B Gold</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Tambahkan Tag Baru (Opsional):</label>
                <input
                  type="text"
                  value={bulkTag}
                  onChange={(e) => setBulkTag(e.target.value)}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                  placeholder="Contoh: cafe-bandung / wholesale"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button size="sm" variant="outline" onClick={() => setShowBulkEdit(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleBulkEditSubmit} className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Terapkan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveCustomer}
            className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-bold text-base text-foreground">Edit Profil Pelanggan</h3>
              <button type="button" onClick={() => setEditingCustomer(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.full_name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, full_name: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">No. WhatsApp / Telepon:</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Tier Loyalitas:</label>
                <select
                  value={editingCustomer.loyalty_tier}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, loyalty_tier: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                >
                  <option value="retail">Retail (Regular)</option>
                  <option value="b2b_bronze">B2B Bronze</option>
                  <option value="b2b_silver">B2B Silver</option>
                  <option value="b2b_gold">B2B Gold</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Catatan Khusus:</label>
                <textarea
                  rows={2}
                  value={editingCustomer.notes}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingCustomer(null)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Simpan
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Broadcasts History Drawer */}
      {showBroadcasts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-deep" />
                <h3 className="font-bold text-base text-foreground">Riwayat Siaran Promosi</h3>
              </div>
              <button onClick={() => setShowBroadcasts(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border/40 text-xs">
              {broadcasts.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Belum ada promosi yang dikirim</p>
              ) : (
                broadcasts.map((b) => (
                  <div key={b.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground">{b.title}</p>
                      <span className="font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                        {b.promo_code} (-{b.discount_percent}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Terkirim ke {b.recipients_count} pelanggan via {b.channel.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(b.sent_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/50">
              <Button size="sm" variant="outline" onClick={() => setShowBroadcasts(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddCustomerSubmit}
            className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-base text-foreground">Tambah Pelanggan Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Pratama"
                  value={newCustomer.full_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Email:</label>
                <input
                  type="email"
                  required
                  placeholder="andi@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">No. WhatsApp / Telepon:</label>
                <input
                  type="text"
                  required
                  placeholder="08123456789"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Metode Seduh Favorit:</label>
                <input
                  type="text"
                  placeholder="V60, Espresso, French Press..."
                  value={newCustomer.preferred_brew}
                  onChange={(e) => setNewCustomer({ ...newCustomer, preferred_brew: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Tier Loyalitas:</label>
                <select
                  value={newCustomer.loyalty_tier}
                  onChange={(e) => setNewCustomer({ ...newCustomer, loyalty_tier: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                >
                  <option value="retail">Retail (Regular)</option>
                  <option value="b2b_bronze">B2B Bronze</option>
                  <option value="b2b_silver">B2B Silver</option>
                  <option value="b2b_gold">B2B Gold (Max Diskon 10%)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Catatan Khusus:</label>
                <textarea
                  rows={2}
                  placeholder="Catatan profil pelanggan..."
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="w-full mt-1 bg-background border border-input rounded-xl p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" size="sm" variant="outline" onClick={() => setShowAddCustomer(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-bold">
                <Check className="h-3.5 w-3.5" /> Tambah Pelanggan
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
