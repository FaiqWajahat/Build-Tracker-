"use client";

import { useMemo, useState } from "react";
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign, Home, Layers, FolderOpen } from "lucide-react";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const statusColor = (p) => {
  if (p >= 100) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Complete", dot: "bg-emerald-500" };
  if (p >= 75)  return { bar: "bg-blue-500",    text: "text-blue-600 dark:text-blue-400",       badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",       label: "In Progress", dot: "bg-blue-500" };
  if (p >= 40)  return { bar: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400",     badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",     label: "Ongoing", dot: "bg-amber-500" };
  if (p > 0)    return { bar: "bg-rose-500",    text: "text-rose-500",                          badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",        label: "Behind", dot: "bg-rose-500" };
  return          { bar: "bg-muted",            text: "text-muted-foreground",                  badge: "bg-muted text-muted-foreground",                         label: "Not Started", dot: "bg-muted-foreground" };
};

export default function ScopeProgressTab({ projectId }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);

  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === projectId), [allAssignments, projectId]);
  const logs = useMemo(() => allLogs.filter((l) => l.projectId === projectId), [allLogs, projectId]);
  const [selectedScope, setSelectedScope] = useState(null);
  const [viewMode, setViewMode] = useState("scope"); // "scope" | "unit" | "contractor"

  const phases = useMemo(() => project?.phases || [], [project?.phases]);
  const units = useMemo(() => project?.units || [], [project?.units]);

  const getPhaseColor = (colorId) => PHASE_COLORS.find((c) => c.id === colorId) || PHASE_COLORS[0];

  /* ── Compute totals for each assignment ─── */
  const enriched = useMemo(() => assignments.map((a) => {
    const totalQty = a.level === "unit"
      ? (a.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)
      : a.level === "phase"
      ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)
      : a.totalQty || 0;

    const doneQty = a.level === "unit"
      ? (a.unitBreakdown || []).reduce((s, u) => s + (u.done || 0), 0)
      : a.level === "phase"
      ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.done || 0), 0)
      : logs.filter((l) => l.assignmentId === a.id).reduce((s, l) => s + (l.qtyCompleted || 0), 0);

    const earnedValue = doneQty * (a.clientRate || 0);
    const contractValue = totalQty * (a.clientRate || 0);
    const progress = pct(doneQty, totalQty);

    return { ...a, totalQty, doneQty, earnedValue, contractValue, progress };
  }), [assignments, logs]);

  /* ── Project-level KPIs ─── */
  const kpis = useMemo(() => {
    const totalContract = enriched.reduce((s, a) => s + a.contractValue, 0);
    const totalEarned = enriched.reduce((s, a) => s + a.earnedValue, 0);
    const totalQty = enriched.reduce((s, a) => s + a.totalQty, 0);
    const totalDone = enriched.reduce((s, a) => s + a.doneQty, 0);
    const overallPct = pct(totalDone, totalQty);
    const completedScopes = enriched.filter((a) => a.progress >= 100).length;
    const notStarted = enriched.filter((a) => a.progress === 0).length;
    const retention5pct = totalEarned * 0.05;

    return { totalContract, totalEarned, overallPct, completedScopes, notStarted, retention5pct, net: totalEarned - retention5pct };
  }, [enriched]);

  /* ── Unit-level progress across all scopes ─── */
  const unitProgress = useMemo(() => {
    return units.map((unit) => {
      let totalQty = 0;
      let totalDone = 0;
      enriched.forEach((a) => {
        if (a.level === "unit") {
          const row = (a.unitBreakdown || []).find((u) => u.unitId === unit.id);
          if (row) { totalQty += row.qty; totalDone += row.done; }
        } else if (a.level === "phase") {
          const phase = phases.find((ph) => ph.id === unit.phaseId);
          if (phase) {
            const phRow = (a.phaseBreakdown || []).find((p) => p.phaseId === phase.id);
            if (phRow && phase.unitIds?.length) {
              totalQty += phRow.qty / phase.unitIds.length;
              totalDone += phRow.done / phase.unitIds.length;
            }
          }
        }
        // project-level doesn't apply per unit
      });
      const progress = pct(totalDone, totalQty);
      const phase = phases.find((ph) => ph.id === unit.phaseId);
      return { ...unit, totalQty: Math.round(totalQty), totalDone: Math.round(totalDone), progress, phase };
    });
  }, [units, enriched, phases]);

  /* ── Contractor breakdown ─── */
  const contractorBreakdown = useMemo(() => {
    const map = {};
    enriched.forEach((a) => {
      const key = a.assigneeName || "Unknown";
      if (!map[key]) map[key] = { name: key, type: a.assigneeType, totalQty: 0, doneQty: 0, contractValue: 0, earnedValue: 0, scopes: [] };
      map[key].totalQty += a.totalQty;
      map[key].doneQty += a.doneQty;
      map[key].contractValue += a.contractValue;
      map[key].earnedValue += a.earnedValue;
      map[key].scopes.push(a.scopeName);
    });
    return Object.values(map).map((c) => ({ ...c, progress: pct(c.doneQty, c.totalQty) }));
  }, [enriched]);

  const selectedScopeData = selectedScope ? enriched.find((a) => a.id === selectedScope) : null;

  return (
    <div className="space-y-5 fade-up">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Overall Progress", value: `${kpis.overallPct}%`, sub: "weighted by qty", cls: "text-blue-600 bg-blue-500/10", iconEl: <TrendingUp size={14} /> },
          { label: "Contract Value", value: `SAR ${(kpis.totalContract/1000).toFixed(0)}K`, sub: "total scopes", cls: "text-purple-600 bg-purple-500/10", iconEl: <DollarSign size={14} /> },
          { label: "Earned Value", value: `SAR ${(kpis.totalEarned/1000).toFixed(0)}K`, sub: `${pct(kpis.totalEarned, kpis.totalContract)}% of contract`, cls: "text-emerald-600 bg-emerald-500/10", iconEl: <CheckCircle2 size={14} /> },
          { label: "Retention (5%)", value: `SAR ${(kpis.retention5pct/1000).toFixed(1)}K`, sub: "held back", cls: "text-amber-600 bg-amber-500/10", iconEl: <Clock size={14} /> },
          { label: "Completed Scopes", value: kpis.completedScopes, sub: `of ${enriched.length} total`, cls: "text-emerald-600 bg-emerald-500/10", iconEl: <CheckCircle2 size={14} /> },
          { label: "Not Started", value: kpis.notStarted, sub: "scopes pending", cls: "text-rose-600 bg-rose-500/10", iconEl: <AlertTriangle size={14} /> },
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground font-semibold">{k.label}</span>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${k.cls}`}>{k.iconEl}</div>
            </div>
            <p className="text-lg font-extrabold text-foreground leading-tight">{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-0">
        {[
          { id: "scope", label: "By Scope", icon: BarChart2 },
          { id: "unit", label: "By Unit", icon: Home },
          { id: "contractor", label: "By Contractor", icon: Layers },
        ].map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap
                ${viewMode === v.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={13} /> {v.label}
            </button>
          );
        })}
      </div>

      {/* BY SCOPE VIEW */}
      {viewMode === "scope" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Scope list */}
          <div className="lg:col-span-5 space-y-2">
            {enriched.map((a) => {
              const sc = statusColor(a.progress);
              const active = selectedScope === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedScope(active ? null : a.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all cursor-pointer
                    ${active ? "bg-primary/5 border-primary/25 shadow-sm" : "bg-card border-border hover:bg-muted/30"}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{a.tradeIcon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{a.scopeName}</p>
                        <p className="text-[10px] text-muted-foreground">{a.trade} · {a.uom} · {a.level}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-extrabold ${sc.text}`}>{a.progress}%</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${sc.bar}`} style={{ width: `${a.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10.5px]">
                    <span className="text-muted-foreground">
                      {a.doneQty.toLocaleString()} / {a.totalQty.toLocaleString()} {a.uom}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      SAR {a.earnedValue.toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scope detail */}
          <div className="lg:col-span-7">
            {selectedScopeData ? (
              <ScopeDetailPanel
                a={selectedScopeData}
                phases={phases}
                units={units}
                logs={logs}
                getPhaseColor={getPhaseColor}
              />
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-card border border-dashed border-border rounded-xl">
                <div className="text-center">
                  <BarChart2 size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Select a scope to see detailed breakdown</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BY UNIT VIEW */}
      {viewMode === "unit" && (
        <div className="space-y-3">
          {phases.map((phase) => {
            const col = getPhaseColor(phase.colorId);
            const phaseUnits = unitProgress.filter((u) => u.phaseId === phase.id);
            const phaseAvg = phaseUnits.length > 0
              ? Math.round(phaseUnits.reduce((s, u) => s + u.progress, 0) / phaseUnits.length)
              : 0;
            return (
              <div key={phase.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className={`flex items-center justify-between px-5 py-3 border-b border-border/60 ${col.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-bold ${col.text}`}>{phase.name}</span>
                    <span className="text-[10.5px] text-muted-foreground">({phaseUnits.length} units · avg {phaseAvg}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${statusColor(phaseAvg).bar}`} style={{ width: `${phaseAvg}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${statusColor(phaseAvg).text}`}>{phaseAvg}%</span>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phaseUnits.map((unit) => {
                    const sc = statusColor(unit.progress);
                    return (
                      <div key={unit.id} className="bg-muted/20 border border-border/60 rounded-xl p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9.5px] font-black ${col.bg} ${col.text}`}>
                              {unit.id}
                            </div>
                            <div>
                              <p className="text-[11.5px] font-bold text-foreground">{unit.name}</p>
                              {unit.type && <p className="text-[10px] text-muted-foreground">{unit.type}</p>}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sc.badge}`}>
                            {unit.progress}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${unit.progress}%` }} />
                        </div>
                        {/* Per-scope mini list */}
                        <div className="mt-2 space-y-1">
                          {enriched.filter((a) => a.level === "unit").map((a) => {
                            const ub = (a.unitBreakdown || []).find((u) => u.unitId === unit.id);
                            if (!ub) return null;
                            const p = pct(ub.done, ub.qty);
                            return (
                              <div key={a.id} className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-[10px]">{a.tradeIcon}</span>
                                <span className="text-muted-foreground truncate flex-1">{a.scopeName}</span>
                                <span className={`font-bold ${p >= 100 ? "text-emerald-500" : p > 0 ? "text-primary" : "text-muted-foreground/50"}`}>
                                  {p >= 100 ? "✓" : `${p}%`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {phases.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-xs bg-card border border-dashed border-border rounded-xl">
              No phases/units defined. Go to the Units tab to set up the project structure.
            </div>
          )}
        </div>
      )}

      {/* BY CONTRACTOR VIEW */}
      {viewMode === "contractor" && (
        <div className="space-y-3">
          {contractorBreakdown.map((c) => {
            const sc = statusColor(c.progress);
            return (
              <div key={c.name} className="bg-card border border-border rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-base font-extrabold text-foreground">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{c.type} · {c.scopes.length} scope{c.scopes.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-right">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">Contract</p>
                      <p className="text-sm font-bold text-foreground">SAR {c.contractValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">Earned</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">SAR {c.earnedValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">Net (5% ret.)</p>
                      <p className="text-sm font-bold text-foreground">SAR {Math.round(c.earnedValue * 0.95).toLocaleString()}</p>
                    </div>
                    <span className={`text-sm font-extrabold ${sc.text}`}>{c.progress}%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${c.progress}%` }} />
                </div>
                {/* Scope tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {c.scopes.map((sn) => (
                    <span key={sn} className="text-[10px] font-semibold px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{sn}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Scope Detail Panel (for BY SCOPE view) ──────────────────────────── */
function ScopeDetailPanel({ a, phases, units, logs, getPhaseColor }) {
  const scopeLogs = logs.filter((l) => l.assignmentId === a.id);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{a.tradeIcon}</span>
          <div>
            <p className="text-sm font-extrabold text-foreground">{a.scopeName}</p>
            <p className="text-[11px] text-muted-foreground">{a.trade} · {a.uom} · {a.level} level</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Contract", value: `SAR ${a.contractValue.toLocaleString()}`, cls: "text-foreground" },
            { label: "Earned", value: `SAR ${a.earnedValue.toLocaleString()}`, cls: "text-emerald-600 dark:text-emerald-400" },
            { label: "Remaining", value: `SAR ${(a.contractValue - a.earnedValue).toLocaleString()}`, cls: "text-amber-600 dark:text-amber-400" },
          ].map((x) => (
            <div key={x.label} className="bg-muted/30 rounded-xl py-2.5 px-2">
              <p className="text-[10px] text-muted-foreground font-semibold">{x.label}</p>
              <p className={`text-xs font-extrabold mt-0.5 ${x.cls}`}>{x.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {a.level === "unit" ? "Unit Breakdown" : a.level === "phase" ? "Phase Breakdown" : "Progress Logs"}
          </p>
        </div>

        {/* Project level — show logs */}
        {a.level === "project" && (
          <div className="divide-y divide-border/40 max-h-[260px] overflow-y-auto">
            {scopeLogs.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">No progress logged yet</p>
            ) : scopeLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-muted/10">
                <span className="text-muted-foreground w-20 shrink-0">{log.date}</span>
                <span className="font-semibold text-foreground">+{log.qtyCompleted} {log.uom}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SAR {log.amountEarned?.toLocaleString()}</span>
                <span className="text-muted-foreground flex-1 truncate text-[10.5px]">{log.notes}</span>
              </div>
            ))}
            <div className="px-4 py-2.5 bg-muted/20 flex justify-between text-xs font-bold">
              <span className="text-foreground">TOTAL</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {a.doneQty} / {a.totalQty} {a.uom} · SAR {a.earnedValue.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Phase level */}
        {a.level === "phase" && (
          <div className="divide-y divide-border/40">
            {(a.phaseBreakdown || []).map((pb) => {
              const phase = phases.find((ph) => ph.id === pb.phaseId);
              const col = phase ? getPhaseColor(phase.colorId) : PHASE_COLORS[0];
              const p = pct(pb.done, pb.qty);
              const sc = statusColor(p);
              const unitCount = phase ? (phase.unitIds || []).length : 0;
              return (
                <div key={pb.phaseId} className="px-4 py-3 hover:bg-muted/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className="text-xs font-bold text-foreground">{pb.phaseName}</span>
                      <span className="text-[10px] text-muted-foreground">({unitCount} units · {unitCount > 0 ? (pb.qty / unitCount).toFixed(1) : 0} {a.uom}/unit)</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${sc.text}`}>{p}%</span>
                      <p className="text-[10px] text-muted-foreground">{pb.done}/{pb.qty} {a.uom}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${p}%` }} />
                  </div>
                  <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    SAR {(pb.done * a.clientRate).toLocaleString()} earned
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Unit level — summary table */}
        {a.level === "unit" && (
          <div className="max-h-[280px] overflow-y-auto divide-y divide-border/40">
            {(a.unitBreakdown || []).map((ub) => {
              const unit = units.find((u) => u.id === ub.unitId);
              const unitPhase = unit ? phases.find((ph) => ph.id === unit.phaseId) : null;
              const col = unitPhase ? getPhaseColor(unitPhase.colorId) : PHASE_COLORS[0];
              const p = pct(ub.done, ub.qty);
              const sc = statusColor(p);
              return (
                <div key={ub.unitId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${col.bg} ${col.text}`}>
                    {ub.unitId}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">{unit?.name || ub.unitId}</p>
                    <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold text-foreground">{p}%</p>
                    <p className="text-[10px] text-muted-foreground">{ub.done}/{ub.qty} {a.uom}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                      SAR {(ub.done * a.clientRate).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
