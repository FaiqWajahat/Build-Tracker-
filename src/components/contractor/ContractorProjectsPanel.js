"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft, Building2, MapPin, Calendar, TrendingDown,
  Plus, Star, Mail, Phone, Briefcase, DollarSign,
  CheckCircle2, CreditCard, ShieldAlert, ChevronRight,
  Clock, Layers, Activity, Target, X
} from "lucide-react";
import useContractorStore from "@/store/useContractorStore";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore from "@/store/useProjectStore";
import { formatNumber } from "@/lib/utils";
import { useCurrency } from "@/store/useSettingsStore";
import AssignScopeModal from "./AssignScopeModal";

const statusColors = {
  "Active": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  "Under Review": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  "Suspended": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

const projectStatusCls = {
  "On Track": "text-emerald-500",
  "Delayed": "text-rose-500",
  "At Risk": "text-amber-500",
  "Completed": "text-blue-500",
};

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

export default function ContractorProjectsPanel({ contractor, onBack, onSelectProject }) {
  const currency = useCurrency();
  const deductions = useContractorStore((s) => s.deductions);
  const payments = useContractorStore((s) => s.payments);
  const addDeduction = useContractorStore((s) => s.addDeduction);
  const addPayment = useContractorStore((s) => s.addPayment);
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);
  const projects = useProjectStore((s) => s.projects);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("projects"); // "projects" or "payable"

  const [deductionForm, setDeductionForm] = useState({
    site: "", amount: "", category: "Material Damage",
    date: new Date().toISOString().split("T")[0], approvedBy: "", description: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    project: "", amount: "", date: new Date().toISOString().split("T")[0], channel: "Bank Transfer",
  });

  // All assignments for this contractor
  const myAssignments = useMemo(() => allAssignments.filter(
    (a) => a.assigneeId === contractor.id || a.assigneeName?.toLowerCase() === contractor.name?.toLowerCase()
  ), [allAssignments, contractor]);

  // Group by project
  const projectGroups = useMemo(() => {
    const groups = {};
    myAssignments.forEach((a) => {
      if (!groups[a.projectId]) {
        const proj = projects.find((p) => p.id === a.projectId);
        groups[a.projectId] = {
          projectId: a.projectId,
          project: proj,
          assignments: [],
          totalContractVal: 0,
          totalEarnedVal: 0,
          totalDeductions: 0,
          totalPaid: 0,
        };
      }
      const logs = allLogs.filter((l) => l.assignmentId === a.id);
      const totalQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)
        : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)
        : a.totalQty || 0;
      const doneQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (u.done || 0), 0)
        : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.done || 0), 0)
        : logs.reduce((s, l) => s + (l.qtyCompleted || 0), 0);
      const contractVal = totalQty * (a.subRate || 0);
      const earnedVal = doneQty * (a.subRate || 0);
      groups[a.projectId].assignments.push({ ...a, totalQty, doneQty, contractVal, earnedVal, progressPct: pct(doneQty, totalQty) });
      groups[a.projectId].totalContractVal += contractVal;
      groups[a.projectId].totalEarnedVal += earnedVal;
    });

    // add deductions and payments per project
    Object.values(groups).forEach((g) => {
      const projName = g.project?.name || "";
      g.totalDeductions = deductions.filter(
        (d) => (d.contractorId === contractor.id || d.contractorName?.toLowerCase() === contractor.name?.toLowerCase()) && d.site === projName
      ).reduce((s, d) => s + (Number(d.amount) || 0), 0);
      g.totalPaid = payments.filter(
        (p) => p.subcontractor?.toLowerCase() === contractor.name?.toLowerCase() && p.project === projName && p.status === "Cleared"
      ).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      g.netPayable = Math.max(0, g.totalEarnedVal - g.totalDeductions - g.totalPaid);
    });

    return Object.values(groups);
  }, [myAssignments, allLogs, deductions, payments, projects, contractor]);

  const detailedAssignments = useMemo(() => {
    return projectGroups.flatMap((g) => g.assignments);
  }, [projectGroups]);

  // Overall contractor financials
  const myDeductions = useMemo(() => deductions.filter(
    (d) => d.contractorId === contractor.id || d.contractorName?.toLowerCase() === contractor.name?.toLowerCase()
  ), [deductions, contractor]);

  const myPayments = useMemo(() => payments.filter(
    (p) => p.subcontractor?.toLowerCase() === contractor.name?.toLowerCase()
  ), [payments, contractor]);

  const totalContractVal = projectGroups.reduce((s, g) => s + g.totalContractVal, 0);
  const totalEarnedVal = projectGroups.reduce((s, g) => s + g.totalEarnedVal, 0);
  const totalDeductions = myDeductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const totalPaid = myPayments.filter((p) => p.status === "Cleared").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const netPayable = Math.max(0, totalEarnedVal - totalDeductions - totalPaid);
  const overallPct = totalContractVal > 0 ? Math.round((totalEarnedVal / totalContractVal) * 100) : 0;

  const handleSaveDeduction = () => {
    if (!deductionForm.amount || !deductionForm.site) return;
    addDeduction({ contractorId: contractor.id, contractorName: contractor.name, ...deductionForm, amount: Number(deductionForm.amount) });
    setDeductionForm({ site: "", amount: "", category: "Material Damage", date: new Date().toISOString().split("T")[0], approvedBy: "", description: "" });
    setShowDeductionModal(false);
  };

  const handleSavePayment = () => {
    if (!paymentForm.amount || !paymentForm.project) return;
    addPayment({ subcontractor: contractor.name, ...paymentForm, amount: Number(paymentForm.amount), status: "Cleared" });
    setPaymentForm({ project: "", amount: "", date: new Date().toISOString().split("T")[0], channel: "Bank Transfer" });
    setShowPaymentModal(false);
  };

  return (
    <div className="p-6 space-y-5 min-h-full animate-in fade-in duration-200">
      {/* Breadcrumb nav */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer font-semibold">
          <ArrowLeft size={13} /> Contractors
        </button>
        <span>/</span>
        <span className="text-foreground font-bold">{contractor.name}</span>
      </div>

      {/* Contractor header card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 shrink-0">
              {contractor.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-foreground">{contractor.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${statusColors[contractor.status] || ""}`}>
                  {contractor.status}
                </span>
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Star size={10} fill="currentColor" /> {contractor.rating}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 font-medium">{contractor.trade}</p>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                {contractor.email && <span className="flex items-center gap-1"><Mail size={11} /> {contractor.email}</span>}
                {contractor.phone && <span className="flex items-center gap-1"><Phone size={11} /> {contractor.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowDeductionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl cursor-pointer transition-all"
            >
              <TrendingDown size={13} /> Log Deduction
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer transition-all"
            >
              <CreditCard size={13} /> Disburse Payment
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 cursor-pointer transition-all"
            >
              <Plus size={13} /> Assign Scope
            </button>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-muted-foreground uppercase tracking-wide">Overall Portfolio Completion</span>
            <span className={`font-black ${overallPct >= 80 ? "text-emerald-500" : overallPct >= 50 ? "text-amber-500" : "text-rose-500"}`}>
              {overallPct}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${overallPct >= 80 ? "bg-emerald-500" : overallPct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Financial KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Contract Value", value: `${currency} ${formatNumber(totalContractVal)}`, sub: `${myAssignments.length} scopes`, cls: "text-blue-600 bg-blue-500/10", icon: Briefcase },
          { label: "Total Earned", value: `${currency} ${formatNumber(totalEarnedVal)}`, sub: `${overallPct}% completed`, cls: "text-emerald-600 bg-emerald-500/10", icon: CheckCircle2 },
          { label: "Total Deductions", value: `${currency} ${formatNumber(totalDeductions)}`, sub: "all categories", cls: "text-rose-600 bg-rose-500/10", icon: ShieldAlert },
          { label: "Total Disbursed", value: `${currency} ${formatNumber(totalPaid)}`, sub: "cleared payments", cls: "text-purple-600 bg-purple-500/10", icon: CreditCard },
          { label: "Net Payable", value: `${currency} ${formatNumber(netPayable)}`, sub: "outstanding balance", cls: "text-amber-600 bg-amber-500/10", icon: DollarSign, highlight: true },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`bg-card border rounded-2xl p-4 transition-all ${card.highlight ? "border-amber-500/30 ring-1 ring-amber-500/10" : "border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.cls}`}><Icon size={13} /></div>
              </div>
              <p className={`text-[15px] font-black leading-none ${card.highlight ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{card.value}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "projects"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 size={14} />
          Project Groups ({projectGroups.length})
        </button>
        <button
          onClick={() => setActiveTab("payable")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "payable"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign size={14} />
          Net Payable & Reconciliation Ledger
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "projects" ? (
        <div>
          <h3 className="text-sm font-black text-foreground mb-3 mt-4 flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            Assigned Projects
            {assignSuccess && (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ✓ Assignment created!
              </span>
            )}
          </h3>

          {projectGroups.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl py-16 text-center">
              <Layers size={32} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">No project assignments yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Use the &quot;Assign Scope&quot; button to assign this contractor to a project</p>
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer"
              >
                <Plus size={13} /> Assign First Scope
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projectGroups.map((g, idx) => {
                const projectPct = g.totalContractVal > 0 ? Math.round((g.totalEarnedVal / g.totalContractVal) * 100) : 0;
                const statusCls = projectStatusCls[g.project?.status] || "text-muted-foreground";
                return (
                  <div
                    key={g.projectId}
                    className={`bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200 fade-up du-${Math.min(idx + 1, 9)}`}
                  >
                    <div className="p-5">
                      <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
                        {/* Left: project info */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-foreground text-[15px]">{g.project?.name || "Unknown Project"}</h4>
                              {g.project?.status && (
                                <span className={`text-[10px] font-bold ${statusCls}`}>● {g.project.status}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              {g.project?.location && <span className="flex items-center gap-1"><MapPin size={11} /> {g.project.location}</span>}
                              {g.project?.type && <span>{g.project.type}</span>}
                              {g.project?.pm && <span>PM: {g.project.pm}</span>}
                              <span className="font-semibold text-foreground">{g.assignments.length} scope{g.assignments.length !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: financials + CTA */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="bg-muted/40 rounded-xl p-3 border border-border/50 grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Contract</p>
                              <p className="font-black text-foreground">{currency} {formatNumber(g.totalContractVal)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Earned</p>
                              <p className="font-black text-emerald-600 dark:text-emerald-400">{currency} {formatNumber(g.totalEarnedVal)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Payable</p>
                              <p className="font-black text-amber-600 dark:text-amber-400">{currency} {formatNumber(g.netPayable)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onSelectProject(g)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 cursor-pointer transition-all whitespace-nowrap"
                          >
                            View Detail <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Project progress bar */}
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between mb-1.5 text-[10px]">
                          <span className="font-bold text-muted-foreground uppercase tracking-wide">Completion Progress</span>
                          <span className={`font-black ${projectPct >= 80 ? "text-emerald-500" : projectPct >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                            {projectPct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${projectPct >= 80 ? "bg-emerald-500" : projectPct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${projectPct}%` }}
                          />
                        </div>

                        {/* Scope mini pills */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {g.assignments.slice(0, 5).map((a) => (
                            <span key={a.id} className="text-[9px] font-bold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">
                              {a.tradeIcon} {a.scopeName}
                            </span>
                          ))}
                          {g.assignments.length > 5 && (
                            <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              +{g.assignments.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200 mt-4">
          {/* Reconciliation Flow Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-7 gap-4 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
            
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cumulative Scope Earnings</span>
              <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{currency} {formatNumber(totalEarnedVal)}</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Based on verified site progress</p>
            </div>
            
            <div className="flex items-center justify-center text-muted-foreground text-sm font-bold">
              <span>−</span>
            </div>
            
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Fine & Deductions</span>
              <h4 className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">{currency} {formatNumber(totalDeductions)}</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Penalties, advances & damage logs</p>
            </div>
            
            <div className="flex items-center justify-center text-muted-foreground text-sm font-bold">
              <span>−</span>
            </div>
            
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payments Disbursed</span>
              <h4 className="text-base font-black text-purple-600 dark:text-purple-400 mt-1">{currency} {formatNumber(totalPaid)}</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Cleared corporate disbursements</p>
            </div>
            
            <div className="md:col-span-7 border-t border-border/50 my-1 hidden md:block"></div>
            
            <div className="md:col-span-7 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Net Subcontract Outstanding Receivable</span>
                <p className="text-[9px] text-muted-foreground mt-0.5">Outstanding balance to be released</p>
              </div>
              <div className="text-right">
                <h4 className="text-lg font-black text-primary">{currency} {formatNumber(netPayable)}</h4>
              </div>
            </div>
          </div>

          {/* Section 1: Scopes & Earned Values */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layers size={14} className="text-primary" />
                Subcontract Scopes & Progress Earnings
              </h4>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {detailedAssignments.length} Assigned Scope{detailedAssignments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/10 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Scope / Trade</th>
                    <th className="py-3 px-4">Project Site</th>
                    <th className="py-3 px-4 text-center">Progress</th>
                    <th className="py-3 px-4 text-right">Quantity Breakdown</th>
                    <th className="py-3 px-4 text-right">Unit Rate</th>
                    <th className="py-3 px-4 text-right">Contract Value</th>
                    <th className="py-3 px-4 text-right">Earned Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs font-medium">
                  {detailedAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No scopes assigned to this contractor.
                      </td>
                    </tr>
                  ) : (
                    detailedAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{a.tradeIcon || "📁"}</span>
                            <div>
                              <p className="font-bold text-foreground">{a.scopeName}</p>
                              <p className="text-[10px] text-muted-foreground">ID: {a.id?.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {projects.find((p) => p.id === a.projectId)?.name || "Unknown Project"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-foreground">{a.progressPct}%</span>
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${a.progressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className="text-foreground">{formatNumber(a.doneQty)}</span>
                          <span className="text-muted-foreground"> / {formatNumber(a.totalQty)}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {currency} {formatNumber(a.subRate)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {currency} {formatNumber(a.contractVal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {currency} {formatNumber(a.earnedVal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Two-column layout for Deductions and Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Deductions Ledger */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-rose-500" />
                  Fine & Deductions Ledger
                </h4>
                <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                  {currency} {formatNumber(totalDeductions)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-medium">
                    {myDeductions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No deductions logged.
                        </td>
                      </tr>
                    ) : (
                      myDeductions.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                            {d.date}
                          </td>
                          <td className="py-3 px-4 text-foreground font-bold">
                            {d.site}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                {d.category}
                              </span>
                              {d.description && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{d.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            {currency} {formatNumber(d.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disbursed Payments Ledger */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CreditCard size={14} className="text-purple-500" />
                  Disbursed Payments Ledger
                </h4>
                <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                  {currency} {formatNumber(totalPaid)} Cleared
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Method / Channel</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-medium">
                    {myPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No payment history.
                        </td>
                      </tr>
                    ) : (
                      myPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                            {p.date}
                          </td>
                          <td className="py-3 px-4 text-foreground font-bold">
                            {p.project}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-[11px]">
                            {p.channel}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === "Cleared" 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold ${
                            p.status === "Cleared" ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                          }`}>
                            {currency} {formatNumber(p.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Scope Modal */}
      {showAssignModal && (
        <AssignScopeModal
          contractor={contractor}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => { setAssignSuccess(true); setTimeout(() => setAssignSuccess(false), 3000); }}
        />
      )}

      {/* Deduction Modal */}
      {showDeductionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Log Deduction — {contractor.name}</h3>
              <button onClick={() => setShowDeductionModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"><X size={15} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Project Site</label>
                <select value={deductionForm.site} onChange={(e) => setDeductionForm({ ...deductionForm, site: e.target.value })}
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none">
                  <option value="">Select project...</option>
                  {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Amount ({currency})</label>
                  <input type="number" value={deductionForm.amount} onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                    placeholder="e.g. 1500" className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none font-bold" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
                  <select value={deductionForm.category} onChange={(e) => setDeductionForm({ ...deductionForm, category: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none">
                    <option>Material Damage</option>
                    <option>Safety Fine</option>
                    <option>Cash Advance</option>
                    <option>Delay Penalty</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Date</label>
                  <input type="date" value={deductionForm.date} onChange={(e) => setDeductionForm({ ...deductionForm, date: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Approved By</label>
                  <input value={deductionForm.approvedBy} onChange={(e) => setDeductionForm({ ...deductionForm, approvedBy: e.target.value })}
                    placeholder="Manager" className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Description</label>
                <textarea rows={2} value={deductionForm.description} onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                  placeholder="Brief reason..." className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setShowDeductionModal(false)} className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={handleSaveDeduction} disabled={!deductionForm.amount || !deductionForm.site}
                className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-40 cursor-pointer transition-all">
                ✓ Log Deduction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Record Payment — {contractor.name}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"><X size={15} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Project Site</label>
                <select value={paymentForm.project} onChange={(e) => setPaymentForm({ ...paymentForm, project: e.target.value })}
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none">
                  <option value="">Select project...</option>
                  {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Amount ({currency})</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="e.g. 50000" className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Date</label>
                  <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Channel</label>
                  <select value={paymentForm.channel} onChange={(e) => setPaymentForm({ ...paymentForm, channel: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none">
                    <option>Bank Transfer</option>
                    <option>Corporate Check</option>
                    <option>Cash Account</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={handleSavePayment} disabled={!paymentForm.amount || !paymentForm.project}
                className="px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-40 cursor-pointer transition-all">
                ✓ Submit Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
