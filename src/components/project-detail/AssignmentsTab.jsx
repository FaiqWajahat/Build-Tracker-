"use client";

import { useState, useMemo } from "react";
import {
  Plus, X, Check, ChevronDown, ChevronUp, Search, Layers,
  Home, FolderOpen, User, Edit3, Trash2, AlertCircle,
  ArrowRight, Building2, BarChart2, TrendingUp, DollarSign,
  Zap, Wrench, Droplets, Paintbrush, Construction
} from "lucide-react";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";
import useScopeStore from "@/store/useScopeStore";
import useProgressStore from "@/store/useProgressStore";

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const statusColor = (p) => {
  if (p >= 100) return { bar: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Complete" };
  if (p >= 75)  return { bar: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",           label: "In Progress" };
  if (p >= 40)  return { bar: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",       label: "Ongoing" };
  if (p > 0)    return { bar: "bg-rose-500",    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",          label: "Behind" };
  return          { bar: "bg-muted",            badge: "bg-muted text-muted-foreground",                           label: "Not Started" };
};

const LEVEL_INFO = {
  project: {
    icon: FolderOpen, label: "Project Level",
    desc: "One shared qty pool for the entire project. All logged progress draws from this pool.",
    color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20",
  },
  phase: {
    icon: Layers, label: "Phase Level",
    desc: "Assign a qty per phase (e.g. Phase A = 3000 LM). Per-unit share = phase qty ÷ units in phase.",
    color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20",
  },
  unit: {
    icon: Home, label: "Unit Level",
    desc: "Each villa/unit gets its own quantity. Best for scopes where each unit differs (e.g. slab area).",
    color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
  },
};

const CONTRACTORS = [
  { id: "CON-001", name: "Gulf Build Co.", type: "contractor" },
  { id: "CON-002", name: "Al-Farsi Electric", type: "contractor" },
  { id: "CON-003", name: "Al-Nour Finishes", type: "contractor" },
  { id: "CON-004", name: "Gulf Plumbing Co.", type: "contractor" },
  { id: "TEAM-01", name: "Team A (In-house)", type: "team" },
  { id: "TEAM-02", name: "Team B (In-house)", type: "team" },
  { id: "TEAM-03", name: "Team C (In-house)", type: "team" },
];

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function AssignmentsTab({ projectId }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const addAssignment = useAssignmentStore((s) => s.addAssignment);
  const updateAssignment = useAssignmentStore((s) => s.updateAssignment);
  const deleteAssignment = useAssignmentStore((s) => s.deleteAssignment);
  const scopes = useScopeStore((s) => s.scopes);
  const allLogs = useProgressStore((s) => s.logs);

  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === projectId), [allAssignments, projectId]);
  const logs = useMemo(() => allLogs.filter((l) => l.projectId === projectId), [allLogs, projectId]);

  const [selectedId, setSelectedId] = useState(assignments[0]?.id || null);
  const [showWizard, setShowWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrade, setFilterTrade] = useState("All");

  const selectedAssignment = assignments.find((a) => a.id === selectedId);
  const phases = project?.phases || [];
  const units = project?.units || [];

  const getPhaseColor = (colorId) => PHASE_COLORS.find((c) => c.id === colorId) || PHASE_COLORS[0];

  // Compute total and done qty for display
  const computeTotals = (a) => {
    let totalQty = a.level === "unit"
      ? (a.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)
      : a.level === "phase"
      ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)
      : (a.totalQty || 0);

    let doneQty = a.level === "unit"
      ? (a.unitBreakdown || []).reduce((s, u) => s + (u.done || 0), 0)
      : a.level === "phase"
      ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.done || 0), 0)
      : logs.filter((l) => l.assignmentId === a.id).reduce((s, l) => s + (l.qtyCompleted || 0), 0);

    return { totalQty, doneQty };
  };

  const allTrades = [...new Set(assignments.map((a) => a.trade))];
  const filtered = assignments.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = a.scopeName.toLowerCase().includes(q) || a.assigneeName?.toLowerCase().includes(q);
    const matchTrade = filterTrade === "All" || a.trade === filterTrade;
    return matchSearch && matchTrade;
  });

  // Group by trade for left panel
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
            {assignments.length} scopes assigned · project / phase / unit level
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} /> Assign Scope
        </button>
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
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-0.5">
            {Object.entries(grouped).map(([trade, items]) => (
              <div key={trade}>
                <p className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider px-1 mb-1.5">{trade}</p>
                <div className="space-y-1">
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
                        className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer
                          ${active
                            ? "bg-primary/6 border-primary/30 shadow-xs"
                            : "bg-card border-border hover:bg-muted/40 hover:border-border/80"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{a.scopeName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[9.5px] font-semibold flex items-center gap-0.5 ${LEVEL_INFO[a.level]?.color}`}>
                                <LevelIcon size={9} /> {LEVEL_INFO[a.level]?.label}
                              </span>
                              <span className="text-[9.5px] text-muted-foreground">· {a.uom}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${sc.badge}`}>
                            {progress}%
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${sc.bar}`} style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 truncate">
                          {a.assigneeName} · {doneQty.toLocaleString()}/{totalQty.toLocaleString()} {a.uom}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="py-12 text-center">
                <AlertCircle size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No scopes assigned yet</p>
                <button onClick={() => setShowWizard(true)} className="mt-3 text-xs font-semibold text-primary hover:underline cursor-pointer">
                  + Assign first scope
                </button>
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
              onUpdate={(data) => updateAssignment(selectedAssignment.id, data)}
              onDelete={() => {
                deleteAssignment(selectedAssignment.id);
                setSelectedId(assignments.find((a) => a.id !== selectedAssignment.id)?.id || null);
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-card border border-border border-dashed rounded-xl">
              <div className="text-center">
                <Layers size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Select a scope assignment to view details</p>
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
          onClose={() => setShowWizard(false)}
          onSave={(data) => {
            const saved = addAssignment(data);
            setSelectedId(saved.id);
            setShowWizard(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Assignment Detail Panel ─────────────────────────────────────────── */
function AssignmentDetail({ assignment: a, project, logs, phases, units, computeTotals, getPhaseColor, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [expandedUnit, setExpandedUnit] = useState(null);

  const { totalQty, doneQty } = computeTotals(a);
  const progress = pct(doneQty, totalQty);
  const sc = statusColor(progress);
  const assignmentLogs = logs.filter((l) => l.assignmentId === a.id);
  const earnedValue = doneQty * a.clientRate;
  const contractValue = totalQty * a.clientRate;
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
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-start gap-3">
            <span className="text-2xl p-2.5 bg-muted rounded-xl shrink-0">{a.tradeIcon}</span>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{a.trade}</p>
              <h2 className="text-lg font-extrabold text-foreground mt-0.5">{a.scopeName}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]">
                <span className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border ${LevelInfo.border} ${LevelInfo.bg} ${LevelInfo.color}`}>
                  <LevelInfo.icon size={10} /> {LevelInfo.label}
                </span>
                <span className="text-muted-foreground font-semibold">UOM: <strong className="text-foreground">{a.uom}</strong></span>
                <span className="text-muted-foreground font-semibold">Assignee: <strong className="text-foreground">{a.assigneeName}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDelete()}
              className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer transition-colors"
            ><Trash2 size={14} /></button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Progress</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-foreground">{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${sc.bar}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Qty Done / Total</p>
            <p className="text-base font-bold text-foreground mt-1">
              {doneQty.toLocaleString()} <span className="text-muted-foreground text-xs font-semibold">/ {totalQty.toLocaleString()} {a.uom}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Earned Value</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              SAR {earnedValue.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">of SAR {contractValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Rates</p>
            <p className="text-sm font-bold text-foreground mt-1">
              SAR {a.clientRate?.toLocaleString()} <span className="text-muted-foreground text-xs">/ {a.uom}</span>
            </p>
            {a.subRate && (
              <p className="text-[10px] text-muted-foreground">Sub: SAR {a.subRate?.toLocaleString()}/{a.uom}</p>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Quantity Breakdown</h3>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">
              {a.level === "project" ? "Whole-project pool — logged from daily progress" :
               a.level === "phase" ? "Per-phase quantities" : "Per-unit quantities"}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.badge}`}>{sc.label}</span>
        </div>

        {/* PROJECT LEVEL */}
        {a.level === "project" && (
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Total Contract Qty</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{totalQty.toLocaleString()}</p>
                <p className="text-[10.5px] text-muted-foreground">{a.uom}</p>
              </div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Completed</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{doneQty.toLocaleString()}</p>
                <p className="text-[10.5px] text-muted-foreground">{a.uom} ({progress}%)</p>
              </div>
              <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Remaining</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{Math.max(0, totalQty - doneQty).toLocaleString()}</p>
                <p className="text-[10.5px] text-muted-foreground">{a.uom}</p>
              </div>
            </div>
            {/* Logs for project-level */}
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-2 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Log Date & Notes</span>
                <span className="text-right pr-4">Qty</span>
                <span className="text-right pr-4">Earned SAR</span>
                <span className="text-right">Status</span>
              </div>
              <div className="divide-y divide-border/40 max-h-[280px] overflow-y-auto">
                {assignmentLogs.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6">No progress logged yet</p>
                ) : assignmentLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-2.5 items-center hover:bg-muted/10">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{log.date}</p>
                      <p className="text-[10.5px] text-muted-foreground">{log.notes || "—"}</p>
                    </div>
                    <span className="text-xs font-bold text-foreground pr-4">+{log.qtyCompleted} {log.uom}</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pr-4">SAR {log.amountEarned?.toLocaleString()}</span>
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
              <span className="text-right">Earned SAR</span>
            </div>
            {(a.phaseBreakdown || []).map((pb) => {
              const phase = (phases || []).find((ph) => ph.id === pb.phaseId);
              const col = phase ? getPhaseColor(phase.colorId) : PHASE_COLORS[0];
              const unitCount = phase ? (phase.unitIds || []).length : 0;
              const perUnit = unitCount > 0 ? (pb.qty / unitCount).toFixed(1) : "—";
              const p = pct(pb.done, pb.qty);
              const ps = statusColor(p);
              return (
                <div key={pb.phaseId} className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-3 items-center hover:bg-muted/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <div>
                      <p className="text-xs font-bold text-foreground">{pb.phaseName}</p>
                      <p className="text-[10px] text-muted-foreground">{unitCount} units · {perUnit} {a.uom}/unit</p>
                    </div>
                  </div>
                  <span className="text-right text-xs font-semibold text-muted-foreground">{pb.qty.toLocaleString()}</span>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      value={pb.done}
                      onChange={(e) => handlePhaseDoneChange(pb.phaseId, e.target.value)}
                      className="w-20 px-2 py-1 bg-card text-foreground border border-border rounded-lg text-right text-xs font-semibold outline-none focus:border-ring"
                      min={0} max={pb.qty}
                    />
                    <span className="text-[10.5px] text-muted-foreground">/ {pb.qty}</span>
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
                    SAR {(pb.done * a.clientRate).toLocaleString()}
                  </span>
                </div>
              );
            })}
            {/* Phase total row */}
            <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-3 items-center bg-muted/20">
              <span className="text-xs font-black text-foreground">PROJECT TOTAL</span>
              <span className="text-right text-xs font-black text-foreground">{totalQty.toLocaleString()}</span>
              <span className="text-center text-xs font-black text-foreground">{doneQty.toLocaleString()} {a.uom}</span>
              <span className="text-right text-xs font-black text-primary">{progress}%</span>
              <span className="text-right text-xs font-black text-emerald-600 dark:text-emerald-400">SAR {earnedValue.toLocaleString()}</span>
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
              <span className="text-right">Earned SAR</span>
            </div>
            <div className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
              {(a.unitBreakdown || []).map((ub) => {
                const unit = (units || []).find((u) => u.id === ub.unitId);
                const unitPhase = unit ? (phases || []).find((ph) => ph.id === unit.phaseId) : null;
                const col = unitPhase ? getPhaseColor(unitPhase.colorId) : PHASE_COLORS[0];
                const p = pct(ub.done, ub.qty);
                const ps = statusColor(p);
                const unitLogs = logs.filter((l) => l.assignmentId === a.id && l.unitId === ub.unitId);
                const isExpanded = expandedUnit === ub.unitId;

                return (
                  <div key={ub.unitId} className="divide-y divide-border/20">
                    <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-2.5 items-center hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedUnit(isExpanded ? null : ub.unitId)}
                          className="w-6 h-6 rounded shrink-0 cursor-pointer text-muted-foreground hover:bg-muted"
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
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={ub.done}
                          onChange={(e) => handleUnitDoneChange(ub.unitId, e.target.value)}
                          className="w-20 px-2 py-1 bg-card text-foreground border border-border rounded-lg text-right text-xs font-semibold outline-none focus:border-ring"
                          min={0} max={ub.qty}
                        />
                        <span className="text-[10.5px] text-muted-foreground">/ {ub.qty}</span>
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
                        SAR {(ub.done * a.clientRate).toLocaleString()}
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
                                <span className="text-emerald-600 dark:text-emerald-400">SAR {log.amountEarned?.toLocaleString()}</span>
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
            {/* Unit total row */}
            <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] px-4 py-3 border-t border-border items-center bg-muted/20">
              <span className="text-xs font-black text-foreground">PROJECT TOTAL</span>
              <span className="text-right text-xs font-black text-foreground">{totalQty.toLocaleString()} {a.uom}</span>
              <span className="text-center text-xs font-black text-foreground">{doneQty.toLocaleString()} {a.uom}</span>
              <span className="text-right text-xs font-black text-primary">{progress}%</span>
              <span className="text-right text-xs font-black text-emerald-600 dark:text-emerald-400">SAR {earnedValue.toLocaleString()}</span>
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
          <p className="font-semibold text-foreground mt-0.5">SAR {contractValue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sub Cost</p>
          <p className="font-semibold text-foreground mt-0.5">
            {a.subRate ? `SAR ${(totalQty * a.subRate).toLocaleString()}` : "—"}
          </p>
          {a.subRate && (
            <p className="text-emerald-600 dark:text-emerald-400 text-[10.5px]">
              Margin: SAR {((a.clientRate - a.subRate) * totalQty).toLocaleString()}
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
function AssignWizard({ projectId, project, phases, units, scopes, onClose, onSave }) {
  const [step, setStep] = useState(1);
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
    unitBreakdown: units.map((u) => ({ unitId: u.id, qty: 0, done: 0 })),
  });

  const [scopeSearch, setScopeSearch] = useState("");
  const scopesByTrade = scopes.reduce((acc, s) => {
    if (!acc[s.trade]) acc[s.trade] = [];
    acc[s.trade].push(s);
    return acc;
  }, {});

  const filteredScopes = scopes.filter((s) =>
    s.name.toLowerCase().includes(scopeSearch.toLowerCase()) ||
    s.trade.toLowerCase().includes(scopeSearch.toLowerCase())
  );

  const updatePhaseQty = (phaseId, qty) => {
    setForm((f) => ({
      ...f,
      phaseBreakdown: f.phaseBreakdown.map((p) =>
        p.phaseId === phaseId ? { ...p, qty: Number(qty) } : p
      ),
    }));
  };

  const updateUnitQty = (unitId, qty) => {
    setForm((f) => ({
      ...f,
      unitBreakdown: f.unitBreakdown.map((u) =>
        u.unitId === unitId ? { ...u, qty: Number(qty) } : u
      ),
    }));
  };

  const bulkFillUnits = (qty) => {
    setForm((f) => ({
      ...f,
      unitBreakdown: f.unitBreakdown.map((u) => ({ ...u, qty: Number(qty) })),
    }));
  };

  const handleSave = () => {
    const data = {
      ...form,
      projectId,
      clientRate: Number(form.clientRate),
      subRate: form.subRate ? Number(form.subRate) : null,
      totalQty: Number(form.totalQty),
    };
    onSave(data);
  };

  const selectedContractor = CONTRACTORS.find((c) => c.id === form.assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">Assign Scope to Project</h3>
            <p className="text-[11px] text-muted-foreground">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"><X size={16} /></button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-0 px-6 pt-4">
          {["Select Scope", "Set Quantities", "Assign & Rate"].map((label, i) => {
            const s = i + 1;
            const active = step === s;
            const done = step > s;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${active ? "text-primary" : done ? "text-emerald-500" : "text-muted-foreground"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${active ? "bg-primary text-primary-foreground" : done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    {done ? <Check size={10} /> : s}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-border mx-2" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* STEP 1: Select Scope + Level */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Level Picker */}
              <div>
                <p className="text-xs font-bold text-foreground mb-2">Assignment Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(LEVEL_INFO).map(([key, info]) => {
                    const Icon = info.icon;
                    const active = form.level === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setForm((f) => ({ ...f, level: key }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer
                          ${active ? `${info.border} ${info.bg}` : "border-border bg-muted/30 hover:bg-muted/60"}`}
                      >
                        <Icon size={14} className={active ? info.color : "text-muted-foreground"} />
                        <p className={`text-xs font-bold mt-1 ${active ? info.color : "text-foreground"}`}>{info.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{info.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope Picker */}
              <div>
                <p className="text-xs font-bold text-foreground mb-2">Select Scope from Library</p>
                <div className="relative mb-2">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search scope..."
                    value={scopeSearch}
                    onChange={(e) => setScopeSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring"
                  />
                </div>
                <div className="border border-border rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                  {Object.entries(
                    filteredScopes.reduce((acc, s) => {
                      if (!acc[s.trade]) acc[s.trade] = [];
                      acc[s.trade].push(s);
                      return acc;
                    }, {})
                  ).map(([trade, items]) => (
                    <div key={trade}>
                      <p className="px-3 py-1.5 text-[9.5px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/40 sticky top-0">{trade}</p>
                      {items.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setForm((f) => ({
                            ...f,
                            scopeId: s.id,
                            scopeName: s.name,
                            trade: s.trade,
                            uom: s.uom,
                          }))}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer
                            ${form.scopeId === s.id ? "bg-primary/8 text-primary" : "hover:bg-muted/40 text-foreground"}`}
                        >
                          <span className="text-xs font-semibold">{s.name}</span>
                          <span className="text-[10px] text-muted-foreground">{s.uom}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom scope name + UOM override */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Scope Name (override)</label>
                  <input
                    value={form.scopeName}
                    onChange={(e) => setForm((f) => ({ ...f, scopeName: e.target.value }))}
                    placeholder="e.g. Ground Floor Slab"
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Unit of Measure</label>
                  <select
                    value={form.uom}
                    onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring cursor-pointer"
                  >
                    <option value="">Select UOM</option>
                    {["m²","m³","LM","No.","Set","LS","Ton","kg"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Quantities */}
          {step === 2 && (
            <div className="space-y-4">
              <div className={`p-3 rounded-xl border ${LEVEL_INFO[form.level]?.border} ${LEVEL_INFO[form.level]?.bg}`}>
                <p className={`text-xs font-bold ${LEVEL_INFO[form.level]?.color}`}>{LEVEL_INFO[form.level]?.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{LEVEL_INFO[form.level]?.desc}</p>
              </div>

              {/* PROJECT LEVEL */}
              {form.level === "project" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Project Quantity ({form.uom})</label>
                  <input
                    type="number"
                    value={form.totalQty}
                    onChange={(e) => setForm((f) => ({ ...f, totalQty: e.target.value }))}
                    placeholder="e.g. 1000"
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-sm text-foreground rounded-lg border border-border outline-none focus:border-ring font-bold"
                  />
                  <p className="text-[10.5px] text-muted-foreground mt-2">
                    Progress will be logged freely from any unit/area across the project.
                  </p>
                </div>
              )}

              {/* PHASE LEVEL */}
              {form.level === "phase" && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground">Quantity per Phase ({form.uom})</p>
                  {phases.length === 0 && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      No phases defined. Go to Units tab to add phases first.
                    </p>
                  )}
                  {(form.phaseBreakdown || []).map((pb) => {
                    const phase = phases.find((ph) => ph.id === pb.phaseId);
                    const col = phase ? PHASE_COLORS.find((c) => c.id === phase.colorId) || PHASE_COLORS[0] : PHASE_COLORS[0];
                    const unitCount = phase ? (phase.unitIds || []).length : 0;
                    const perUnit = pb.qty > 0 && unitCount > 0 ? (pb.qty / unitCount).toFixed(1) : 0;
                    return (
                      <div key={pb.phaseId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground">{pb.phaseName}</p>
                          <p className="text-[10px] text-muted-foreground">{unitCount} units{perUnit > 0 ? ` · ${perUnit} ${form.uom}/unit` : ""}</p>
                        </div>
                        <input
                          type="number"
                          value={pb.qty || ""}
                          onChange={(e) => updatePhaseQty(pb.phaseId, e.target.value)}
                          placeholder="Qty"
                          className="w-24 px-2 py-1.5 bg-card text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring text-right font-bold"
                        />
                        <span className="text-[10.5px] text-muted-foreground w-8">{form.uom}</span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border text-right">
                    <p className="text-xs text-muted-foreground font-semibold">
                      Total: <strong className="text-foreground">
                        {(form.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0).toLocaleString()} {form.uom}
                      </strong>
                    </p>
                  </div>
                </div>
              )}

              {/* UNIT LEVEL */}
              {form.level === "unit" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Quantity per Unit ({form.uom})</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] text-muted-foreground">Fill all:</span>
                      <input
                        type="number"
                        placeholder="qty"
                        className="w-16 px-2 py-1 text-xs bg-muted border border-border rounded-lg outline-none focus:border-ring text-right text-foreground"
                        onChange={(e) => e.target.value && bulkFillUnits(e.target.value)}
                      />
                    </div>
                  </div>
                  {units.length === 0 && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      No units defined. Go to Units tab to add villas/units first.
                    </p>
                  )}
                  <div className="border border-border rounded-xl overflow-hidden max-h-[280px] overflow-y-auto divide-y divide-border/50">
                    {/* Group by phase */}
                    {phases.map((phase) => {
                      const col = PHASE_COLORS.find((c) => c.id === phase.colorId) || PHASE_COLORS[0];
                      const phUnits = units.filter((u) => u.phaseId === phase.id);
                      if (phUnits.length === 0) return null;
                      return (
                        <div key={phase.id}>
                          <div className={`px-3 py-1.5 ${col.bg} border-b border-border/40`}>
                            <p className={`text-[9.5px] uppercase font-bold tracking-wider ${col.text}`}>{phase.name}</p>
                          </div>
                          {phUnits.map((unit) => {
                            const ub = (form.unitBreakdown || []).find((u) => u.unitId === unit.id);
                            return (
                              <div key={unit.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${col.bg} ${col.text}`}>
                                  {unit.id}
                                </div>
                                <div className="flex-1">
                                  <p className="text-[11.5px] font-semibold text-foreground">{unit.name}</p>
                                  {unit.type && <p className="text-[10px] text-muted-foreground">{unit.type}</p>}
                                </div>
                                <input
                                  type="number"
                                  value={ub?.qty || ""}
                                  onChange={(e) => updateUnitQty(unit.id, e.target.value)}
                                  placeholder="0"
                                  className="w-20 px-2 py-1 bg-card text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring text-right font-bold"
                                />
                                <span className="text-[10.5px] text-muted-foreground w-8">{form.uom}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-right text-xs text-muted-foreground font-semibold">
                    Total: <strong className="text-foreground">
                      {(form.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0).toLocaleString()} {form.uom}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Assign & Rate */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Rates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Client Rate (SAR / {form.uom || "unit"})</label>
                  <input
                    type="number"
                    value={form.clientRate}
                    onChange={(e) => setForm((f) => ({ ...f, clientRate: e.target.value }))}
                    placeholder="e.g. 350"
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-foreground text-sm font-bold rounded-lg border border-border outline-none focus:border-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sub / Labour Rate (SAR / {form.uom || "unit"})</label>
                  <input
                    type="number"
                    value={form.subRate}
                    onChange={(e) => setForm((f) => ({ ...f, subRate: e.target.value }))}
                    placeholder="optional"
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-foreground text-sm rounded-lg border border-border outline-none focus:border-ring"
                  />
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Assign to</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setForm((f) => ({ ...f, assigneeType: "contractor" }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all
                      ${form.assigneeType === "contractor" ? "bg-primary/8 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground hover:bg-muted/80"}`}
                  >Contractor</button>
                  <button
                    onClick={() => setForm((f) => ({ ...f, assigneeType: "team" }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all
                      ${form.assigneeType === "team" ? "bg-primary/8 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground hover:bg-muted/80"}`}
                  >Labour Team</button>
                </div>
                <select
                  value={form.assigneeId}
                  onChange={(e) => {
                    const c = CONTRACTORS.find((x) => x.id === e.target.value);
                    setForm((f) => ({ ...f, assigneeId: e.target.value, assigneeName: c?.name || "" }));
                  }}
                  className="block mt-2 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring cursor-pointer"
                >
                  <option value="">Select assignee...</option>
                  {CONTRACTORS.filter((c) => c.type === form.assigneeType).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Target Completion Date</label>
                  <input
                    type="date"
                    value={form.targetDate}
                    onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Trade Icon</label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {["🏗️","⚡","🚰","🎨","🧱","🔧","🪵","♨️","🔥","📡"].map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setForm((f) => ({ ...f, tradeIcon: icon }))}
                        className={`w-8 h-8 text-base rounded-lg cursor-pointer transition-all ${form.tradeIcon === icon ? "bg-primary/10 ring-1 ring-primary" : "bg-muted hover:bg-muted/80"}`}
                      >{icon}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any scope-specific notes..."
                  className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring resize-none"
                />
              </div>

              {/* Summary */}
              {form.clientRate && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Contract Summary</p>
                  <p className="text-xs text-foreground font-semibold">
                    Scope: <strong>{form.scopeName}</strong> · {form.level.toUpperCase()} level
                  </p>
                  {form.level === "project" && form.totalQty && (
                    <p className="text-xs text-foreground">
                      {form.totalQty} {form.uom} × SAR {form.clientRate} = <strong className="text-emerald-600 dark:text-emerald-400">SAR {(Number(form.totalQty) * Number(form.clientRate)).toLocaleString()}</strong>
                    </p>
                  )}
                  {form.level === "unit" && (
                    <p className="text-xs text-foreground">
                      {(form.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)} {form.uom} × SAR {form.clientRate} = <strong className="text-emerald-600 dark:text-emerald-400">SAR {((form.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0) * Number(form.clientRate)).toLocaleString()}</strong>
                    </p>
                  )}
                  {form.level === "phase" && (
                    <p className="text-xs text-foreground">
                      {(form.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)} {form.uom} × SAR {form.clientRate} = <strong className="text-emerald-600 dark:text-emerald-400">SAR {((form.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0) * Number(form.clientRate)).toLocaleString()}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer transition-all"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          <div className="flex gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !form.scopeName}
                className="px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={!form.scopeName || !form.clientRate || !form.uom}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                ✓ Save Assignment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Log Status Badge ───────────────────────────────────────────────── */
function LogStatusBadge({ status }) {
  const map = {
    Approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "Under Review": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Flagged: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };
  return (
    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
