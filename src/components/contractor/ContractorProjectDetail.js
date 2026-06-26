"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft, Building2, MapPin, DollarSign, CheckCircle2,
  CreditCard, ShieldAlert, Layers, ChevronDown, ChevronUp,
  FileText, Activity, TrendingDown, Plus, X, Star,
  Clock, Target, Hash, BarChart3, AlertCircle
} from "lucide-react";
import useContractorStore from "@/store/useContractorStore";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore from "@/store/useProjectStore";
import { formatNumber } from "@/lib/utils";
import useUserStore from "@/store/useUserStore";
import { useCurrency } from "@/store/useSettingsStore";
import { Pagination } from "@/components/ui/Pagination";

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const deductionStyles = {
  "Material Damage": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "Safety Fine": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Cash Advance": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Delay Penalty": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};
const paymentStatusCls = {
  "Cleared": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Pending Approval": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Rejected": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};
const logStatusCls = {
  "Approved": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Under Review": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Rejected": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function ProgressBar({ value, size = "md" }) {
  const h = size === "sm" ? "h-1" : "h-1.5";
  const cls = value >= 100 ? "bg-emerald-500" : value >= 80 ? "bg-emerald-400" : value >= 50 ? "bg-amber-400" : value >= 20 ? "bg-rose-400" : "bg-rose-600";
  return (
    <div className={`${h} bg-muted rounded-full overflow-hidden flex-1`}>
      <div className={`${h} ${cls} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function ContractorProjectDetail({ contractor, projectGroup, onBack, onBackToDirectory }) {
  const currency = useCurrency();
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";
  const addLog = useProgressStore((s) => s.addLog);
  const deductions = useContractorStore((s) => s.deductions);
  const payments = useContractorStore((s) => s.payments);
  const addDeduction = useContractorStore((s) => s.addDeduction);
  const addPayment = useContractorStore((s) => s.addPayment);
  const projects = useProjectStore((s) => s.projects);
  const fetchPayments = useContractorStore((s) => s.fetchPayments);
  const fetchDeductions = useContractorStore((s) => s.fetchDeductions);
  const loading = useContractorStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState("scopes");
  const [expandedScopes, setExpandedScopes] = useState({});
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submittingProgress, setSubmittingProgress] = useState(false);

  const [dedPage, setDedPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  useEffect(() => {
    fetchPayments(contractor.id);
    fetchDeductions(contractor.id);
  }, [contractor.id, fetchPayments, fetchDeductions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDedPage(1);
      setPayPage(1);
      setLogPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [contractor.id, activeTab]);

  const [deductionForm, setDeductionForm] = useState({
    site: projectGroup.project?.name || "", amount: "", category: "Material Damage",
    date: new Date().toISOString().split("T")[0], approvedBy: "", description: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    project: projectGroup.project?.name || "", amount: "", date: new Date().toISOString().split("T")[0], channel: "Bank Transfer",
  });
  const [progressForm, setProgressForm] = useState({
    assignmentId: "", unitId: "", phaseId: "", qtyCompleted: "", notes: "", signedBy: "",
  });

  const toggleScope = (id) => setExpandedScopes((p) => ({ ...p, [id]: !p[id] }));

  // All assignments for this contractor on this project — with enriched calcs
  const enrichedScopes = useMemo(() => {
    const projectId = projectGroup.projectId;
    const myAssignments = allAssignments.filter(
      (a) => a.projectId === projectId &&
        (a.assigneeId === contractor.id || a.assigneeName?.toLowerCase() === contractor.name?.toLowerCase())
    );
    return myAssignments.map((a) => {
      const logs = allLogs.filter((l) => l.assignmentId === a.id);
      const totalQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)
        : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)
        : a.totalQty || 0;
      const doneQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (u.done || 0), 0)
        : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.done || 0), 0)
        : logs.reduce((s, l) => s + (l.qtyCompleted || 0), 0);
      const progressPct = pct(doneQty, totalQty);
      const contractVal = totalQty * (a.subRate || 0);
      const earnedVal = doneQty * (a.subRate || 0);
      const clientVal = totalQty * (a.clientRate || 0);
      const clientEarned = doneQty * (a.clientRate || 0);
      const margin = (a.clientRate || 0) - (a.subRate || 0);
      return { ...a, logs, totalQty, doneQty, progressPct, contractVal, earnedVal, clientVal, clientEarned, margin };
    });
  }, [allAssignments, allLogs, contractor, projectGroup]);

  // Project-level financials
  const totalContractVal = enrichedScopes.reduce((s, a) => s + a.contractVal, 0);
  const totalEarnedVal = enrichedScopes.reduce((s, a) => s + a.earnedVal, 0);
  const projectName = projectGroup.project?.name || "";

  const projectDeductions = useMemo(() => deductions.filter(
    (d) => (d.contractorId === contractor.id || d.contractorName?.toLowerCase() === contractor.name?.toLowerCase()) && d.site === projectName
  ), [deductions, contractor, projectName]);
  const totalDeductions = projectDeductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const projectPayments = useMemo(() => payments.filter(
    (p) => p.subcontractor?.toLowerCase() === contractor.name?.toLowerCase() && p.project === projectName
  ), [payments, contractor, projectName]);
  const totalPaid = projectPayments.filter((p) => p.status === "Cleared").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const netPayable = Math.max(0, totalEarnedVal - totalDeductions - totalPaid);
  const overallPct = pct(totalEarnedVal, totalContractVal);

  // Project logs for this contractor
  const projectLogs = useMemo(() => allLogs.filter(
    (l) => l.projectId === projectGroup.projectId &&
      (l.assigneeName?.toLowerCase() === contractor.name?.toLowerCase() || enrichedScopes.some((a) => a.id === l.assignmentId))
  ), [allLogs, projectGroup, contractor, enrichedScopes]);

  const limit = 10;
  const totalDedPages = Math.ceil(projectDeductions.length / limit);
  const paginatedDeductions = projectDeductions.slice((dedPage - 1) * limit, dedPage * limit);

  const totalPayPages = Math.ceil(projectPayments.length / limit);
  const paginatedPayments = projectPayments.slice((payPage - 1) * limit, payPage * limit);

  const totalLogPages = Math.ceil(projectLogs.length / limit);
  const paginatedLogs = projectLogs.slice((logPage - 1) * limit, logPage * limit);

  const handleSaveDeduction = () => {
    if (!deductionForm.amount || !deductionForm.site) return;
    addDeduction({ contractorId: contractor.id, contractorName: contractor.name, ...deductionForm, amount: Number(deductionForm.amount) });
    setShowDeductionModal(false);
  };

  const handleSavePayment = () => {
    if (!paymentForm.amount || !paymentForm.project) return;
    addPayment({ subcontractor: contractor.name, ...paymentForm, amount: Number(paymentForm.amount), status: "Cleared" });
    setShowPaymentModal(false);
  };

  const handleAddProgress = async () => {
    if (!progressForm.assignmentId || !progressForm.qtyCompleted || submittingProgress) return;
    const asn = enrichedScopes.find((a) => a.id === progressForm.assignmentId);
    if (!asn) return;
    setSubmittingProgress(true);
    try {
      await addLog({
        projectId: projectGroup.projectId,
        assignmentId: progressForm.assignmentId,
        unitId: progressForm.unitId || null,
        phaseId: progressForm.phaseId || null,
        scopeName: asn.scopeName,
        uom: asn.uom,
        date: new Date().toISOString().split("T")[0],
        qtyCompleted: Number(progressForm.qtyCompleted),
        rate: asn.subRate,
        assigneeType: "contractor",
        assigneeName: contractor.name,
        notes: progressForm.notes,
        signedBy: progressForm.signedBy || "Site Engineer",
        status: "Under Review",
      });

      // Optimistic update on the assignment breakdown in local store
      useAssignmentStore.getState().applyProgressOptimistic(
        progressForm.assignmentId,
        progressForm.unitId || null,
        progressForm.phaseId || null,
        Number(progressForm.qtyCompleted)
      );

      setProgressForm({ assignmentId: "", unitId: "", phaseId: "", qtyCompleted: "", notes: "", signedBy: "" });
      setShowProgressModal(false);
    } catch (err) {
      // Handled by store/toast
    } finally {
      setSubmittingProgress(false);
    }
  };

  const tabs = [
    { id: "scopes", label: "Scope Ledger", icon: Layers, count: enrichedScopes.length },
    { id: "logs", label: "Progress Log", icon: Activity, count: projectLogs.length },
    { id: "deductions", label: "Deductions", icon: ShieldAlert, count: projectDeductions.length },
    { id: "payments", label: "Payments", icon: CreditCard, count: projectPayments.length },
    { id: "payable", label: "Net Payable & Reconciliation", icon: DollarSign },
  ];

  const selectedAsnForProgress = enrichedScopes.find((a) => a.id === progressForm.assignmentId);

  const maxAllowedQty = useMemo(() => {
    if (!selectedAsnForProgress) return Infinity;
    if (selectedAsnForProgress.level === "unit") {
      if (!progressForm.unitId) return 0;
      const u = (selectedAsnForProgress.unitBreakdown || []).find((u) => u.unitId === progressForm.unitId);
      return u ? Math.max(0, (u.qty || 0) - (u.done || 0)) : 0;
    }
    if (selectedAsnForProgress.level === "phase") {
      if (!progressForm.phaseId) return 0;
      const p = (selectedAsnForProgress.phaseBreakdown || []).find((p) => p.phaseId === progressForm.phaseId);
      return p ? Math.max(0, (p.qty || 0) - (p.done || 0)) : 0;
    }
    // project level
    return Math.max(0, (selectedAsnForProgress.totalQty || 0) - (selectedAsnForProgress.doneQty || 0));
  }, [selectedAsnForProgress, progressForm.unitId, progressForm.phaseId]);

  const selectedScopeStats = useMemo(() => {
    if (!selectedAsnForProgress) return null;
    let target = 0;
    let done = 0;

    if (selectedAsnForProgress.level === "unit") {
      if (progressForm.unitId) {
        const u = (selectedAsnForProgress.unitBreakdown || []).find((u) => u.unitId === progressForm.unitId);
        if (u) {
          target = Number(u.qty || 0);
          done = Number(u.done || 0);
        }
      }
    } else if (selectedAsnForProgress.level === "phase") {
      if (progressForm.phaseId) {
        const p = (selectedAsnForProgress.phaseBreakdown || []).find((p) => p.phaseId === progressForm.phaseId);
        if (p) {
          target = Number(p.qty || 0);
          done = Number(p.done || 0);
        }
      }
    } else {
      // project level
      target = Number(selectedAsnForProgress.totalQty || 0);
      done = Number(selectedAsnForProgress.doneQty || 0);
    }

    const remaining = Math.max(0, target - done);
    const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
    return { target, done, remaining, percent };
  }, [selectedAsnForProgress, progressForm.unitId, progressForm.phaseId]);

  return (
    <div className="p-6 space-y-5 min-h-full animate-in fade-in duration-200">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <button onClick={onBackToDirectory} className="hover:text-foreground transition-colors cursor-pointer font-semibold flex items-center gap-1">
          <ArrowLeft size={13} /> Contractors
        </button>
        <span>/</span>
        <button onClick={onBack} className="hover:text-foreground transition-colors cursor-pointer font-semibold">{contractor.name}</button>
        <span>/</span>
        <span className="text-foreground font-bold">{projectGroup.project?.name || "Unknown Project"}</span>
      </div>

      {/* Project + Contractor header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">{projectGroup.project?.name || "Unknown Project"}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                {projectGroup.project?.location && <span className="flex items-center gap-1"><MapPin size={11} /> {projectGroup.project.location}</span>}
                {projectGroup.project?.type && <span>{projectGroup.project.type} · {projectGroup.project.subtype}</span>}
                {projectGroup.project?.pm && <span>PM: {projectGroup.project.pm}</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black border border-primary/20">
                  {contractor.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-foreground">{contractor.name}</span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground">{contractor.trade}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                  <Star size={8} fill="currentColor" /> {contractor.rating}
                </span>
              </div>
            </div>
          </div>
          {!isReadOnly && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowProgressModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl cursor-pointer transition-all">
                <Activity size={13} /> Add Progress
              </button>
              <button onClick={() => setShowDeductionModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl cursor-pointer transition-all">
                <TrendingDown size={13} /> Log Deduction
              </button>
              <button onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer transition-all">
                <CreditCard size={13} /> Disburse Payment
              </button>
            </div>
          )}
        </div>

        {/* Overall progress */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-muted-foreground uppercase tracking-wide">Contractor Progress on this Project</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Contract Value", value: `${currency} ${formatNumber(totalContractVal)}`, sub: `${enrichedScopes.length} scopes`, cls: "text-blue-600 bg-blue-500/10", icon: Layers },
          { label: "Total Earned", value: `${currency} ${formatNumber(totalEarnedVal)}`, sub: `${overallPct}% done`, cls: "text-emerald-600 bg-emerald-500/10", icon: CheckCircle2 },
          { label: "Pending Receivable", value: `${currency} ${formatNumber(Math.max(0, totalContractVal - totalEarnedVal))}`, sub: "remaining work", cls: "text-slate-600 bg-slate-500/10", icon: Clock },
          { label: "Deductions", value: `${currency} ${formatNumber(totalDeductions)}`, sub: `${projectDeductions.length} entries`, cls: "text-rose-600 bg-rose-500/10", icon: ShieldAlert },
          { label: "Disbursed", value: `${currency} ${formatNumber(totalPaid)}`, sub: "cleared payments", cls: "text-purple-600 bg-purple-500/10", icon: CreditCard },
          { label: "Net Payable", value: `${currency} ${formatNumber(netPayable)}`, sub: "outstanding", cls: "text-amber-600 bg-amber-500/10", icon: DollarSign, highlight: true },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`bg-card border rounded-2xl p-3.5 transition-all ${card.highlight ? "border-amber-500/30 ring-1 ring-amber-500/10" : "border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-tight">{card.label}</span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${card.cls} shrink-0`}><Icon size={12} /></div>
              </div>
              <p className={`text-[13px] font-black leading-none ${card.highlight ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{card.value}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap
                ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={13} /> {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Scope Ledger ── */}
      {activeTab === "scopes" && (
        <div className="space-y-3">
          {enrichedScopes.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl py-12 text-center text-muted-foreground">
              <Layers size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No scopes assigned to this project</p>
            </div>
          ) : (
            enrichedScopes.map((a, idx) => {
              const isExpanded = expandedScopes[a.id];
              const pctColor = a.progressPct >= 100 ? "text-emerald-500" : a.progressPct >= 80 ? "text-emerald-400" : a.progressPct >= 50 ? "text-amber-500" : "text-rose-500";
              const margin = (a.clientRate || 0) - (a.subRate || 0);
              return (
                <div key={a.id} className={`bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-200 fade-up du-${Math.min(idx + 1, 9)}`}>
                  {/* Scope header row */}
                  <div
                    className="flex flex-col xl:flex-row xl:items-center gap-3 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => toggleScope(a.id)}
                  >
                    {/* Left: scope name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl shrink-0">{a.tradeIcon || "📋"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-foreground text-[13px]">{a.scopeName}</h4>
                          <span className="text-[9px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{a.level}</span>
                          <span className="text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">{a.id}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.trade} · {a.uom}</p>
                      </div>
                    </div>

                    {/* Right: data grid */}
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 text-[10px]">
                      <div className="text-center">
                        <p className="text-muted-foreground font-bold uppercase tracking-wide mb-0.5">Sub Rate</p>
                        <p className="font-black text-foreground">{currency} {formatNumber(a.subRate)}</p>
                        {a.clientRate > 0 && <p className="text-emerald-500 font-semibold">+{formatNumber(margin)}</p>}
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground font-bold uppercase tracking-wide mb-0.5">Qty</p>
                        <p className="font-black text-foreground">{formatNumber(a.totalQty)} {a.uom}</p>
                        <p className="text-primary font-semibold">{formatNumber(a.doneQty)} done</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground font-bold uppercase tracking-wide mb-0.5">Contract</p>
                        <p className="font-black text-foreground">{currency} {formatNumber(a.contractVal)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground font-bold uppercase tracking-wide mb-0.5">Earned</p>
                        <p className="font-black text-emerald-600 dark:text-emerald-400">{currency} {formatNumber(a.earnedVal)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground font-bold uppercase tracking-wide mb-0.5">Target</p>
                        <p className="font-bold text-foreground">{a.targetDate || "—"}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-muted-foreground font-bold uppercase tracking-wide">Progress</p>
                        <div className="flex items-center gap-1.5 w-full">
                          <ProgressBar value={a.progressPct} />
                          <span className={`font-black text-[11px] whitespace-nowrap ${pctColor}`}>{a.progressPct}%</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-1.5 rounded-lg transition-colors ml-2 shrink-0 ${isExpanded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>

                  {/* Expanded: breakdown */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/10 p-4 space-y-4">
                      {/* Notes */}
                      {a.notes && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 border border-border/50">
                          <FileText size={13} className="mt-0.5 shrink-0" />
                          <span>{a.notes}</span>
                        </div>
                      )}

                      {/* Unit breakdown */}
                      {a.level === "unit" && a.unitBreakdown?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Per-Unit Breakdown</p>
                          <div className="border border-border/60 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_2fr] px-4 py-2.5 bg-muted/40 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                              <span>Unit</span>
                              <span>Phase</span>
                              <span>Qty Assigned</span>
                              <span>Done</span>
                              <span>Progress</span>
                            </div>
                            {a.unitBreakdown.map((u, ui) => {
                              const proj = projectGroup.project;
                              const unit = proj?.units?.find((pu) => pu.id === u.unitId);
                              const phase = proj?.phases?.find((ph) => ph.id === unit?.phaseId);
                              const upct = pct(u.done || 0, u.qty || 0);
                              const upctCls = upct >= 100 ? "text-emerald-500" : upct >= 50 ? "text-amber-500" : "text-rose-500";
                              return (
                                <div key={u.unitId} className={`grid grid-cols-[1fr_1fr_1fr_1fr_2fr] px-4 py-2.5 items-center text-xs ${ui < a.unitBreakdown.length - 1 ? "border-b border-border/40" : ""} hover:bg-muted/30 transition-colors`}>
                                  <span className="font-bold text-foreground">{unit?.name || u.unitId}</span>
                                  <span className="text-muted-foreground">{phase?.name || "—"}</span>
                                  <span className="font-semibold text-foreground">{formatNumber(u.qty)} {a.uom}</span>
                                  <span className={`font-black ${upctCls}`}>{formatNumber(u.done || 0)}</span>
                                  <div className="flex items-center gap-2">
                                    <ProgressBar value={upct} size="sm" />
                                    <span className={`font-black text-[11px] w-8 text-right ${upctCls}`}>{upct}%</span>
                                    {upct >= 100 && <span className="text-emerald-500 text-[9px] font-bold">✓ Done</span>}
                                  </div>
                                </div>
                              );
                            })}
                            {/* Unit totals */}
                            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_2fr] px-4 py-2 bg-muted/30 border-t border-border text-[10px] font-black">
                              <span className="text-muted-foreground">TOTAL</span>
                              <span></span>
                              <span className="text-foreground">{formatNumber(a.totalQty)} {a.uom}</span>
                              <span className="text-primary">{formatNumber(a.doneQty)}</span>
                              <div className="flex items-center gap-2">
                                <ProgressBar value={a.progressPct} size="sm" />
                                <span className={a.progressPct >= 80 ? "text-emerald-500" : a.progressPct >= 50 ? "text-amber-500" : "text-rose-500"}>{a.progressPct}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Phase breakdown */}
                      {a.level === "phase" && a.phaseBreakdown?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Per-Phase Breakdown</p>
                          <div className="border border-border/60 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-[1fr_1fr_1fr_2fr] px-4 py-2.5 bg-muted/40 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                              <span>Phase</span>
                              <span>Qty Assigned</span>
                              <span>Done</span>
                              <span>Progress</span>
                            </div>
                            {a.phaseBreakdown.map((ph, pi) => {
                              const ppct = pct(ph.done || 0, ph.qty || 0);
                              const ppctCls = ppct >= 100 ? "text-emerald-500" : ppct >= 50 ? "text-amber-500" : "text-rose-500";
                              return (
                                <div key={ph.phaseId} className={`grid grid-cols-[1fr_1fr_1fr_2fr] px-4 py-2.5 items-center text-xs ${pi < a.phaseBreakdown.length - 1 ? "border-b border-border/40" : ""} hover:bg-muted/30 transition-colors`}>
                                  <span className="font-bold text-foreground">{ph.phaseName}</span>
                                  <span className="font-semibold text-foreground">{formatNumber(ph.qty)} {a.uom}</span>
                                  <span className={`font-black ${ppctCls}`}>{formatNumber(ph.done || 0)}</span>
                                  <div className="flex items-center gap-2">
                                    <ProgressBar value={ppct} size="sm" />
                                    <span className={`font-black text-[11px] w-8 text-right ${ppctCls}`}>{ppct}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Project-level: log summary */}
                      {a.level === "project" && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Progress Log Summary</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center">
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Qty</p>
                              <p className="text-sm font-black text-foreground mt-0.5">{formatNumber(a.totalQty)} {a.uom}</p>
                            </div>
                            <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20 text-center">
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Completed</p>
                              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatNumber(a.doneQty)} {a.uom}</p>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center">
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Log Entries</p>
                              <p className="text-sm font-black text-primary mt-0.5">{a.logs.length}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Financial summary per scope */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                          { label: "Contract Value", value: `${currency} ${formatNumber(a.contractVal)}`, cls: "text-blue-600" },
                          { label: "Earned (Sub Rate)", value: `${currency} ${formatNumber(a.earnedVal)}`, cls: "text-emerald-600 dark:text-emerald-400" },
                          { label: "Pending Receivable", value: `${currency} ${formatNumber(Math.max(0, a.contractVal - a.earnedVal))}`, cls: "text-amber-600" },
                          { label: "Margin / Unit", value: a.clientRate > 0 ? `${currency} ${formatNumber(margin)} / ${a.uom}` : "—", cls: "text-purple-600" },
                        ].map((f, fi) => (
                          <div key={fi} className="bg-muted/20 rounded-xl p-2.5 border border-border/40">
                            <p className="text-[9px] uppercase font-bold text-muted-foreground">{f.label}</p>
                            <p className={`text-xs font-black mt-0.5 ${f.cls}`}>{f.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Scope totals row */}
          {enrichedScopes.length > 1 && (
            <div className="bg-muted/30 border border-border rounded-2xl p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Contract</p>
                <p className="text-base font-black text-foreground">{currency} {formatNumber(totalContractVal)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Earned</p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{currency} {formatNumber(totalEarnedVal)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Deductions</p>
                <p className="text-base font-black text-rose-600">{currency} {formatNumber(totalDeductions)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Net Payable</p>
                <p className="text-base font-black text-amber-600 dark:text-amber-400">{currency} {formatNumber(netPayable)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Progress Logs ── */}
      {activeTab === "logs" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1.5fr_1fr] px-5 py-3 bg-muted/40 border-b border-border text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Scope / Scope ID</span>
                <span>Unit / Phase</span>
                <span>Date</span>
                <span>Qty Completed</span>
                <span>Amount Earned</span>
                <span>Signed By / Notes</span>
                <span className="text-right">Status</span>
              </div>
              {projectLogs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No progress logs recorded yet.</div>
              ) : (
                paginatedLogs.map((log, i) => (
                  <div key={log.id} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1.5fr_1fr] px-5 py-3.5 items-center text-xs hover:bg-muted/10 transition-colors ${i < paginatedLogs.length - 1 ? "border-b border-border/40" : ""}`}>
                    <div>
                      <p className="font-bold text-foreground">{log.scopeName}</p>
                      <p className="text-[9px] text-muted-foreground">{log.id}</p>
                    </div>
                    <span className="text-muted-foreground font-medium">{log.unitId || log.phaseId || "Project-wide"}</span>
                    <span className="text-muted-foreground">{log.date}</span>
                    <span className="font-black text-primary">{formatNumber(log.qtyCompleted)} {log.uom}</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{currency} {formatNumber(log.amountEarned)}</span>
                    <div>
                      <p className="font-semibold text-foreground">{log.signedBy || "—"}</p>
                      {log.notes && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={log.notes}>{log.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${logStatusCls[log.status] || "bg-muted text-muted-foreground"}`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <Pagination
            page={logPage}
            totalPages={totalLogPages}
            onPageChange={setLogPage}
            loading={loading}
          />
        </div>
      )}

      {/* ── Tab: Deductions ── */}
      {activeTab === "deductions" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              <div className="grid grid-cols-[1fr_1.2fr_1.5fr_1fr_1.5fr_2fr] px-5 py-3 bg-muted/40 border-b border-border text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Ref ID</span>
                <span>Amount</span>
                <span>Category</span>
                <span>Date</span>
                <span>Approved By</span>
                <span>Description</span>
              </div>
              {projectDeductions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No deductions logged for this project.</div>
              ) : (
                paginatedDeductions.map((d, i) => (
                  <div key={d.id} className={`grid grid-cols-[1fr_1.2fr_1.5fr_1fr_1.5fr_2fr] px-5 py-3.5 items-center text-xs hover:bg-muted/10 transition-colors ${i < paginatedDeductions.length - 1 ? "border-b border-border/40" : ""}`}>
                    <span className="font-bold text-muted-foreground">{d.id}</span>
                    <span className="font-black text-rose-500">{currency} {formatNumber(d.amount)}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${deductionStyles[d.category] || ""}`}>{d.category}</span>
                    <span className="text-muted-foreground">{d.date}</span>
                    <span className="font-medium text-foreground">{d.approvedBy}</span>
                    <span className="text-muted-foreground truncate" title={d.description}>{d.description}</span>
                  </div>
                ))
              )}
              {projectDeductions.length > 0 && (
                <div className="px-5 py-3 bg-rose-500/5 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600">Total Deductions on this Project</span>
                  <span className="text-sm font-black text-rose-600">{currency} {formatNumber(totalDeductions)}</span>
                </div>
              )}
            </div>
          </div>
          <Pagination
            page={dedPage}
            totalPages={totalDedPages}
            onPageChange={setDedPage}
            loading={loading}
          />
        </div>
      )}

      {/* ── Tab: Payments ── */}
      {activeTab === "payments" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[1fr_1.2fr_1fr_1.5fr_1.2fr] px-5 py-3 bg-muted/40 border-b border-border text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Voucher ID</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Channel</span>
                <span className="text-right">Status</span>
              </div>
              {projectPayments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No payments recorded for this project.</div>
              ) : (
                paginatedPayments.map((p, i) => (
                  <div key={p.id} className={`grid grid-cols-[1fr_1.2fr_1fr_1.5fr_1.2fr] px-5 py-3.5 items-center text-xs hover:bg-muted/10 transition-colors ${i < paginatedPayments.length - 1 ? "border-b border-border/40" : ""}`}>
                    <span className="font-bold text-muted-foreground">{p.id}</span>
                    <span className="font-black text-foreground">{currency} {formatNumber(p.amount)}</span>
                    <span className="text-muted-foreground">{p.date}</span>
                    <span className="font-medium text-foreground">{p.channel}</span>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${paymentStatusCls[p.status] || "bg-muted text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {projectPayments.length > 0 && (
                <div className="px-5 py-3 bg-emerald-500/5 border-t border-emerald-500/20 grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Total Disbursed (Cleared)</span>
                    <span className="text-sm font-black text-emerald-600">{currency} {formatNumber(totalPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Net Payable Balance</span>
                    <span className="text-sm font-black text-amber-600">{currency} {formatNumber(netPayable)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Pagination
            page={payPage}
            totalPages={totalPayPages}
            onPageChange={setPayPage}
            loading={loading}
          />
        </div>
      )}

      {activeTab === "payable" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Reconciliation Flow Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-7 gap-4 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
            
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Scope Earnings</span>
              <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{currency} {formatNumber(totalEarnedVal)}</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Based on progress on this project</p>
            </div>
            
            <div className="flex items-center justify-center text-muted-foreground text-sm font-bold">
              <span>−</span>
            </div>
            
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Deductions</span>
              <h4 className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">{currency} {formatNumber(totalDeductions)}</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Penalties, advances & damage logs</p>
            </div>
            
            <div className="flex items-center justify-center text-muted-foreground text-sm font-bold">
              <span>−</span>
            </div>
            
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payments Received</span>
              <h4 className="text-base font-black text-purple-600 dark:text-purple-400 mt-1">{currency} {formatNumber(totalPaid)}</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Cleared project disbursements</p>
            </div>
            
            <div className="md:col-span-7 border-t border-border/50 my-1 hidden md:block"></div>
            
            <div className="md:col-span-7 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Project Net Subcontract Outstanding Receivable</span>
                <p className="text-[9px] text-muted-foreground mt-0.5">Outstanding balance to be released for this project</p>
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
                Project Scopes & Progress Earnings
              </h4>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {enrichedScopes.length} Assigned Scope{enrichedScopes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/10 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Scope / Trade</th>
                    <th className="py-3 px-4 text-center">Progress</th>
                    <th className="py-3 px-4 text-right">Quantity Breakdown</th>
                    <th className="py-3 px-4 text-right">Unit Rate</th>
                    <th className="py-3 px-4 text-right">Contract Value</th>
                    <th className="py-3 px-4 text-right">Earned Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs font-medium">
                  {enrichedScopes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No scopes assigned to this project.
                      </td>
                    </tr>
                  ) : (
                    enrichedScopes.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{a.tradeIcon || "📁"}</span>
                            <div>
                              <p className="font-bold text-foreground">{a.scopeName}</p>
                              <p className="text-[10px] text-muted-foreground">ID: {a.id}</p>
                            </div>
                          </div>
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
                  Project Deductions Ledger
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
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-medium">
                    {projectDeductions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-muted-foreground">
                          No deductions logged.
                        </td>
                      </tr>
                    ) : (
                      projectDeductions.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                            {d.date}
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
                  Project Payments Ledger
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
                      <th className="py-3 px-4">Method / Channel</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-medium">
                    {projectPayments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No payment history.
                        </td>
                      </tr>
                    ) : (
                      projectPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                            {p.date}
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

      {/* ── Modal: Add Progress ── */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="text-sm font-bold text-foreground">Add Progress Entry</h3>
              <button onClick={() => setShowProgressModal(false)} disabled={submittingProgress} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><X size={15} /></button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Scope Assignment *</label>
                <select value={progressForm.assignmentId}
                  onChange={(e) => setProgressForm({ ...progressForm, assignmentId: e.target.value, unitId: "", phaseId: "" })}
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none">
                  <option value="">Select scope...</option>
                  {enrichedScopes.map((a) => <option key={a.id} value={a.id}>{a.tradeIcon} {a.scopeName} ({a.uom})</option>)}
                </select>
              </div>
              {selectedAsnForProgress?.level === "unit" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Unit</label>
                  <select value={progressForm.unitId} onChange={(e) => setProgressForm({ ...progressForm, unitId: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none">
                    <option value="">Select unit...</option>
                    {(selectedAsnForProgress.unitBreakdown || []).map((u) => {
                      const unit = projectGroup.project?.units?.find((pu) => pu.id === u.unitId);
                      return <option key={u.unitId} value={u.unitId}>{unit?.name || u.unitId}</option>;
                    })}
                  </select>
                </div>
              )}
              {selectedAsnForProgress?.level === "phase" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Phase</label>
                  <select value={progressForm.phaseId} onChange={(e) => setProgressForm({ ...progressForm, phaseId: e.target.value })}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none">
                    <option value="">Select phase...</option>
                    {(selectedAsnForProgress.phaseBreakdown || []).map((p) => (
                      <option key={p.phaseId} value={p.phaseId}>{p.phaseName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Guiding Placeholders for selections */}
              {selectedAsnForProgress?.level === "unit" && !progressForm.unitId && (
                <p className="text-[10px] text-muted-foreground text-center italic bg-muted/20 py-2 rounded-lg border border-dashed border-border/60">
                  Please select a unit to view remaining quantities.
                </p>
              )}
              {selectedAsnForProgress?.level === "phase" && !progressForm.phaseId && (
                <p className="text-[10px] text-muted-foreground text-center italic bg-muted/20 py-2 rounded-lg border border-dashed border-border/60">
                  Please select a phase to view remaining quantities.
                </p>
              )}

              {/* Scope Stats Panel */}
              {selectedScopeStats && selectedScopeStats.target > 0 && (
                <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground">
                    <span>Scope Target & Progress</span>
                    <span className="text-foreground font-black">
                      {selectedAsnForProgress.level} Level
                    </span>
                  </div>

                  {/* Metric Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-card border border-border/40 p-1.5 rounded-lg">
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Target Qty</p>
                      <p className="text-xs font-black text-foreground mt-0.5">
                        {selectedScopeStats.target} <span className="text-[9px] font-semibold text-muted-foreground">{selectedAsnForProgress.uom}</span>
                      </p>
                    </div>
                    <div className="bg-card border border-border/40 p-1.5 rounded-lg">
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Prev Done</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {selectedScopeStats.done} <span className="text-[9px] font-semibold text-muted-foreground">{selectedAsnForProgress.uom}</span>
                      </p>
                    </div>
                    <div className="bg-card border border-border/40 p-1.5 rounded-lg">
                      <p className="text-[8px] uppercase font-bold text-muted-foreground">Remaining</p>
                      <p className="text-xs font-black text-primary mt-0.5">
                        {selectedScopeStats.remaining} <span className="text-[9px] font-semibold text-muted-foreground">{selectedAsnForProgress.uom}</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                      <span>Completion Ratio</span>
                      <span className="text-foreground font-black">{selectedScopeStats.percent}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${selectedScopeStats.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                    <span>Qty Completed ({selectedAsnForProgress?.uom || "units"}) *</span>
                    {selectedAsnForProgress && (
                      <span className="text-[9.5px] text-primary lowercase font-semibold">
                        (max: {maxAllowedQty})
                      </span>
                    )}
                  </label>
                  <input type="number" value={progressForm.qtyCompleted}
                    onChange={(e) => setProgressForm({ ...progressForm, qtyCompleted: e.target.value })}
                    placeholder="0"
                    className={`block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border outline-none font-bold
                      ${progressForm.qtyCompleted && Number(progressForm.qtyCompleted) > maxAllowedQty ? "border-destructive text-destructive" : "border-border"}`} />
                  {selectedAsnForProgress && progressForm.qtyCompleted && Number(progressForm.qtyCompleted) > maxAllowedQty && (
                    <p className="mt-1 text-[10px] text-destructive font-semibold flex items-center gap-1">
                      <AlertCircle size={10} /> Exceeds remaining qty ({maxAllowedQty} {selectedAsnForProgress.uom})
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Signed By</label>
                  <input value={progressForm.signedBy} onChange={(e) => setProgressForm({ ...progressForm, signedBy: e.target.value })}
                    placeholder="Site Engineer" className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Notes</label>
                <textarea rows={2} value={progressForm.notes} onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                  placeholder="Optional notes..." className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none resize-none" />
              </div>
              {progressForm.qtyCompleted && selectedAsnForProgress && (
                <div className="p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-muted-foreground">Amount Earned: </span>
                    <span className="font-black text-emerald-600">{currency} {formatNumber(Number(progressForm.qtyCompleted) * (selectedAsnForProgress.subRate || 0))}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    Rate: {currency} {selectedAsnForProgress.subRate} / {selectedAsnForProgress.uom}
                  </div>
                </div>
              )}
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-between px-6 py-4 border-t border-border shrink-0">
              <button onClick={() => setShowProgressModal(false)} disabled={submittingProgress} className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
              <button onClick={handleAddProgress} 
                disabled={
                  !progressForm.assignmentId || 
                  !progressForm.qtyCompleted || 
                  Number(progressForm.qtyCompleted) <= 0 || 
                  Number(progressForm.qtyCompleted) > maxAllowedQty ||
                  submittingProgress
                }
                className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5">
                {submittingProgress ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>✓ Add Progress</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deduction Modal */}
      {showDeductionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Log Deduction — {projectGroup.project?.name}</h3>
              <button onClick={() => setShowDeductionModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"><X size={15} /></button>
            </div>
            <div className="space-y-3">
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
                    <option>Material Damage</option><option>Safety Fine</option><option>Cash Advance</option><option>Delay Penalty</option>
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
              <button onClick={handleSaveDeduction} disabled={!deductionForm.amount}
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Amount ({currency})</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="e.g. 50000" className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none font-bold" />
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 text-xs">
                <p className="text-muted-foreground">Project: <span className="font-bold text-foreground">{paymentForm.project}</span></p>
                <p className="text-muted-foreground mt-0.5">Net Outstanding: <span className="font-black text-amber-500">{currency} {formatNumber(netPayable)}</span></p>
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
                    <option>Bank Transfer</option><option>Corporate Check</option><option>Cash Account</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={handleSavePayment} disabled={!paymentForm.amount}
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
