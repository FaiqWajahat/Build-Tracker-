"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, CheckCircle2, AlertTriangle, ShieldAlert,
  Search, Plus, FileDown, Eye, Trash2, Clock,
  TrendingUp, DollarSign, Send, Sparkles
} from "lucide-react";
import useUserStore from "@/store/useUserStore";
import useInvoiceStore from "@/store/useInvoiceStore";
import { useCurrency } from "@/store/useSettingsStore";
import GenerateInvoiceModal from "@/components/invoices/GenerateInvoiceModal";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

const STATUS_CONFIG = {
  draft:     { label: "Draft",     cls: "bg-muted text-muted-foreground border border-border",                         icon: FileText  },
  submitted: { label: "Submitted", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",   icon: Send      },
  approved:  { label: "Approved",  cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20", icon: CheckCircle2 },
  paid:      { label: "Paid",      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20", icon: CheckCircle2 },
  overdue:   { label: "Overdue",   cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",   icon: ShieldAlert },
};

const TYPE_LABELS = {
  progress: "Progress",
  final:    "Final",
  variation:"Variation",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const router = useRouter();
  const currency = useCurrency();
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";

  const { invoices, loading, loaded, fetchInvoices, deleteInvoice, updateInvoice } = useInvoiceStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchInvoices(null, true);
  }, [fetchInvoices]);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchQ = !q || inv.id?.toLowerCase().includes(q) || inv.clientName?.toLowerCase().includes(q) || inv.projectName?.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || inv.status === statusFilter;
    return matchQ && matchS;
  });

  // Stats
  const totalInvoiced  = invoices.filter(i => i.status !== "draft").reduce((s, i) => s + (i.summary?.grandTotal || 0), 0);
  const totalPaid      = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.summary?.grandTotal || 0), 0);
  const totalOutstanding = invoices.filter(i => ["submitted","approved","overdue"].includes(i.status)).reduce((s, i) => s + (i.summary?.grandTotal || 0), 0);
  const totalOverdue   = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + (i.summary?.grandTotal || 0), 0);

  const handleStatusChange = async (inv, newStatus) => {
    if (updatingId) return;
    setUpdatingId(inv.id);
    try {
      await updateInvoice(inv.id, { status: newStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  const fmt = (n) => `${currency} ${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-6 min-h-full">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Invoiced (MTD)", value: fmt(totalInvoiced),    icon: FileText,    cls: "text-blue-600 bg-blue-500/10"     },
          { label: "Received Payments",    value: fmt(totalPaid),        icon: CheckCircle2,cls: "text-emerald-600 bg-emerald-500/10"},
          { label: "Outstanding",          value: fmt(totalOutstanding), icon: AlertTriangle,cls: "text-amber-600 bg-amber-500/10"  },
          { label: "Overdue",              value: fmt(totalOverdue),     icon: ShieldAlert, cls: "text-rose-600 bg-rose-500/10"     },
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all duration-200 fade-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-muted-foreground">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.cls}`}>
                  <Icon size={15} />
                </div>
              </div>
              <p className="text-xl font-extrabold text-foreground leading-none">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoice, client, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          {!isReadOnly && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles size={13} />
              Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        {loading && !loaded ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm">Loading invoices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <FileText size={22} className="opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">No invoices found</p>
              <p className="text-xs mt-1 opacity-70">
                {!isReadOnly ? "Click 'Generate Invoice' to create your first one." : "No invoices yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1.5fr_1.8fr_1.3fr_1.1fr_1.1fr_1fr_auto] px-5 py-3 bg-muted/40 border-b border-border text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Invoice #</span>
                <span>Client</span>
                <span>Project</span>
                <span>Grand Total</span>
                <span>Date</span>
                <span>Due Date</span>
                <span>Status</span>
                <span className="text-right pr-1">Actions</span>
              </div>

              {/* Rows */}
              {filtered.map((inv, idx) => {
                const scfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                const StatusIcon = scfg.icon;
                const isUpdating = updatingId === inv.id;
                return (
                  <div
                    key={inv.id}
                    className={`grid grid-cols-[1fr_1.5fr_1.8fr_1.3fr_1.1fr_1.1fr_1fr_auto] px-5 py-3.5 items-center transition-colors hover:bg-muted/20 cursor-pointer group
                      ${idx < filtered.length - 1 ? "border-b border-border/50" : ""}`}
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <div>
                      <span className="text-[12px] font-bold text-primary">{inv.id}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                        {TYPE_LABELS[inv.invoiceType] || inv.invoiceType}
                      </span>
                    </div>
                    <span className="text-[12.5px] font-semibold text-foreground truncate pr-3">{inv.clientName || "—"}</span>
                    <span className="text-[12.5px] text-foreground font-medium truncate pr-3">{inv.projectName || "—"}</span>
                    <span className="text-[13px] font-bold text-foreground">{fmt(inv.summary?.grandTotal)}</span>
                    <span className="text-[11.5px] text-muted-foreground">{fmtDate(inv.invoiceDate)}</span>
                    <span className={`text-[11.5px] font-medium ${inv.status === "overdue" ? "text-rose-500" : "text-foreground"}`}>
                      {fmtDate(inv.dueDate)}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv, e.target.value)}
                        disabled={isUpdating || isReadOnly}
                        className={`text-[10.5px] font-bold px-2 py-1 rounded-full border outline-none cursor-pointer transition-all disabled:opacity-50 ${scfg.cls}`}
                        style={{ backgroundImage: "none" }}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="View Invoice"
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={12} />
                      </button>
                      {!isReadOnly && inv.status === "draft" && (
                        <button
                          title="Delete Invoice"
                          onClick={() => setDeleteTarget(inv)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
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
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateInvoiceModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={(inv) => router.push(`/invoices/${inv.id}`)}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          itemName={deleteTarget.id}
          description="This action cannot be undone. Only draft invoices can be deleted."
          onConfirm={async () => {
            await deleteInvoice(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
