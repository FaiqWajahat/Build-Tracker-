"use client";

import { useState, useMemo } from "react";
import {
  Search, Plus, Star, MapPin, Mail, Phone,
  ChevronRight, HardHat, Award, DollarSign, Briefcase,
  X, TrendingDown, Activity
} from "lucide-react";
import useContractorStore from "@/store/useContractorStore";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore from "@/store/useProjectStore";
import { formatNumber } from "@/lib/utils";
import { useCurrency } from "@/store/useSettingsStore";

const statusColors = {
  "Active": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  "Under Review": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  "Suspended": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

const TRADES = [
  "All Trades",
  "Civil & Structural",
  "Mechanical & Electrical",
  "Architectural & Finishes",
  "Plumbing & Drainage",
  "Structural Steel",
  "MEP – Electrical",
  "MEP – Plumbing",
  "External Works",
];

const TRADE_ICONS = {
  "Civil & Structural": "🏗️",
  "Mechanical & Electrical": "⚙️",
  "Architectural & Finishes": "🎨",
  "Plumbing & Drainage": "🔧",
  "Structural Steel": "🔩",
  "MEP – Electrical": "⚡",
  "MEP – Plumbing": "🚰",
  "External Works": "🌿",
};

export default function ContractorDirectory({
  onSelectContractor,
  onAddContractor,
  isReadOnly,
}) {
  const currency = useCurrency();
  const contractors = useContractorStore((s) => s.contractors);
  const deductions = useContractorStore((s) => s.deductions);
  const payments = useContractorStore((s) => s.payments);
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);
  const projects = useProjectStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tradeFilter, setTradeFilter] = useState("All Trades");

  const getStats = (c) => {
    const subcontracts = allAssignments.filter(
      (a) => a.assigneeId === c.id || a.assigneeName?.toLowerCase() === c.name?.toLowerCase()
    );
    let totalSubcontractVal = 0;
    let totalEarnedVal = 0;
    subcontracts.forEach((a) => {
      const logs = allLogs.filter((l) => l.assignmentId === a.id);
      const totalQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)
        : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)
        : a.totalQty || 0;
      const doneQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (u.done || 0), 0)
        : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.done || 0), 0)
        : logs.reduce((s, l) => s + (l.qtyCompleted || 0), 0);
      totalSubcontractVal += totalQty * (a.subRate || 0);
      totalEarnedVal += doneQty * (a.subRate || 0);
    });
    const contractorDeductions = deductions.filter(
      (d) => d.contractorId === c.id || d.contractorName?.toLowerCase() === c.name?.toLowerCase()
    );
    const totalDeductions = contractorDeductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const contractorPayments = payments.filter(
      (p) => p.subcontractor?.toLowerCase() === c.name?.toLowerCase()
    );
    const totalPaidMTD = contractorPayments.filter((p) => p.status === "Cleared").reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const outstandingLiability = Math.max(0, totalEarnedVal - totalDeductions - totalPaidMTD);
    const uniqueProjects = [...new Set(subcontracts.map((a) => a.projectId))];
    return { subcontracts, totalSubcontractVal, totalEarnedVal, totalDeductions, totalPaidMTD, outstandingLiability, uniqueProjects };
  };

  const enriched = useMemo(() => contractors.map((c) => ({ ...c, ...getStats(c) })), [contractors, allAssignments, allLogs, deductions, payments]);

  const filtered = useMemo(() => enriched.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.trade.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchTrade = tradeFilter === "All Trades" || c.trade === tradeFilter;
    return matchSearch && matchStatus && matchTrade;
  }), [enriched, search, statusFilter, tradeFilter]);

  const totalLiability = enriched.reduce((s, c) => s + c.outstandingLiability, 0);
  const highRated = contractors.filter((c) => c.rating >= 4.5).length;
  const totalScopes = allAssignments.filter((a) => a.assigneeType === "contractor").length;

  return (
    <div className="p-6 space-y-5 min-h-full">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Contractors", value: contractors.length, icon: HardHat, cls: "text-blue-600 bg-blue-500/10", sub: "registered partners" },
          { label: "High Rated (4.5★+)", value: highRated, icon: Award, cls: "text-emerald-600 bg-emerald-500/10", sub: "top performers" },
          { label: "Outstanding Liability", value: `${currency} ${formatNumber(totalLiability)}`, icon: DollarSign, cls: "text-amber-600 bg-amber-500/10", sub: "net payable balance" },
          { label: "Active Subcontracts", value: `${totalScopes}`, icon: Briefcase, cls: "text-purple-600 bg-purple-500/10", sub: "scope assignments" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all duration-200 fade-up du-${i + 1}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{stat.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.cls}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filters row */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, trade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted text-foreground text-xs rounded-xl border border-border outline-none focus:border-ring transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Review">Under Review</option>
          <option value="Suspended">Suspended</option>
        </select>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none cursor-pointer"
        >
          {TRADES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {!isReadOnly && (
          <button
            onClick={onAddContractor}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer whitespace-nowrap shadow-sm"
          >
            <Plus size={13} /> Add Contractor
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c, idx) => {
          const completionPct = c.totalSubcontractVal > 0 ? Math.round((c.totalEarnedVal / c.totalSubcontractVal) * 100) : 0;
          const tradeIcon = TRADE_ICONS[c.trade] || "🏢";
          return (
            <div
              key={c.id}
              className={`bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col gap-4 fade-up du-${Math.min(idx + 1, 9)}`}
            >
              {/* Top: avatar + name + status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0 border border-primary/20">
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground leading-tight">{c.name}</h3>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span>{tradeIcon}</span> {c.trade}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[c.status] || ""}`}>
                    {c.status}
                  </span>
                  <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Star size={10} fill="currentColor" /> {c.rating}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-[10px]">
                  <span className="font-bold text-muted-foreground uppercase tracking-wide">Overall Completion</span>
                  <span className={`font-black ${completionPct >= 80 ? "text-emerald-500" : completionPct >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                    {completionPct}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${completionPct >= 80 ? "bg-emerald-500" : completionPct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>

              {/* Financial summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/40 rounded-xl p-2.5 border border-border/50">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground mb-0.5">Contract</p>
                  <p className="text-[11px] font-black text-foreground">{currency} {formatNumber(c.totalSubcontractVal)}</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-2.5 border border-border/50">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground mb-0.5">Earned</p>
                  <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{currency} {formatNumber(c.totalEarnedVal)}</p>
                </div>
                <div className="bg-amber-500/5 rounded-xl p-2.5 border border-amber-500/20">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground mb-0.5">Payable</p>
                  <p className="text-[11px] font-black text-amber-600 dark:text-amber-400">{currency} {formatNumber(c.outstandingLiability)}</p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase size={11} /> {c.subcontracts.length} scope{c.subcontracts.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {c.uniqueProjects.length} project{c.uniqueProjects.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Activity size={11} /> {c.subcontracts.filter((a) => {
                    const total = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + u.qty, 0)
                      : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + p.qty, 0) : a.totalQty;
                    const done = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + u.done, 0)
                      : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + p.done, 0) : 0;
                    return done < total;
                  }).length} active
                </span>
              </div>

              {/* Bottom: contacts + CTA */}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {c.email && (
                    <a href={`mailto:${c.email}`} title={c.email}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Mail size={12} />
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} title={c.phone}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Phone size={12} />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => onSelectContractor(c)}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  View Profile <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card border border-border rounded-2xl">
            <HardHat size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No contractors found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
