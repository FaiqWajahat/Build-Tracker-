"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus, X, Check, ChevronDown, ChevronUp, ChevronRight, Search, Layers,
  Home, FolderOpen, User, Trash2, AlertCircle,
  Building2, BarChart2, TrendingUp, DollarSign,
  Package, Zap, Droplets, Paintbrush, Activity,
  Hash, Calendar, Users
} from "lucide-react";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";
import useScopeStore from "@/store/useScopeStore";
import useProgressStore from "@/store/useProgressStore";
import useUserStore from "@/store/useUserStore";
import useContractorStore from "@/store/useContractorStore";
import useLabourStore from "@/store/useLabourStore";
import { useCurrency } from "@/store/useSettingsStore";

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const statusColor = (p) => {
  if (p >= 100) return { bar: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Complete" };
  if (p >= 75)  return { bar: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",           label: "In Progress" };
  if (p >= 40)  return { bar: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",       label: "Ongoing" };
  if (p > 0)    return { bar: "bg-rose-500",    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",          label: "Behind" };
  return          { bar: "bg-muted-foreground/30", badge: "bg-muted text-muted-foreground",                          label: "Not Started" };
};

const LEVEL_INFO = {
  project: {
    icon: FolderOpen, label: "Project Level",
    desc: "One shared qty pool for the entire project.",
    color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20",
  },
  phase: {
    icon: Layers, label: "Phase Level",
    desc: "Assign a qty per phase (e.g. Phase A = 3000 LM).",
    color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20",
  },
  unit: {
    icon: Home, label: "Unit Level",
    desc: "Each villa/unit gets its own quantity.",
    color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
  },
};

const TRADE_ICONS = {
  "Civil & Structural": "🏗️",
  "Architectural & Finishes": "🎨",
  "MEP – Electrical": "⚡",
  "MEP – Plumbing": "🚰",
  "MEP – Mechanical": "♨️",
  "MEP – Fire Fighting": "🔥",
  "External Works": "🌿",
  "Facade & Envelope": "🏛️",
  "Preliminaries": "📋",
};

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function AssignmentsTab({ projectId }) {
  const currency       = useCurrency();
  const project        = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const addAssignment  = useAssignmentStore((s) => s.addAssignment);
  const updateAssignment = useAssignmentStore((s) => s.updateAssignment);
  const deleteAssignment = useAssignmentStore((s) => s.deleteAssignment);
  const fetchAssignments = useAssignmentStore((s) => s.fetchAssignments);
  const scopes           = useScopeStore((s) => s.scopes);
  const fetchScopes      = useScopeStore((s) => s.fetchScopes);
  const allLogs          = useProgressStore((s) => s.logs);

  // Live assignee data
  const contractors         = useContractorStore((s) => s.contractors);
  const fetchContractorData = useContractorStore((s) => s.fetchContractorData);
  const teams               = useLabourStore((s) => s.teams);
  const fetchLabourData     = useLabourStore((s) => s.fetchLabourData);

  // Build live assigneeOptions from DB
  const assigneeOptions = useMemo(() => [
    ...(contractors || []).map((c) => ({ id: c.id, name: c.name, type: "contractor" })),
    ...(teams || []).map((t) => ({ id: t.id, name: t.name, type: "team" })),
  ], [contractors, teams]);

  useEffect(() => {
    fetchScopes();
    fetchAssignments(projectId);
    fetchContractorData();
    fetchLabourData();
  }, [fetchScopes, fetchAssignments, fetchContractorData, fetchLabourData, projectId]);

  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === projectId), [allAssignments, projectId]);
  const logs        = useMemo(() => allLogs.filter((l) => l.projectId === projectId), [allLogs, projectId]);

  const [selectedId, setSelectedId] = useState(assignments[0]?.id || null);
  const [showWizard, setShowWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrade, setFilterTrade] = useState("All");
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";

  const selectedAssignment = assignments.find((a) => a.id === selectedId);
  const phases = project?.phases || [];
  const units  = project?.units  || [];

  const getPhaseColor = (colorId) => PHASE_COLORS.find((c) => c.id === colorId) || PHASE_COLORS[0];

  const computeTotals = (a) => {
    const totalQty = a.level === "unit"
      ? (a.unitBreakdown  || []).reduce((s, u) => s + (u.qty  || 0), 0)
      : a.level === "phase"
      ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.qty  || 0), 0)
      : (a.totalQty || 0);

    const doneQty = a.level === "unit"
      ? (a.unitBreakdown  || []).reduce((s, u) => s + (u.done || 0), 0)
      : a.level === "phase"
      ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.done || 0), 0)
      : logs.filter((l) => l.assignmentId === a.id).reduce((s, l) => s + (l.qtyCompleted || 0), 0);

    return { totalQty, doneQty };
  };

  const allTrades = [...new Set(assignments.map((a) => a.trade))];
  const filtered  = assignments.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = a.scopeName.toLowerCase().includes(q) || a.assigneeName?.toLowerCase().includes(q);
    const matchTrade  = filterTrade === "All" || a.trade === filterTrade;
    return matchSearch && matchTrade;
  });

  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.trade]) acc[a.trade] = [];
    acc[a.trade].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Scope Assignments</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {assignments.length} scope{assignments.length !== 1 ? "s" : ""} assigned · project / phase / unit level
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} /> Assign Scope
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[600px]">
        {/* ── Left: Scope List ──────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search scope or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring transition-colors"
              />
            </div>
            <select
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
              className="px-2 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground outline-none cursor-pointer"
            >
              <option value="All">All Trades</option>
              {allTrades.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Assignment list grouped by trade */}
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-0.5">
            {Object.entries(grouped).map(([trade, items]) => (
              <div key={trade}>
                <div className="flex items-center gap-2 px-1 mb-1.5">
                  <span className="text-sm">{TRADE_ICONS[trade] || "🏗️"}</span>
                  <p className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider">{trade}</p>
                  <span className="text-[9.5px] font-semibold text-muted-foreground/60">· {items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((a) => {
                    const { totalQty, doneQty } = computeTotals(a);
                    const progress = pct(doneQty, totalQty);
                    const sc = statusColor(progress);
                    const active = a.id === selectedId;
                    const LevelIcon = LEVEL_INFO[a.level]?.icon || FolderOpen;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedId(a.id)}
                        className={`w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer
                          ${active
                            ? "bg-primary/6 border-primary/25 shadow-sm"
                            : "bg-card border-border hover:bg-muted/30 hover:border-border/70"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-sm">{a.tradeIcon || "🏗️"}</span>
                              <p className="text-xs font-bold text-foreground truncate">{a.scopeName}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[9.5px] font-semibold flex items-center gap-0.5 ${LEVEL_INFO[a.level]?.color}`}>
                                <LevelIcon size={9} /> {LEVEL_INFO[a.level]?.label}
                              </span>
                              <span className="text-[9.5px] text-muted-foreground/60">·</span>
                              <span className="text-[9.5px] font-mono text-muted-foreground">{a.uom}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${sc.badge}`}>
                            {progress}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${sc.bar}`} style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[10px] text-muted-foreground truncate">
                            {a.assigneeName}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {doneQty.toLocaleString()}/{totalQty.toLocaleString()} {a.uom}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="py-14 text-center bg-card border border-dashed border-border rounded-xl">
                <Layers size={28} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-xs font-semibold text-foreground mb-1">No scopes assigned yet</p>
                <p className="text-[11px] text-muted-foreground mb-3">Assign scopes to start tracking progress</p>
                {!isReadOnly && (
                  <button onClick={() => setShowWizard(true)} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer">
                    + Assign first scope
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Scope Detail ───────────────────────────────────── */}
        <div className="lg:col-span-8">
          {selectedAssignment ? (
            <AssignmentDetail
              assignment={selectedAssignment}
              project={project}
              logs={logs}
              phases={phases}
              units={units}
              computeTotals={computeTotals}
              getPhaseColor={getPhaseColor}
              isReadOnly={isReadOnly}
              currency={currency}
              onUpdate={(data) => updateAssignment(selectedAssignment.id, data)}
              onDelete={() => {
                deleteAssignment(selectedAssignment.id);
                setSelectedId(assignments.find((a) => a.id !== selectedAssignment.id)?.id || null);
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-card border border-dashed border-border rounded-xl min-h-[400px]">
              <div className="text-center">
                <Layers size={36} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Select an assignment</p>
                <p className="text-xs text-muted-foreground">Click any scope on the left to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Scope Wizard Modal */}
      {showWizard && (
        <AssignWizard
          projectId={projectId}
          project={project}
          phases={phases}
          units={units}
          scopes={scopes}
          assigneeOptions={assigneeOptions}
          currency={currency}
          onClose={() => setShowWizard(false)}
          onSave={async (data) => {
            const saved = await addAssignment(data);
            if (saved?.id) setSelectedId(saved.id);
            setShowWizard(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Assignment Detail Panel ─────────────────────────────────────────── */
function AssignmentDetail({ assignment: a, project, logs, phases, units, computeTotals, getPhaseColor, isReadOnly, currency = "SAR", onUpdate, onDelete }) {
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { totalQty, doneQty } = computeTotals(a);
  const progress = pct(doneQty, totalQty);
  const sc = statusColor(progress);
  const assignmentLogs = logs.filter((l) => l.assignmentId === a.id);
  const earnedValue    = doneQty * a.clientRate;
  const contractValue  = totalQty * a.clientRate;
  const LevelInfo = LEVEL_INFO[a.level];

  const handleUnitDoneChange = (unitId, newDone) => {
    const updated = (a.unitBreakdown || []).map((u) =>
      u.unitId === unitId ? { ...u, done: Math.max(0, Math.min(u.qty, Number(newDone))) } : u
    );
    onUpdate({ unitBreakdown: updated });
  };

  const handlePhaseDoneChange = (phaseId, newDone) => {
    const updated = (a.phaseBreakdown || []).map((p) =>
      p.phaseId === phaseId ? { ...p, done: Math.max(0, Math.min(p.qty, Number(newDone))) } : p
    );
    onUpdate({ phaseBreakdown: updated });
  };

  return (
    <div className="space-y-4 fade-up">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Colour accent strip */}
        <div className={`h-1 w-full ${sc.bar}`} style={{ opacity: 0.7 }} />
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-border/60">
            <div className="flex items-start gap-3">
              <span className="text-2xl p-2.5 bg-muted rounded-xl shrink-0">{a.tradeIcon || "🏗️"}</span>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{a.trade}</p>
                <h2 className="text-[17px] font-extrabold text-foreground mt-0.5">{a.scopeName}</h2>
                {a.subScopeName && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <ChevronRight size={11} className="text-primary" />
                    {a.subScopeName}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                  <span className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border ${LevelInfo.border} ${LevelInfo.bg} ${LevelInfo.color}`}>
                    <LevelInfo.icon size={10} /> {LevelInfo.label}
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    UOM: <strong className="text-foreground font-mono">{a.uom}</strong>
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    By: <strong className="text-foreground">{a.assigneeName}</strong>
                  </span>
                </div>
              </div>
            </div>
            {!isReadOnly && (
              <div className="flex items-center gap-2 shrink-0">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-rose-500 font-semibold">Confirm?</span>
                    <button onClick={onDelete} className="px-3 py-1.5 text-xs font-bold bg-rose-500 text-white rounded-lg cursor-pointer hover:bg-rose-600 transition-colors">
                      Delete
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs font-semibold bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors text-foreground">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Progress</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-foreground">{progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${sc.bar}`} style={{ width: `${progress}%` }} />
              </div>
              <p className={`text-[10px] mt-1 font-bold ${sc.badge.split(" ")[1]}`}>{sc.label}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Qty Done / Total</p>
              <p className="text-base font-bold text-foreground mt-1">
                {doneQty.toLocaleString()} <span className="text-muted-foreground text-xs font-semibold">/ {totalQty.toLocaleString()} {a.uom}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{Math.max(0, totalQty - doneQty).toLocaleString()} remaining</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Earned Value</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {currency} {earnedValue.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">of {currency} {contractValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Client Rate</p>
              <p className="text-base font-bold text-foreground mt-1">
                {currency} {a.clientRate?.toLocaleString()} <span className="text-muted-foreground text-xs">/ {a.uom}</span>
              </p>
              {a.subRate && (
                <p className="text-[10px] text-muted-foreground">Sub: {currency} {a.subRate?.toLocaleString()}/{a.uom}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Quantity Breakdown</h3>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">
              {a.level === "project" ? "Whole-project pool — progress logged from daily entries" :
               a.level === "phase"   ? "Per-phase quantities" : "Per-unit quantities"}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.badge}`}>{sc.label}</span>
        </div>

        {/* PROJECT LEVEL */}
        {a.level === "project" && (
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: "Total Contract Qty", val: totalQty.toLocaleString(), unit: a.uom, col: "blue" },
                { label: "Completed",          val: doneQty.toLocaleString(),  unit: `${a.uom} (${progress}%)`, col: "emerald" },
                { label: "Remaining",          val: Math.max(0, totalQty - doneQty).toLocaleString(), unit: a.uom, col: "amber" },
              ].map((item) => (
                <div key={item.label} className={`p-4 bg-${item.col}-500/5 border border-${item.col}-500/15 rounded-xl text-center`}>
                  <p className={`text-[10px] uppercase font-bold text-${item.col}-600 dark:text-${item.col}-400 tracking-wider`}>{item.label}</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">{item.val}</p>
                  <p className="text-[10.5px] text-muted-foreground">{item.unit}</p>
                </div>
              ))}
            </div>
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-2 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Log Date & Notes</span>
                <span className="text-right pr-4">Qty</span>
                <span className="text-right pr-4">Earned ({currency})</span>
                <span className="text-right">Status</span>
              </div>
              <div className="divide-y divide-border/40 max-h-[260px] overflow-y-auto">
                {assignmentLogs.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">No progress logged yet</p>
                ) : assignmentLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-2.5 items-center hover:bg-muted/10">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{log.date}</p>
                      <p className="text-[10.5px] text-muted-foreground">{log.notes || "—"}</p>
                    </div>
                    <span className="text-xs font-bold text-foreground pr-4">+{log.qtyCompleted} {log.uom}</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pr-4">{currency} {log.amountEarned?.toLocaleString()}</span>
                    <LogStatusBadge status={log.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHASE LEVEL */}
        {a.level === "phase" && (
          <div className="divide-y divide-border/50">
            <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-2 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Phase</span>
              <span className="text-right">Total Qty ({a.uom})</span>
              <span className="text-center">Completed Qty</span>
              <span className="text-right">Progress</span>
              <span className="text-right">Earned ({currency})</span>
            </div>
            {(a.phaseBreakdown || []).map((pb) => {
              const phase     = (phases || []).find((ph) => ph.id === pb.phaseId);
              const col       = phase ? getPhaseColor(phase.colorId) : PHASE_COLORS[0];
              const unitCount = phase ? (phase.unitIds || []).length : 0;
              const perUnit   = unitCount > 0 ? (pb.qty / unitCount).toFixed(1) : "—";
              const p  = pct(pb.done, pb.qty);
              const ps = statusColor(p);
              return (
                <div key={pb.phaseId} className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-3 items-center hover:bg-muted/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                    <div>
                      <p className="text-xs font-bold text-foreground">{pb.phaseName}</p>
                      <p className="text-[10px] text-muted-foreground">{unitCount} units · {perUnit} {a.uom}/unit</p>
                    </div>
                  </div>
                  <span className="text-right text-xs font-semibold text-muted-foreground">{pb.qty.toLocaleString()}</span>
                  <div className="text-center text-xs font-semibold text-foreground">
                    {pb.done.toLocaleString()} <span className="text-[10.5px] text-muted-foreground font-normal">/ {pb.qty.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${p >= 100 ? "text-emerald-500" : p > 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {p}%
                    </span>
                    <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${ps.bar}`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                  <span className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {currency} {(pb.done * a.clientRate).toLocaleString()}
                  </span>
                </div>
              );
            })}
            <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-3 items-center bg-muted/20">
              <span className="text-xs font-black text-foreground">PROJECT TOTAL</span>
              <span className="text-right text-xs font-black text-foreground">{totalQty.toLocaleString()}</span>
              <span className="text-center text-xs font-black text-foreground">{doneQty.toLocaleString()} {a.uom}</span>
              <span className="text-right text-xs font-black text-primary">{progress}%</span>
              <span className="text-right text-xs font-black text-emerald-600 dark:text-emerald-400">{currency} {earnedValue.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* UNIT LEVEL */}
        {a.level === "unit" && (
          <div>
            <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-2 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Unit / Villa</span>
              <span className="text-right">Qty ({a.uom})</span>
              <span className="text-center">Done Qty</span>
              <span className="text-right">Progress</span>
              <span className="text-right">Earned ({currency})</span>
            </div>
            <div className="divide-y divide-border/40 max-h-[460px] overflow-y-auto">
              {(a.unitBreakdown || []).map((ub) => {
                const unit      = (units || []).find((u) => u.id === ub.unitId);
                const unitPhase = unit ? (phases || []).find((ph) => ph.id === unit.phaseId) : null;
                const col       = unitPhase ? getPhaseColor(unitPhase.colorId) : PHASE_COLORS[0];
                const p  = pct(ub.done, ub.qty);
                const ps = statusColor(p);
                const unitLogs  = logs.filter((l) => l.assignmentId === a.id && l.unitId === ub.unitId);
                const isExpanded = expandedUnit === ub.unitId;

                return (
                  <div key={ub.unitId} className="divide-y divide-border/20">
                    <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-2.5 items-center hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedUnit(isExpanded ? null : ub.unitId)}
                          className="w-6 h-6 rounded shrink-0 cursor-pointer text-muted-foreground hover:bg-muted flex items-center justify-center"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9.5px] font-black shrink-0 ${col.bg} ${col.text}`}>
                          {ub.unitId}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{unit?.name || ub.unitId}</p>
                          {unitPhase && <p className="text-[10px] text-muted-foreground">{unitPhase.name}</p>}
                        </div>
                      </div>
                      <span className="text-right text-xs font-semibold text-muted-foreground">{ub.qty.toLocaleString()}</span>
                      <div className="text-center text-xs font-semibold text-foreground">
                        {ub.done.toLocaleString()} <span className="text-[10.5px] text-muted-foreground font-normal">/ {ub.qty.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${p >= 100 ? "text-emerald-500" : p > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {p >= 100 ? "✓ " : ""}{p}%
                        </span>
                        <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden w-full">
                          <div className={`h-full rounded-full ${ps.bar}`} style={{ width: `${p}%` }} />
                        </div>
                      </div>
                      <span className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {currency} {(ub.done * a.clientRate).toLocaleString()}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="bg-muted/10 px-5 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Progress Logs ({unitLogs.length})
                        </p>
                        {unitLogs.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">No logs yet for this unit</p>
                        ) : (
                          <div className="space-y-1.5">
                            {unitLogs.map((log) => (
                              <div key={log.id} className="flex items-center gap-3 text-[11px]">
                                <span className="text-muted-foreground w-20 shrink-0">{log.date}</span>
                                <span className="font-semibold text-foreground">+{log.qtyCompleted} {log.uom}</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{currency} {log.amountEarned?.toLocaleString()}</span>
                                <span className="text-muted-foreground flex-1 truncate">{log.notes}</span>
                                <LogStatusBadge status={log.status} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-3 border-t border-border items-center bg-muted/20">
              <span className="text-xs font-black text-foreground">PROJECT TOTAL</span>
              <span className="text-right text-xs font-black text-foreground">{totalQty.toLocaleString()} {a.uom}</span>
              <span className="text-center text-xs font-black text-foreground">{doneQty.toLocaleString()} {a.uom}</span>
              <span className="text-right text-xs font-black text-primary">{progress}%</span>
              <span className="text-right text-xs font-black text-emerald-600 dark:text-emerald-400">{currency} {earnedValue.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Assignment info footer */}
      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Assignee</p>
          <p className="font-semibold text-foreground mt-0.5">{a.assigneeName}</p>
          <p className="text-muted-foreground capitalize">{a.assigneeType}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Contract Value</p>
          <p className="font-semibold text-foreground mt-0.5">{currency} {contractValue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sub Cost</p>
          <p className="font-semibold text-foreground mt-0.5">
            {a.subRate ? `${currency} ${(totalQty * a.subRate).toLocaleString()}` : "—"}
          </p>
          {a.subRate && (
            <p className="text-emerald-600 dark:text-emerald-400 text-[10.5px]">
              Margin: {currency} {((a.clientRate - a.subRate) * totalQty).toLocaleString()}
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Target Date</p>
          <p className="font-semibold text-foreground mt-0.5">{a.targetDate || "—"}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Assign Wizard ────────────────────────────────────────────────────── */
function AssignWizard({ projectId, project, phases, units, scopes, assigneeOptions = [], currency = "SAR", onClose, onSave }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [expandedTrades, setExpandedTrades] = useState({});
  const [scopeSearch, setScopeSearch] = useState("");
  const [bulkQtyVal, setBulkQtyVal] = useState("");

  const [form, setForm] = useState({
    level: "unit",
    scopeId: "",
    scopeName: "",
    trade: "",
    tradeIcon: "🏗️",
    uom: "",
    clientRate: "",
    subRate: "",
    assigneeType: "contractor",
    assigneeId: "",
    assigneeName: "",
    targetDate: "",
    notes: "",
    totalQty: "",
    phaseBreakdown: phases.map((ph) => ({ phaseId: ph.id, phaseName: ph.name, qty: 0, done: 0 })),
    unitBreakdown:  units.map((u)  => ({ unitId: u.id, qty: 0, done: 0 })),
  });

  /* Group scopes by trade, filtered by search */
  const scopesByTrade = useMemo(() => {
    const q = scopeSearch.toLowerCase();
    const filtered = scopes.filter((s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.trade.toLowerCase().includes(q)
    );
    return filtered.reduce((acc, s) => {
      if (!acc[s.trade]) acc[s.trade] = [];
      acc[s.trade].push(s);
      return acc;
    }, {});
  }, [scopes, scopeSearch]);

  const toggleTrade = (trade) => setExpandedTrades((t) => ({ ...t, [trade]: !t[trade] }));

  const selectScope = (scope) => {
    setForm((f) => ({
      ...f,
      scopeId:      scope.id,
      scopeName:    scope.name,
      trade:        scope.trade,
      tradeIcon:    TRADE_ICONS[scope.trade] || "🏗️",
      uom:          scope.uom,
    }));
  };

  const isSelected = (scopeId) => {
    return form.scopeId === scopeId;
  };

  const updatePhaseQty = (phaseId, qty) =>
    setForm((f) => ({
      ...f,
      phaseBreakdown: f.phaseBreakdown.map((p) =>
        p.phaseId === phaseId ? { ...p, qty: Number(qty) } : p
      ),
    }));

  const updateUnitQty = (unitId, qty) =>
    setForm((f) => ({
      ...f,
      unitBreakdown: f.unitBreakdown.map((u) =>
        u.unitId === unitId ? { ...u, qty: Number(qty) } : u
      ),
    }));

  const bulkFillUnits = (qty) =>
    setForm((f) => ({
      ...f,
      unitBreakdown: f.unitBreakdown.map((u) => ({ ...u, qty: Number(qty) })),
    }));

  const clearAllUnits = () => {
    setForm((f) => ({
      ...f,
      unitBreakdown: f.unitBreakdown.map((u) => ({ ...u, qty: 0 })),
    }));
    setBulkQtyVal("");
  };

  const addPresetQty = (delta) => {
    const newVal = Math.max(0, (Number(bulkQtyVal) || 0) + delta);
    setBulkQtyVal(newVal);
    bulkFillUnits(newVal);
  };

  const totalQtyPreview = form.level === "unit"
    ? (form.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)
    : form.level === "phase"
    ? (form.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)
    : Number(form.totalQty) || 0;

  const isStep3Valid = useMemo(() => {
    if (!form.clientRate || Number(form.clientRate) <= 0) return false;
    if (!form.assigneeId) return false;
    if (form.assigneeType === "contractor") {
      if (!form.subRate || Number(form.subRate) <= 0) return false;
    }
    return true;
  }, [form.clientRate, form.assigneeType, form.assigneeId, form.subRate]);

  const handleSave = async () => {
    if (!isStep3Valid) return;
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        projectId,
        clientRate: Number(form.clientRate),
        subRate: form.subRate ? Number(form.subRate) : null,
        totalQty: totalQtyPreview,
      });
    } catch (err) {
      // Handled by store/parent
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = form.scopeName && form.uom;

  const STEPS = [
    { label: "Select Scope", desc: "Pick level & work scope" },
    { label: "Set Quantities", desc: "Configure work breakdown" },
    { label: "Assign & Rate", desc: "Assignee & rate cards" }
  ];

  const filledUnitsCount = (form.unitBreakdown || []).filter(u => u.qty > 0).length;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Assign Scope to Project</h3>
              <p className="text-[10.5px] text-muted-foreground mt-0.5">Project: <span className="font-bold text-foreground">{project?.name}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={submitting} 
            className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-none bg-transparent outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Wizard Steps Progress Indicator */}
        <div className="bg-muted/10 border-b border-border/60 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            {STEPS.map((stepItem, i) => {
              const sNum = i + 1;
              const active = step === sNum;
              const done   = step > sNum;
              return (
                <div key={sNum} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                      ${active 
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/15" 
                        : done 
                        ? "bg-emerald-500 text-white" 
                        : "bg-muted text-muted-foreground border border-border"}`}>
                      {done ? <Check size={12} className="stroke-[3]" /> : sNum}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className={`text-[11px] font-bold leading-none ${active ? "text-primary font-extrabold" : done ? "text-emerald-500 font-bold" : "text-muted-foreground"}`}>
                        {stepItem.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground/75 mt-0.5">{stepItem.desc}</p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-4 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${done ? "bg-emerald-500 w-full" : active ? "bg-primary w-1/2" : "w-0"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">

          {/* ── STEP 1: Select Scope + Level ──────────────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-3 duration-250">

              {/* Level picker */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider block mb-2.5">1. Assignment Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(LEVEL_INFO).map(([key, info]) => {
                    const Icon   = info.icon;
                    const active = form.level === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, level: key }))}
                        className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col gap-1.5 hover:scale-[1.01] hover:shadow-sm
                          ${active 
                            ? `${info.border} ${info.bg} ring-1 ring-primary/10 shadow-xs` 
                            : "border-border bg-card hover:bg-muted/40"}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? info.bg : "bg-muted"} ${active ? info.color : "text-muted-foreground"}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className={`text-[12px] font-bold ${active ? info.color : "text-foreground"}`}>{info.label}</p>
                          <p className="text-[9.5px] text-muted-foreground mt-0.5 leading-snug">{info.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider block">2. Select Scope</label>
                  {form.scopeName && (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md flex items-center gap-1">
                      <Check size={10} className="stroke-[2.5]" />
                      Selected: {form.scopeName}
                    </span>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search scopes or trade..."
                    value={scopeSearch}
                    onChange={(e) => setScopeSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-muted/60 text-xs text-foreground placeholder-muted-foreground/75 rounded-xl border border-border outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary"
                  />
                  {scopeSearch && (
                    <button 
                      type="button" 
                      onClick={() => setScopeSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Scope tree */}
                <div className="border border-border rounded-xl bg-card overflow-hidden max-h-[220px] overflow-y-auto divide-y divide-border/40 shadow-inner">
                  {Object.keys(scopesByTrade).length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                      <Layers size={20} className="opacity-20" />
                      <span>No scopes match your search criteria</span>
                    </div>
                  ) : (
                    Object.entries(scopesByTrade).map(([trade, tradeScopes]) => {
                      const tradeIcon = TRADE_ICONS[trade] || "🏗️";
                      const isTradeOpen = expandedTrades[trade] !== false; // default open
                      return (
                        <div key={trade} className="bg-card">
                          {/* Trade header */}
                          <button
                            type="button"
                            onClick={() => toggleTrade(trade)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer sticky top-0 z-10 border-b border-border/40"
                          >
                            <span className="text-xs">{tradeIcon}</span>
                            <span className="flex-1 text-left text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{trade}</span>
                            <span className="text-[9.5px] font-semibold text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">{tradeScopes.length}</span>
                            {isTradeOpen ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                          </button>

                          {isTradeOpen && (
                            <div className="divide-y divide-border/20">
                              {tradeScopes.map((scope) => {
                                const scopeSelected = isSelected(scope.id);
                                return (
                                  <button
                                    key={scope.id}
                                    type="button"
                                    onClick={() => selectScope(scope)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-all duration-150
                                      ${scopeSelected
                                        ? "bg-primary/5 hover:bg-primary/8 border-l-2 border-l-primary"
                                        : "hover:bg-muted/20"}`}
                                  >
                                    {/* Radio dot */}
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all
                                      ${scopeSelected ? "border-primary bg-primary shadow-2xs" : "border-border bg-muted/40"}`}>
                                      {scopeSelected && <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />}
                                    </div>
                                    {/* Scope name */}
                                    <span className={`text-xs font-semibold flex-1 truncate ${scopeSelected ? "text-primary font-bold" : "text-foreground"}`}>
                                      {scope.name}
                                    </span>
                                    {/* UOM badge */}
                                    <span className={`text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-md shrink-0 transition-colors border
                                      ${scopeSelected
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "bg-muted text-muted-foreground border-border/60"}`}>
                                      {scope.uom}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected scope summary card */}
              {form.scopeName && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3.5">
                  <div className="flex items-center gap-3.5 p-3.5 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden shadow-2xs">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-6 -mt-6 blur-md pointer-events-none" />
                    <span className="text-2xl shrink-0 p-1.5 bg-primary/10 rounded-lg">{form.tradeIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-extrabold text-foreground truncate">{form.scopeName}</p>
                      <p className="text-[9.5px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{form.trade}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 relative z-10">
                      <div className="flex flex-col items-end">
                        <span className="text-[8.5px] uppercase font-bold text-muted-foreground/80 tracking-wider">Unit (UOM)</span>
                        <span className="text-[11px] font-black font-mono px-2.5 py-0.5 rounded-lg bg-card border border-border text-foreground shadow-2xs">
                          {form.uom}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, scopeId: '', scopeName: '', trade: '', tradeIcon: '🏗️', uom: '' }))}
                        title="Clear selection"
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Scope name override */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">Scope Name / Label Override</label>
                    <input
                      type="text"
                      value={form.scopeName}
                      onChange={(e) => setForm((f) => ({ ...f, scopeName: e.target.value }))}
                      placeholder="e.g. Ground Floor Slab Casting"
                      className="block mt-1 w-full px-3 py-2 bg-muted/50 text-xs text-foreground rounded-lg border border-border outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Quantities ───────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-3 duration-250">
              
              {/* Selected scope summary badge */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${LEVEL_INFO[form.level]?.border} ${LEVEL_INFO[form.level]?.bg} shadow-2xs`}>
                <span className="text-2xl p-1 bg-card/60 rounded-lg">{form.tradeIcon}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-extrabold ${LEVEL_INFO[form.level]?.color}`}>
                    {form.scopeName}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Level: <span className="font-bold text-foreground">{LEVEL_INFO[form.level]?.label}</span> · UOM: <span className="font-bold text-foreground">{form.uom}</span>
                  </p>
                </div>
              </div>

              {/* PROJECT LEVEL */}
              {form.level === "project" && (
                <div className="space-y-2 animate-in zoom-in-95 duration-200">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1 block">
                    Total Contract Quantity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.totalQty}
                      onChange={(e) => setForm((f) => ({ ...f, totalQty: e.target.value }))}
                      placeholder="e.g. 1000"
                      className="block w-full pl-3 pr-14 py-3 bg-muted/60 text-base font-extrabold text-foreground rounded-xl border border-border outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono px-2 py-0.5 bg-card border border-border rounded-md text-muted-foreground shadow-2xs">
                      {form.uom}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal pl-1">
                    At the Project level, you define a single dynamic pool of quantities. Progress updates can be logged directly against this pool from any workspace area.
                  </p>
                </div>
              )}

              {/* PHASE LEVEL */}
              {form.level === "phase" && (
                <div className="space-y-3.5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Specify Quantity per Phase</p>
                    {totalQtyPreview > 0 && (
                      <span className="text-[10.5px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                        Total: {totalQtyPreview.toLocaleString()} {form.uom}
                      </span>
                    )}
                  </div>
                  
                  {phases.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground bg-muted/30 border border-dashed border-border rounded-xl">
                      No phases defined. Please configure project phases under the Units tab first.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {(form.phaseBreakdown || []).map((pb) => {
                        const phase = phases.find((ph) => ph.id === pb.phaseId);
                        const col   = phase ? PHASE_COLORS.find((c) => c.id === phase.colorId) || PHASE_COLORS[0] : PHASE_COLORS[0];
                        const unitCount = phase ? (phase.unitIds || []).length : 0;
                        const perUnit   = pb.qty > 0 && unitCount > 0 ? (pb.qty / unitCount).toFixed(1) : 0;
                        return (
                          <div key={pb.phaseId} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-2xs transition-all">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot} shadow-inner`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground">{pb.phaseName}</p>
                              <p className="text-[9.5px] text-muted-foreground">
                                {unitCount} unit{unitCount !== 1 ? 's' : ''}{perUnit > 0 ? ` · avg ${perUnit} ${form.uom}/unit` : ""}
                              </p>
                            </div>
                            <div className="relative shrink-0">
                              <input
                                type="number"
                                value={pb.qty || ""}
                                onChange={(e) => updatePhaseQty(pb.phaseId, e.target.value)}
                                placeholder="Qty"
                                className="w-28 pl-3 pr-10 py-1.5 bg-muted/50 text-xs text-foreground rounded-lg border border-border outline-none focus:border-primary text-right font-extrabold"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground uppercase">{form.uom}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* UNIT LEVEL */}
              {form.level === "unit" && (
                <div className="space-y-3.5 animate-in zoom-in-95 duration-200">
                  
                  {/* Bulk Fill controls card */}
                  <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Bulk Fill:</span>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="e.g. 50"
                          value={bulkQtyVal}
                          onChange={(e) => {
                            setBulkQtyVal(e.target.value);
                            bulkFillUnits(e.target.value);
                          }}
                          className="w-20 pl-2 pr-6 py-1 bg-card text-xs text-foreground border border-border rounded-lg outline-none focus:border-primary font-bold text-right"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground uppercase">{form.uom}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[10, 50, 100].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => addPresetQty(d)}
                            className="px-1.5 py-0.5 bg-card hover:bg-muted text-[9.5px] font-bold rounded border border-border text-foreground transition-all cursor-pointer"
                          >
                            +{d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllUnits}
                      className="px-2.5 py-1 hover:bg-rose-500/10 text-rose-500 text-[10.5px] font-bold rounded-lg border border-rose-500/20 transition-all cursor-pointer bg-card"
                    >
                      Clear All
                    </button>
                  </div>

                  {units.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground bg-muted/30 border border-dashed border-border rounded-xl">
                      No units defined. Please add units/villas under the Units tab first.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">Unit Breakdown</p>
                        <span className="text-[10.5px] font-semibold text-muted-foreground">
                          Filled: <strong className="text-foreground">{filledUnitsCount} / {units.length}</strong>
                          {totalQtyPreview > 0 && <span> · Total: <strong className="text-primary font-bold">{totalQtyPreview.toLocaleString()} {form.uom}</strong></span>}
                        </span>
                      </div>

                      <div className="border border-border rounded-xl overflow-hidden max-h-[190px] overflow-y-auto divide-y divide-border/40 shadow-inner bg-card">
                        {/* Units grouped by phase */}
                        {phases.map((phase) => {
                          const col     = PHASE_COLORS.find((c) => c.id === phase.colorId) || PHASE_COLORS[0];
                          const phUnits = units.filter((u) => u.phaseId === phase.id);
                          if (phUnits.length === 0) return null;
                          return (
                            <div key={phase.id} className="bg-card">
                              <div className={`px-3 py-1.5 ${col.bg} border-b border-border/40 flex items-center gap-2 sticky top-0 z-10`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                                <p className={`text-[9px] uppercase font-extrabold tracking-wider ${col.text}`}>{phase.name}</p>
                                <span className={`text-[9px] ${col.text} opacity-70 font-semibold`}>· {phUnits.length} units</span>
                              </div>
                              <div className="divide-y divide-border/20">
                                {phUnits.map((unit) => {
                                  const ub = (form.unitBreakdown || []).find((u) => u.unitId === unit.id);
                                  return (
                                    <div key={unit.id} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/10 transition-colors">
                                      <div className={`w-8.5 h-7 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${col.bg} ${col.text} border border-current/10`}>
                                        {unit.id}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11.5px] font-bold text-foreground truncate">{unit.name}</p>
                                        {unit.type && <p className="text-[9.5px] text-muted-foreground mt-0.5">{unit.type}</p>}
                                      </div>
                                      <div className="relative shrink-0">
                                        <input
                                          type="number"
                                          value={ub?.qty || ""}
                                          onChange={(e) => updateUnitQty(unit.id, e.target.value)}
                                          placeholder="0"
                                          className="w-24 pl-2 pr-8 py-1 bg-muted/40 text-xs text-foreground rounded-lg border border-border outline-none focus:border-primary text-right font-bold"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-semibold text-muted-foreground uppercase">{form.uom}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Units with no phase */}
                        {units.filter((u) => !u.phaseId || !phases.find((ph) => ph.id === u.phaseId)).length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 bg-muted/40 border-b border-border/40 flex items-center gap-2 sticky top-0 z-10 text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                              <p className="text-[9px] uppercase font-extrabold tracking-wider">Unassigned Units</p>
                            </div>
                            <div className="divide-y divide-border/20">
                              {units.filter((u) => !u.phaseId || !phases.find((ph) => ph.id === u.phaseId)).map((unit) => {
                                const ub = (form.unitBreakdown || []).find((u) => u.unitId === unit.id);
                                return (
                                  <div key={unit.id} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/10 transition-colors">
                                    <div className="w-8.5 h-7 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 bg-muted text-muted-foreground border border-border/60">
                                      {unit.id}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11.5px] font-bold text-foreground truncate">{unit.name}</p>
                                      {unit.type && <p className="text-[9.5px] text-muted-foreground mt-0.5">{unit.type}</p>}
                                    </div>
                                    <div className="relative shrink-0">
                                      <input
                                        type="number"
                                        value={ub?.qty || ""}
                                        onChange={(e) => updateUnitQty(unit.id, e.target.value)}
                                        placeholder="0"
                                        className="w-24 pl-2 pr-8 py-1 bg-muted/40 text-xs text-foreground rounded-lg border border-border outline-none focus:border-primary text-right font-bold"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-semibold text-muted-foreground uppercase">{form.uom}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Warning */}
              {totalQtyPreview <= 0 && (
                <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-[10.5px] font-semibold text-rose-500 flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>A total scope quantity greater than 0 is required to proceed to the assignment step.</span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Assign & Rate ─────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4.5 animate-in slide-in-from-right-3 duration-250">
              
              {/* Rates */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-0.5 pl-1">
                    <span>Client Contract Rate</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10.5px] font-bold text-muted-foreground">{currency}</span>
                    <input
                      type="number"
                      value={form.clientRate}
                      onChange={(e) => setForm((f) => ({ ...f, clientRate: e.target.value }))}
                      placeholder="Rate charged to client"
                      className={`block w-full pl-11 pr-16 py-2.5 bg-muted/50 text-foreground text-sm font-extrabold rounded-xl border outline-none focus:border-primary transition-all
                        ${form.clientRate && Number(form.clientRate) <= 0 ? "border-rose-500/50 focus:ring-rose-500" : "border-border focus:ring-primary"}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9.5px] font-bold text-muted-foreground uppercase">/ {form.uom || "unit"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-0.5 pl-1">
                    <span>Subcontractor Rate</span>
                    {form.assigneeType === "contractor" && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10.5px] font-bold text-muted-foreground">{currency}</span>
                    <input
                      type="number"
                      value={form.subRate}
                      onChange={(e) => setForm((f) => ({ ...f, subRate: e.target.value }))}
                      placeholder={form.assigneeType === "contractor" ? "Rate paid to sub" : "Optional"}
                      className={`block w-full pl-11 pr-16 py-2.5 bg-muted/50 text-foreground text-sm rounded-xl border outline-none focus:border-primary transition-all
                        ${form.assigneeType === "contractor" && (!form.subRate || Number(form.subRate) <= 0) ? "border-rose-500/50 focus:ring-rose-500 font-medium" : "border-border focus:ring-primary font-extrabold"}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9.5px] font-bold text-muted-foreground uppercase">/ {form.uom || "unit"}</span>
                  </div>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-0.5 pl-1 block mb-1">
                  <span>Assign To</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1 mb-2">
                  {[
                    { type: "contractor", label: "Contractor", icon: Building2 },
                    { type: "team", label: "Labour Team", icon: Users }
                  ].map((item) => {
                    const BtnIcon = item.icon;
                    const active = form.assigneeType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, assigneeType: item.type, assigneeId: "", assigneeName: "" }))}
                        className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2
                          ${active 
                            ? "bg-primary/8 border-primary/30 text-primary font-bold shadow-2xs" 
                            : "bg-muted border-border text-muted-foreground hover:bg-muted/80"}`}
                      >
                        <BtnIcon size={13} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <select
                  value={form.assigneeId}
                  onChange={(e) => {
                    const c = assigneeOptions.find((x) => x.id === e.target.value);
                    setForm((f) => ({ ...f, assigneeId: e.target.value, assigneeName: c?.name || "" }));
                  }}
                  className={`block w-full px-3 py-2.5 bg-muted/50 text-xs text-foreground rounded-xl border outline-none focus:border-primary cursor-pointer transition-all
                    ${!form.assigneeId ? "border-rose-500/50" : "border-border"}`}
                >
                  <option value="">Select {form.assigneeType === "contractor" ? "contractor" : "labour team"}...</option>
                  {assigneeOptions.filter((c) => c.type === form.assigneeType).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Date & Icon */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">Target Completion Date</label>
                  <div className="relative mt-1">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={form.targetDate}
                      onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                      className="block w-full pl-9 pr-3 py-2 bg-muted/50 text-xs text-foreground rounded-xl border border-border outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">Trade Icon</label>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {["🏗️", "⚡", "🚰", "🎨", "🧱", "🔧", "🪵", "♨️", "🔥", "📡"].map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, tradeIcon: icon }))}
                        className={`w-7.5 h-7.5 text-sm rounded-lg cursor-pointer transition-all border border-transparent
                          ${form.tradeIcon === icon 
                            ? "bg-primary/10 border-primary/20 scale-105 ring-1 ring-primary/30" 
                            : "bg-muted/70 hover:bg-muted"}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Enter scope-specific instructions or notes..."
                  className="block mt-1 w-full px-3 py-2 bg-muted/50 text-xs text-foreground rounded-xl border border-border outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Contract summary card */}
              {form.clientRate && totalQtyPreview > 0 && (
                <div className="p-4 bg-emerald-500/5 border border-dashed border-emerald-500/25 rounded-xl space-y-2 relative overflow-hidden animate-in fade-in duration-200">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 blur-md pointer-events-none" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9.5px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Work Assignment Summary</p>
                      <p className="text-xs text-foreground font-bold mt-0.5">
                        {form.scopeName}
                        <span className="text-muted-foreground font-normal"> · {LEVEL_INFO[form.level]?.label}</span>
                      </p>
                    </div>
                    <span className="text-[8.5px] uppercase font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md">Ready to Assign</span>
                  </div>

                  <div className="pt-1.5 border-t border-emerald-500/10 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Contract Quantity:</span>
                      <p className="font-bold text-foreground font-mono mt-0.5">{totalQtyPreview.toLocaleString()} {form.uom}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Client Rate:</span>
                      <p className="font-bold text-foreground mt-0.5">{currency} {Number(form.clientRate).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/10 flex flex-wrap justify-between items-baseline gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Gross Value:</span>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {currency} {(totalQtyPreview * Number(form.clientRate)).toLocaleString()}
                      </p>
                    </div>
                    {form.assigneeType === "contractor" && form.subRate && (
                      <div className="text-right">
                        <span className="text-[9.5px] text-muted-foreground">Estimated Net Profit Margin:</span>
                        <p className="text-[12.5px] font-extrabold text-primary">
                          {currency} {((Number(form.clientRate) - Number(form.subRate)) * totalQtyPreview).toLocaleString()}
                          <span className="text-[10.5px] font-semibold text-muted-foreground ml-1">
                            ({((Number(form.clientRate) - Number(form.subRate)) / Number(form.clientRate) * 100).toFixed(0)}% Margin)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-muted-foreground bg-card hover:bg-muted/40 rounded-xl cursor-pointer transition-all border border-border disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          <div className="flex gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !canProceed) ||
                  (step === 2 && totalQtyPreview <= 0)
                }
                className="px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={!form.scopeName || !form.uom || !isStep3Valid || submitting}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} className="stroke-[2.5]" /> Save Assignment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Log Status Badge ───────────────────────────────────────────────── */
function LogStatusBadge({ status }) {
  const map = {
    Approved:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "Under Review": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Flagged:       "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };
  return (
    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
