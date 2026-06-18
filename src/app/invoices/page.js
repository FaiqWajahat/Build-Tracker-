"use client";

import { useState } from "react";
import {
  FileText, CheckCircle2, AlertTriangle, ShieldAlert,
  Search, Filter, Plus, FileDown, Eye, Send,
  DollarSign, Calendar, MapPin
} from "lucide-react";

const initialInvoices = [
  { id: "INV-0034", client: "Al-Rashid Co.", project: "Tower Block A", amount: "14,200", issued: "June 01, 2026", due: "June 21, 2026", status: "Overdue" },
  { id: "INV-0033", client: "Ahmed Group", project: "Villa Complex B", amount: "42,500", issued: "June 10, 2026", due: "July 10, 2026", status: "Pending" },
  { id: "INV-0032", client: "RetailPros", project: "Mall Extension", amount: "185,000", issued: "May 15, 2026", due: "June 15, 2026", status: "Paid" },
  { id: "INV-0031", client: "LogiPak", project: "Warehouse D", amount: "62,000", issued: "May 25, 2026", due: "June 25, 2026", status: "Paid" },
  { id: "INV-0030", client: "Al-Rashid Co.", project: "Tower Block A", amount: "115,000", issued: "May 01, 2026", due: "June 01, 2026", status: "Paid" },
  { id: "INV-0029", client: "FinCenter", project: "Office Tower E", amount: "280,000", issued: "June 12, 2026", due: "July 12, 2026", status: "Draft" },
];

const statusStyles = {
  "Paid":    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  "Pending": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  "Overdue": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  "Draft":   "bg-muted text-muted-foreground border border-border",
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredInvoices = initialInvoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(search.toLowerCase()) || 
                          inv.client.toLowerCase().includes(search.toLowerCase()) ||
                          inv.project.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = initialInvoices.reduce((sum, inv) => sum + (inv.status !== "Draft" ? parseInt(inv.amount.replace(/,/g, "")) : 0), 0);
  const totalOutstanding = initialInvoices.reduce((sum, inv) => sum + (inv.status === "Pending" || inv.status === "Overdue" ? parseInt(inv.amount.replace(/,/g, "")) : 0), 0);
  const totalPaid = initialInvoices.reduce((sum, inv) => sum + (inv.status === "Paid" ? parseInt(inv.amount.replace(/,/g, "")) : 0), 0);

  return (
    <div className="p-6 min-h-full">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Invoiced (MTD)", value: `SAR ${totalInvoiced.toLocaleString()}`, icon: FileText, colorClass: "text-blue-600 bg-blue-500/10" },
          { label: "Total Received Payments", value: `SAR ${totalPaid.toLocaleString()}`, icon: CheckCircle2, colorClass: "text-emerald-600 bg-emerald-500/10" },
          { label: "Outstanding Receivables", value: `SAR ${totalOutstanding.toLocaleString()}`, icon: AlertTriangle, colorClass: "text-amber-600 bg-amber-500/10" },
          { label: "Overdue Invoices", value: "SAR 14,200", icon: ShieldAlert, colorClass: "text-rose-600 bg-rose-500/10" },
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
            placeholder="Search invoice ID, client, project..."
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
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Draft">Draft</option>
          </select>

          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer">
            <Plus size={14} /> New Invoice
          </button>
        </div>
      </div>

      {/* Invoice Register Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_2fr_1.8fr_1.2fr_1.2fr_1.2fr_1fr_1fr] px-6 py-3 bg-muted/40 border-b border-border text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Invoice ID</span>
              <span>Client</span>
              <span>Project</span>
              <span>Amount (SAR)</span>
              <span>Issued</span>
              <span>Due Date</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table Rows */}
            {filteredInvoices.map((inv, idx) => {
              const statusClass = statusStyles[inv.status] || "bg-muted text-muted-foreground";
              return (
                <div
                  key={inv.id}
                  className={`grid grid-cols-[1fr_2fr_1.8fr_1.2fr_1.2fr_1.2fr_1fr_1fr] px-6 py-3.5 items-center cursor-pointer transition-colors hover:bg-muted/30
                    ${idx < filteredInvoices.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  <span className="text-[12px] font-bold text-primary hover:underline">{inv.id}</span>
                  <span className="text-[13px] font-semibold text-foreground">{inv.client}</span>
                  <span className="text-[13px] text-foreground font-medium flex items-center gap-1">
                    <MapPin size={11} className="text-muted-foreground" />
                    {inv.project}
                  </span>
                  <span className="text-[13px] font-bold text-foreground">SAR {inv.amount}</span>
                  <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} />
                    {inv.issued}
                  </span>
                  <span className="text-[12px] text-foreground font-medium flex items-center gap-1">
                    <Calendar size={11} />
                    {inv.due}
                  </span>
                  <div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${statusClass}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button title="View Invoice" className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer border-none transition-colors">
                      <Eye size={12} />
                    </button>
                    <button title="Download PDF" className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer border-none transition-colors">
                      <FileDown size={12} />
                    </button>
                    {inv.status === "Overdue" && (
                      <button title="Send Reminder" className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 cursor-pointer border-none transition-colors animate-pulse">
                        <Send size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No invoices found matching the criteria.
          </div>
        )}
      </div>
    </div>
  );
}
