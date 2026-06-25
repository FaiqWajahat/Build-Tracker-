"use client";

import { useState, useMemo } from "react";
import {
  CreditCard, CheckCircle2, Clock, Ban,
  Search, Filter, Plus, FileDown, Check, X,
  DollarSign, Calendar, MapPin, Loader2, Trash2
} from "lucide-react";
import useUserStore from "@/store/useUserStore";
import useContractorStore from "@/store/useContractorStore";
import useProjectStore from "@/store/useProjectStore";
import { useCurrency } from "@/store/useSettingsStore";
import Loader from "@/components/ui/Loader";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

const statusStyles = {
  "Cleared":          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  "Pending Approval": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  "Rejected":         "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

export default function SubPaymentsPage() {
  const currency = useCurrency();
  const contractors = useContractorStore((s) => s.contractors);
  const payments = useContractorStore((s) => s.payments);
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";
  const addPayment = useContractorStore((s) => s.addPayment);
  const approvePayment = useContractorStore((s) => s.approvePayment);
  const rejectPayment = useContractorStore((s) => s.rejectPayment);
  const deletePayment = useContractorStore((s) => s.deletePayment);
  const projects = useProjectStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showLogModal, setShowLogModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loading = useContractorStore((s) => s.loading);
  const loaded = useContractorStore((s) => s.loaded);

  const [form, setForm] = useState({
    subcontractorId: "",
    project: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    channel: "Bank Transfer",
  });

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        p.subcontractor.toLowerCase().includes(search.toLowerCase()) || 
        p.project.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const stats = useMemo(() => {
    const totalDisbursed = payments.reduce((sum, p) => sum + (p.status === "Cleared" ? (Number(p.amount) || 0) : 0), 0);
    const pendingApprovals = payments.filter(p => p.status === "Pending Approval").length;
    const totalPendingVal = payments.reduce((sum, p) => sum + (p.status === "Pending Approval" ? (Number(p.amount) || 0) : 0), 0);
    return { totalDisbursed, pendingApprovals, totalPendingVal };
  }, [payments]);

  const handleSave = () => {
    const contractor = contractors.find(c => c.id === form.subcontractorId);
    if (!contractor || !form.amount || !form.project) return;

    addPayment({
      subcontractor: contractor.name,
      project: form.project,
      amount: Number(form.amount),
      date: form.date,
      channel: form.channel,
      status: "Pending Approval",
    });

    // Reset form
    setForm({
      subcontractorId: "",
      project: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      channel: "Bank Transfer",
    });
    setShowLogModal(false);
  };

  if (loading && !loaded && payments.length === 0) {
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
          { label: "Disbursed MTD", value: `${currency} ${stats.totalDisbursed.toLocaleString()}`, icon: CreditCard, colorClass: "text-emerald-600 bg-emerald-500/10" },
          { label: "Disbursed YTD (Est)", value: `${currency} 1.48M`, icon: DollarSign, colorClass: "text-blue-600 bg-blue-500/10" },
          { label: "Pending Sign-off", value: `${stats.pendingApprovals} Payments`, icon: Clock, colorClass: "text-amber-600 bg-amber-500/10" },
          { label: "Pending Release Val", value: `${currency} ${stats.totalPendingVal.toLocaleString()}`, icon: DollarSign, colorClass: "text-purple-600 bg-purple-500/10" },
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
            placeholder="Search subcontractor name, site, voucher ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs outline-none cursor-pointer focus:border-ring"
          >
            <option value="All">All Statuses</option>
            <option value="Cleared">Cleared</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Rejected">Rejected</option>
          </select>

          {!isReadOnly && (
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Sub Payments Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[1.2fr_2fr_1.8fr_1.2fr_1.2fr_1.2fr_1fr_1fr] px-6 py-3 bg-muted/40 border-b border-border text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Voucher ID</span>
              <span>Subcontractor</span>
              <span>Project Site</span>
              <span>Amount Released</span>
              <span>Payment Date</span>
              <span>Method Channel</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table Rows */}
            {filteredPayments.map((p, idx) => {
              const statusClass = statusStyles[p.status] || "bg-muted text-muted-foreground";
              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-[1.2fr_2fr_1.8fr_1.2fr_1.2fr_1.2fr_1fr_1fr] px-6 py-3.5 items-center cursor-pointer transition-colors hover:bg-muted/30
                    ${idx < filteredPayments.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  <span className="text-[12px] font-bold text-muted-foreground">{p.id}</span>
                  <span className="text-[13px] font-semibold text-foreground">{p.subcontractor}</span>
                  <span className="text-[13px] text-foreground font-medium flex items-center gap-1">
                    <MapPin size={11} className="text-muted-foreground" />
                    {p.project}
                  </span>
                  <span className="text-[13px] font-bold text-foreground">{currency} {p.amount?.toLocaleString()}</span>
                  <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} />
                    {p.date}
                  </span>
                  <span className="text-[12.5px] text-foreground font-medium">{p.channel}</span>
                  <div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${statusClass}`}>
                      {p.status}
                    </span>
                  </div>
                  {!isReadOnly && (
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "Pending Approval" ? (
                        <>
                          <button
                            onClick={() => approvePayment(p.id)}
                            disabled={loading}
                            title="Approve Payment"
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => rejectPayment(p.id)}
                            disabled={loading}
                            title="Reject Payment"
                            className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Ban size={12} />
                          </button>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-[10px] italic">Processed</span>
                      )}
                      <button
                        onClick={() => setDeleteTarget(p)}
                        disabled={loading}
                        title="Delete Payment"
                        className="p-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer border-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {filteredPayments.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No subcontractor payments found matching the criteria.
          </div>
        )}
      </div>

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Record Subcontractor Payment</h3>
              <button onClick={() => setShowLogModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"><X size={15} /></button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Subcontractor</label>
                <select
                  value={form.subcontractorId}
                  onChange={(e) => setForm({ ...form, subcontractorId: e.target.value })}
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                >
                  <option value="">Select subcontractor...</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Project Site</label>
                <select
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                >
                  <option value="">Select project site...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Amount ({currency})</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 50000"
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Method Channel</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Corporate Check">Corporate Check</option>
                    <option value="Cash Account">Cash Account</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setShowLogModal(false)} className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!form.subcontractorId || !form.amount || !form.project || loading}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : "✓"} 
                Record Payment
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
            deletePayment(deleteTarget.id);
            setDeleteTarget(null);
          }}
          title="Delete Sub Payment"
          description="Are you sure you want to delete this payment record? This action cannot be undone."
          itemName={`${deleteTarget.subcontractor} - ${currency} ${deleteTarget.amount?.toLocaleString()}`}
        />
      )}
    </div>
  );
}
