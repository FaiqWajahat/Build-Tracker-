"use client";

import { useState, useMemo } from "react";
import {
  TrendingDown, ShieldAlert, AlertCircle, Wrench,
  Search, Filter, Plus, FileDown, Eye, Trash2,
  DollarSign, Calendar, MapPin, User, X, Check, Loader2
} from "lucide-react";
import useContractorStore from "@/store/useContractorStore";
import useProjectStore from "@/store/useProjectStore";
import useUserStore from "@/store/useUserStore";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import Loader from "@/components/ui/Loader";
import { useCurrency } from "@/store/useSettingsStore";

const categoryStyles = {
  "Material Damage": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  "Safety Fine":     "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  "Cash Advance":    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  "Delay Penalty":   "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
};

export default function DeductionsPage() {
  const currency = useCurrency();
  const contractors = useContractorStore((s) => s.contractors);
  const deductions = useContractorStore((s) => s.deductions);
  const addDeduction = useContractorStore((s) => s.addDeduction);
  const deleteDeduction = useContractorStore((s) => s.deleteDeduction);
  const projects = useProjectStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loading = useContractorStore((s) => s.loading);
  const loaded = useContractorStore((s) => s.loaded);

  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";

  const [form, setForm] = useState({
    contractorId: "",
    site: "",
    amount: "",
    category: "Material Damage",
    date: new Date().toISOString().split("T")[0],
    approvedBy: "Site Manager",
    description: "",
  });

  const filteredDeductions = useMemo(() => {
    return deductions.filter(d => {
      const matchesSearch = 
        d.contractorName.toLowerCase().includes(search.toLowerCase()) || 
        d.site.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || d.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [deductions, search, categoryFilter]);

  const stats = useMemo(() => {
    const total = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const damage = deductions.filter(d => d.category === "Material Damage").reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const safety = deductions.filter(d => d.category === "Safety Fine").reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const advances = deductions.filter(d => d.category === "Cash Advance").reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    return { total, damage, safety, advances };
  }, [deductions]);

  const handleSave = () => {
    const contractor = contractors.find(c => c.id === form.contractorId);
    if (!contractor || !form.amount || !form.site) return;

    addDeduction({
      contractorId: form.contractorId,
      contractorName: contractor.name,
      site: form.site,
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      approvedBy: form.approvedBy,
      description: form.description,
    });

    // Reset form
    setForm({
      contractorId: "",
      site: "",
      amount: "",
      category: "Material Damage",
      date: new Date().toISOString().split("T")[0],
      approvedBy: "Site Manager",
      description: "",
    });
    setShowLogModal(false);
  };

  if (loading && !loaded && deductions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Deductions MTD", value: `${currency} ${stats.total.toLocaleString()}`, icon: TrendingDown, colorClass: "text-rose-600 bg-rose-500/10" },
          { label: "Material Damage Claims", value: `${currency} ${stats.damage.toLocaleString()}`, icon: Wrench, colorClass: "text-amber-600 bg-amber-500/10" },
          { label: "Safety Violations Fines", value: `${currency} ${stats.safety.toLocaleString()}`, icon: ShieldAlert, colorClass: "text-purple-600 bg-purple-500/10" },
          { label: "Advance Repayments", value: `${currency} ${stats.advances.toLocaleString()}`, icon: DollarSign, colorClass: "text-blue-600 bg-blue-500/10" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-card border border-border rounded-xl p-5 hover:shadow-xs transition-all duration-200 fade-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12.5px] font-semibold text-muted-foreground">{stat.label}</span>
                <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center ${stat.colorClass}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-xl font-extrabold text-foreground leading-none">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter and Action Header */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contractor name, site, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs outline-none cursor-pointer focus:border-ring"
          >
            <option value="All">All Categories</option>
            <option value="Material Damage">Material Damage</option>
            <option value="Safety Fine">Safety Fine</option>
            <option value="Cash Advance">Cash Advance</option>
            <option value="Delay Penalty">Delay Penalty</option>
          </select>

          {!isReadOnly && (
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Log Deduction
            </button>
          )}
        </div>
      </div>

      {/* Deductions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_2fr_1.5fr_1.2fr_1.5fr_1.2fr_1.5fr_1fr] px-6 py-3 bg-muted/40 border-b border-border text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Ref ID</span>
              <span>Deducted Entity</span>
              <span>Project Site</span>
              <span>Deduction ({currency})</span>
              <span>Category</span>
              <span>Date Logged</span>
              <span>Approved By</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table Rows */}
            {filteredDeductions.map((d, idx) => {
              const catClass = categoryStyles[d.category] || "bg-muted text-muted-foreground";
              return (
                <div
                  key={d.id}
                  className={`grid grid-cols-[1fr_2fr_1.5fr_1.2fr_1.5fr_1.2fr_1.5fr_1fr] px-6 py-3.5 items-center cursor-pointer transition-colors hover:bg-muted/30
                    ${idx < filteredDeductions.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  <span className="text-[12px] font-bold text-muted-foreground">{d.id}</span>
                  <span className="text-[13px] font-semibold text-foreground">{d.contractorName}</span>
                  <span className="text-[13px] text-foreground font-medium flex items-center gap-1">
                    <MapPin size={11} className="text-muted-foreground" />
                    {d.site}
                  </span>
                  <span className="text-[13px] font-bold text-rose-500">{currency} {d.amount?.toLocaleString()}</span>
                  <div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold ${catClass}`}>
                      {d.category}
                    </span>
                  </div>
                  <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} />
                    {d.date}
                  </span>
                  <span className="text-[12.5px] text-foreground font-medium flex items-center gap-1">
                    <User size={11} className="text-muted-foreground" />
                    {d.approvedBy}
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedDeduction(d)}
                      title="View Details"
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer border-none transition-colors"
                    >
                      <Eye size={12} />
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={() => setDeleteTarget(d)}
                        title="Delete Record"
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer border-none transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredDeductions.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No deduction records found matching the criteria.
          </div>
        )}
      </div>

      {/* Log Deduction Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Log Contractor Deduction</h3>
              <button onClick={() => setShowLogModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"><X size={15} /></button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Contractor</label>
                <select
                  value={form.contractorId}
                  onChange={(e) => setForm({ ...form, contractorId: e.target.value })}
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                >
                  <option value="">Select contractor...</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Project Site</label>
                <select
                  value={form.site}
                  onChange={(e) => setForm({ ...form, site: e.target.value })}
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                >
                  <option value="">Select project site...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Deduction Amount ({currency})</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 500"
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                  >
                    <option value="Material Damage">Material Damage</option>
                    <option value="Safety Fine">Safety Fine</option>
                    <option value="Cash Advance">Cash Advance</option>
                    <option value="Delay Penalty">Delay Penalty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Approved By</label>
                  <input
                    value={form.approvedBy}
                    onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                    placeholder="e.g. Project Manager"
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Description / Remarks</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide brief reason..."
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setShowLogModal(false)} className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!form.contractorId || !form.amount || !form.site || loading}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : "✓"} Log Deduction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deduction Detail View Modal */}
      {selectedDeduction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground">{selectedDeduction.id}</span>
                <h3 className="text-sm font-bold text-foreground">Deduction Details</h3>
              </div>
              <button onClick={() => setSelectedDeduction(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"><X size={15} /></button>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Contractor</span>
                <span className="font-bold text-foreground">{selectedDeduction.contractorName}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Category</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryStyles[selectedDeduction.category] || ""}`}>
                  {selectedDeduction.category}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Project Site</span>
                <span className="font-medium text-foreground">{selectedDeduction.site}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Date Logged</span>
                <span className="text-foreground">{selectedDeduction.date}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Approved By</span>
                <span className="font-medium text-foreground">{selectedDeduction.approvedBy}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground font-bold">Amount</span>
                <span className="font-extrabold text-rose-500 text-sm">{currency} {selectedDeduction.amount?.toLocaleString()}</span>
              </div>
              <div className="pt-1.5">
                <span className="text-muted-foreground block mb-1">Description / Remarks</span>
                <p className="p-3 bg-muted/40 border border-border/60 rounded-xl text-foreground text-[11px] leading-relaxed font-medium">
                  {selectedDeduction.description}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedDeduction(null)} className="px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteDeduction(deleteTarget.id);
            setDeleteTarget(null);
          }}
          title="Delete Deduction"
          description="Are you sure you want to delete this deduction? This action will permanently remove it from the contractor's ledger."
          itemName={`${deleteTarget.contractorName} - ${currency} ${deleteTarget.amount?.toLocaleString()}`}
        />
      )}
    </div>
  );
}
