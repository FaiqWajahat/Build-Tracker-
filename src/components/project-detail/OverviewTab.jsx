"use client";

import { useMemo, useState } from "react";
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, Activity, BarChart2, Home, ChevronDown, ChevronUp, X, Layers } from "lucide-react";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const statusColor = (p) => {
  if (p >= 100) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  if (p >= 70)  return { bar: "bg-blue-500",    text: "text-blue-600 dark:text-blue-400",       badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
  if (p >= 50)  return { bar: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400",     badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  if (p > 0)    return { bar: "bg-rose-500",    text: "text-rose-600 dark:text-rose-400",       badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
  return          { bar: "bg-muted",            text: "text-muted-foreground",                  badge: "bg-muted text-muted-foreground" };
};

const getUnitChipColor = (p) => {
  if (p >= 100) return "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20";
  if (p >= 70)  return "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20";
  if (p >= 50)  return "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20";
  if (p > 0)    return "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20";
  return        "bg-muted border-border text-muted-foreground hover:bg-muted/80";
};

export default function OverviewTab({ projectId }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);

  const [selectedUnit, setSelectedUnit] = useState(null);

  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === projectId), [allAssignments, projectId]);
  const logs = useMemo(() => allLogs.filter((l) => l.projectId === projectId), [allLogs, projectId]);

  const phases = useMemo(() => project?.phases || [], [project?.phases]);
  const units = useMemo(() => project?.units || [], [project?.units]);

  const getPhaseColor = (colorId) => PHASE_COLORS.find((c) => c.id === colorId) || PHASE_COLORS[0];

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
    return { ...a, totalQty, doneQty, progress: pct(doneQty, totalQty) };
  }), [assignments, logs]);

  const unitsData = useMemo(() => {
    return units.map((u) => {
      let totalValue = 0;
      let earnedValue = 0;
      const scopeProgress = [];

      assignments.forEach((a) => {
        if (a.level === "unit" && a.unitBreakdown) {
          const ub = a.unitBreakdown.find((ub) => ub.unitId === u.id);
          if (ub && ub.qty > 0) {
            totalValue += ub.qty * (a.clientRate || 0);
            earnedValue += ub.done * (a.clientRate || 0);
            scopeProgress.push({
              id: a.id,
              scopeName: a.scopeName,
              subScopeName: a.subScopeName,
              tradeIcon: a.tradeIcon,
              uom: a.uom,
              qty: ub.qty,
              done: ub.done,
              progress: pct(ub.done, ub.qty),
              earned: ub.done * (a.clientRate || 0)
            });
          }
        }
      });

      const phase = phases.find(ph => ph.id === u.phaseId);

      return {
        ...u,
        phaseName: phase?.name || "Ungrouped",
        phaseColor: phase ? getPhaseColor(phase.colorId) : PHASE_COLORS[0],
        scopeCount: scopeProgress.length,
        totalValue,
        earnedValue,
        overallProgress: pct(earnedValue, totalValue),
        scopeProgress
      };
    });
  }, [units, assignments, phases]);

  // Group units by Phase
  const groupedUnits = useMemo(() => {
    const groups = {};
    unitsData.forEach((u) => {
      if (!groups[u.phaseName]) {
        groups[u.phaseName] = { name: u.phaseName, color: u.phaseColor, units: [], totalProgress: 0 };
      }
      groups[u.phaseName].units.push(u);
      groups[u.phaseName].totalProgress += u.overallProgress;
    });

    return Object.values(groups).map((g) => ({
      ...g,
      avgProgress: g.units.length > 0 ? Math.round(g.totalProgress / g.units.length) : 0
    }));
  }, [unitsData]);


  const alerts = useMemo(() => {
    const out = [];
    enriched.forEach((a) => {
      if (a.progress === 0) out.push({ level: "critical", msg: `${a.scopeName} — Not started (0%)`, icon: "⚫" });
      else if (a.progress < 40) out.push({ level: "warning", msg: `${a.scopeName} — Behind schedule (${a.progress}%)`, icon: "🔴" });
    });
    return out.slice(0, 5);
  }, [enriched]);

  const recentLogs = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [logs]);

  return (
    <div className="space-y-5 fade-up relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* LEFT COLUMN: Scope Progress Summary */}
        <div className="bg-card border border-border rounded-xl flex flex-col shadow-sm max-h-[700px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 shrink-0">
            <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
              <BarChart2 size={16} className="text-primary" /> Scope Progress Summary
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">{enriched.length} scopes · {enriched.filter((a) => a.progress >= 100).length} complete</p>
          </div>
          <div className="divide-y divide-border/40 overflow-y-auto min-h-0">
            {enriched.map((a) => {
              const sc = statusColor(a.progress);
              return (
                <div key={a.id} className="flex flex-col px-5 py-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${sc.bar}`} />
                      <span className="text-sm shrink-0">{a.tradeIcon}</span>
                      <p className="text-[13px] font-bold text-foreground truncate">{a.scopeName}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[12px] font-black ${sc.text}`}>{a.progress}%</span>
                      <span className="text-[10.5px] font-semibold text-muted-foreground w-[90px] text-right">{a.doneQty.toLocaleString()} / {a.totalQty.toLocaleString()} {a.uom}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mt-1 mb-1.5 w-full">
                    <div className={`h-full rounded-full transition-all duration-700 ${sc.bar}`} style={{ width: `${a.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-muted-foreground font-medium">{a.assigneeName} · {a.level} Level</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      SAR {(a.doneQty * a.clientRate).toLocaleString()} earned
                    </p>
                  </div>
                </div>
              );
            })}
            {enriched.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No scope assignments yet. Go to Scope Assignments tab to add scopes.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Units Overview (Chips Grid) */}
        <div className="bg-card border border-border rounded-xl flex flex-col shadow-sm max-h-[700px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 shrink-0 flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <Home size={16} className="text-primary" /> Villa Unit Completion
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Which units are done vs in-progress</p>
            </div>
          </div>
          <div className="overflow-y-auto min-h-0 p-5 space-y-6">
            {groupedUnits.map((group) => (
              <div key={group.name} className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${group.color.bg} ${group.color.text}`}>
                      {group.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{group.units.length} Units</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Avg {group.avgProgress}% complete</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.units.map((u) => {
                    const chipClass = getUnitChipColor(u.overallProgress);
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUnit(u)}
                        className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all ${chipClass}`}
                        title={`${u.name} - ${u.overallProgress}% Complete`}
                      >
                        <span className="text-[11px] font-black">{u.name.replace(/^(villa|apt|unit)\s+/i, "")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {groupedUnits.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No units defined in this project.
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-border/60 shrink-0 bg-muted/10">
            <div className="flex items-center gap-4 flex-wrap text-[10.5px] font-semibold text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> 100% done</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> 70–99%</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> 50–69%</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Below 50%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Alerts & Recent Activity (if needed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Alerts */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" /> Attention Required
            </h3>
          </div>
          <div className="divide-y divide-border/40">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="text-base">{alert.icon}</span>
                <p className="text-xs font-medium text-foreground">{alert.msg}</p>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="flex items-center gap-3 px-5 py-4">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">All scopes progressing normally</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Recent Progress Logs
            </h3>
          </div>
          <div className="divide-y divide-border/40">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-black text-muted-foreground shrink-0">
                  {log.date.slice(5)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{log.scopeName}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {log.unitId ? `Unit ${log.unitId} · ` : ""}{log.assigneeName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-extrabold text-foreground">+{log.qtyCompleted} {log.uom}</p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">SAR {log.amountEarned?.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground font-medium">No progress logs yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Unit Detail Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUnit(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border
                  ${getUnitChipColor(selectedUnit.overallProgress)}`}>
                  {selectedUnit.name.replace(/^(villa|apt|unit)\s+/i, "")}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">{selectedUnit.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${selectedUnit.phaseColor.bg} ${selectedUnit.phaseColor.text}`}>
                      {selectedUnit.phaseName}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {selectedUnit.scopeCount} scopes assigned
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUnit(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-muted/10 border-b border-border/50">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Progress</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-2xl font-black ${statusColor(selectedUnit.overallProgress).text}`}>{selectedUnit.overallProgress}%</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusColor(selectedUnit.overallProgress).bar}`} style={{ width: `${selectedUnit.overallProgress}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Value Earned</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  SAR {selectedUnit.earnedValue.toLocaleString()} <span className="text-[11px] text-muted-foreground font-medium">/ {selectedUnit.totalValue.toLocaleString()}</span>
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Scope Breakdown</p>
              {selectedUnit.scopeProgress.length === 0 ? (
                <div className="text-center py-10">
                  <Layers size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No scopes assigned</p>
                  <p className="text-xs text-muted-foreground">This unit has no specific scope assignments.</p>
                </div>
              ) : (
                selectedUnit.scopeProgress.map((sp) => {
                  const spc = statusColor(sp.progress);
                  return (
                    <div key={sp.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-border/80 transition-colors">
                      <span className="text-2xl shrink-0 bg-muted/50 w-10 h-10 flex items-center justify-center rounded-xl">{sp.tradeIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[13px] font-bold text-foreground truncate">
                            {sp.scopeName}{sp.subScopeName && <span className="text-muted-foreground font-normal"> → {sp.subScopeName}</span>}
                          </p>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] text-muted-foreground font-semibold w-20 text-right">{sp.done}/{sp.qty} {sp.uom}</span>
                            <span className={`text-[12px] font-black w-10 text-right ${spc.text}`}>{sp.progress}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                          <div className={`h-full rounded-full ${spc.bar}`} style={{ width: `${sp.progress}%` }} />
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5">
                          SAR {sp.earned.toLocaleString()} earned
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
