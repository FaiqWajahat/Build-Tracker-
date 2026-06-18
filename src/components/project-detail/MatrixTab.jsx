"use client";

import { useState, useMemo } from "react";
import { X, Search, ChevronRight, CheckCircle2, Layers, Home } from "lucide-react";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const getCellBg = (p) => {
  if (p >= 100) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  if (p >= 75)  return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20";
  if (p >= 45)  return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20";
  if (p > 0)    return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/15";
  return "bg-muted/40 text-muted-foreground border-border/40";
};

export default function MatrixTab({ projectId }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);

  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === projectId), [allAssignments, projectId]);
  const logs = useMemo(() => allLogs.filter((l) => l.projectId === projectId), [allLogs, projectId]);

  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const phases = project?.phases || [];
  const units = project?.units || [];
  const getPhaseColor = (colorId) => PHASE_COLORS.find((c) => c.id === colorId) || PHASE_COLORS[0];

  /* ── Get progress of a unit for a specific scope ── */
  const getUnitScopeProgress = (unitId, a) => {
    if (a.level === "unit") {
      const row = (a.unitBreakdown || []).find((u) => u.unitId === unitId);
      return row ? pct(row.done, row.qty) : null; // null = not assigned
    }
    if (a.level === "phase") {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return null;
      const phase = phases.find((ph) => ph.id === unit.phaseId);
      if (!phase) return null;
      const phRow = (a.phaseBreakdown || []).find((p) => p.phaseId === phase.id);
      return phRow ? pct(phRow.done, phRow.qty) : null;
    }
    if (a.level === "project") {
      // Project-level: show overall progress for all units
      const totalLogged = logs.filter((l) => l.assignmentId === a.id).reduce((s, l) => s + (l.qtyCompleted || 0), 0);
      return pct(totalLogged, a.totalQty || 0);
    }
    return null;
  };

  /* ── Overall unit completion ── */
  const getUnitOverall = (unitId) => {
    let totalQty = 0, totalDone = 0;
    assignments.forEach((a) => {
      if (a.level === "unit") {
        const row = (a.unitBreakdown || []).find((u) => u.unitId === unitId);
        if (row) { totalQty += row.qty; totalDone += row.done; }
      } else if (a.level === "phase") {
        const unit = units.find((u) => u.id === unitId);
        const phase = unit ? phases.find((ph) => ph.id === unit.phaseId) : null;
        if (phase) {
          const phRow = (a.phaseBreakdown || []).find((p) => p.phaseId === phase.id);
          if (phRow && phase.unitIds?.length) {
            totalQty += phRow.qty / phase.unitIds.length;
            totalDone += phRow.done / phase.unitIds.length;
          }
        }
      }
    });
    return pct(totalDone, totalQty);
  };

  const filteredUnits = units.filter(
    (u) => u.id.toLowerCase().includes(searchQuery.toLowerCase()) || u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUnit = selectedUnitId ? units.find((u) => u.id === selectedUnitId) : null;
  const selectedUnitPhase = selectedUnit ? phases.find((ph) => ph.id === selectedUnit.phaseId) : null;
  const selectedUnitCol = selectedUnitPhase ? getPhaseColor(selectedUnitPhase.colorId) : PHASE_COLORS[0];

  // Only show unit-level and phase-level scopes in the matrix (project-level shown as "—" with overall %)
  const unitScopes = assignments.filter((a) => a.level === "unit");
  const phaseScopes = assignments.filter((a) => a.level === "phase");
  const projectScopes = assignments.filter((a) => a.level === "project");

  return (
    <div className="space-y-5 fade-up">
      {/* Matrix Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Unit × Scope Matrix</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {units.length} units · {assignments.length} scopes. Click a unit cell to see scope detail.
          </p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Matrix Table */}
        <div className={`${selectedUnitId ? "lg:col-span-7" : "lg:col-span-12"} overflow-x-auto`}>
          <div className="border border-border rounded-xl overflow-hidden">
            {/* Header row */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] min-w-[500px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-3 py-2.5 font-bold text-muted-foreground uppercase tracking-wider min-w-[90px] sticky left-0 bg-muted/50">
                      Unit
                    </th>
                    <th className="text-center px-2 py-2.5 font-bold text-muted-foreground uppercase tracking-wider min-w-[60px]">
                      Overall
                    </th>
                    {unitScopes.map((a) => (
                      <th key={a.id} className="text-center px-2 py-2.5 font-bold text-muted-foreground min-w-[70px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base">{a.tradeIcon}</span>
                          <span className="text-[9px] uppercase tracking-wider leading-tight max-w-[60px] truncate">{a.scopeName}</span>
                          <span className="text-[8.5px] text-muted-foreground/70">{a.uom}</span>
                        </div>
                      </th>
                    ))}
                    {phaseScopes.map((a) => (
                      <th key={a.id} className="text-center px-2 py-2.5 font-bold text-muted-foreground min-w-[70px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base">{a.tradeIcon}</span>
                          <span className="text-[9px] uppercase tracking-wider leading-tight max-w-[60px] truncate">{a.scopeName}</span>
                          <span className="text-[8.5px] text-muted-foreground/70">{a.uom} (phase)</span>
                        </div>
                      </th>
                    ))}
                    {projectScopes.map((a) => (
                      <th key={a.id} className="text-center px-2 py-2.5 font-bold text-muted-foreground min-w-[70px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base">{a.tradeIcon}</span>
                          <span className="text-[9px] uppercase tracking-wider leading-tight max-w-[60px] truncate">{a.scopeName}</span>
                          <span className="text-[8.5px] text-muted-foreground/70">{a.uom} (project)</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {phases.map((phase) => {
                    const col = getPhaseColor(phase.colorId);
                    const phUnits = filteredUnits.filter((u) => u.phaseId === phase.id);
                    if (phUnits.length === 0) return null;
                    return [
                      // Phase separator row
                      <tr key={`phase-${phase.id}`} className={`${col.bg}`}>
                        <td colSpan={99} className={`px-3 py-1.5`}>
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${col.text}`}>
                            {phase.name} ({phUnits.length} units)
                          </span>
                        </td>
                      </tr>,
                      // Unit rows
                      ...phUnits.map((unit) => {
                        const overallP = getUnitOverall(unit.id);
                        const isSelected = selectedUnitId === unit.id;
                        return (
                          <tr
                            key={unit.id}
                            onClick={() => setSelectedUnitId(isSelected ? null : unit.id)}
                            className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/20"}`}
                          >
                            <td className="px-3 py-2 sticky left-0 bg-card group-hover:bg-muted/20">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${col.bg} ${col.text}`}>
                                  {unit.id}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground text-[11px]">{unit.name}</p>
                                  {unit.type && <p className="text-[9.5px] text-muted-foreground">{unit.type}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className={`text-[11px] font-extrabold ${getCellBg(overallP).includes("emerald") ? "text-emerald-600 dark:text-emerald-400" : overallP > 0 ? "text-primary" : "text-muted-foreground"}`}>
                                {overallP}%
                              </span>
                            </td>
                            {unitScopes.map((a) => {
                              const p = getUnitScopeProgress(unit.id, a);
                              if (p === null) return (
                                <td key={a.id} className="px-2 py-2 text-center">
                                  <span className="text-[10px] text-muted-foreground/30">—</span>
                                </td>
                              );
                              const ub = (a.unitBreakdown || []).find((u2) => u2.unitId === unit.id);
                              return (
                                <td key={a.id} className="px-1 py-2 text-center">
                                  <div className={`rounded-md border px-1 py-1 ${getCellBg(p)}`}>
                                    <p className="text-[10px] font-extrabold">{p >= 100 ? "✓" : `${p}%`}</p>
                                    {ub && <p className="text-[8.5px] opacity-75">{ub.done}/{ub.qty}</p>}
                                  </div>
                                </td>
                              );
                            })}
                            {phaseScopes.map((a) => {
                              const p = getUnitScopeProgress(unit.id, a);
                              return (
                                <td key={a.id} className="px-1 py-2 text-center">
                                  {p !== null ? (
                                    <div className={`rounded-md border px-1 py-1 ${getCellBg(p)}`}>
                                      <p className="text-[10px] font-extrabold">{p}%</p>
                                    </div>
                                  ) : <span className="text-[10px] text-muted-foreground/30">—</span>}
                                </td>
                              );
                            })}
                            {projectScopes.map((a) => {
                              const p = getUnitScopeProgress(unit.id, a);
                              return (
                                <td key={a.id} className="px-1 py-2 text-center">
                                  {p !== null ? (
                                    <div className={`rounded-md border px-1 py-1 ${getCellBg(p)}`}>
                                      <p className="text-[10px] font-extrabold">{p}%</p>
                                      <p className="text-[8.5px] opacity-60">pool</p>
                                    </div>
                                  ) : <span className="text-[10px] text-muted-foreground/30">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }),
                    ];
                  })}
                  {filteredUnits.length === 0 && (
                    <tr>
                      <td colSpan={99} className="py-10 text-center text-xs text-muted-foreground">
                        No units defined. Go to Units tab to add project units.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { label: "100% Complete", cls: "bg-emerald-500/15 border-emerald-500/20" },
              { label: "75–99%", cls: "bg-blue-500/15 border-blue-500/20" },
              { label: "40–74%", cls: "bg-amber-500/15 border-amber-500/20" },
              { label: "1–39%", cls: "bg-rose-500/10 border-rose-500/15" },
              { label: "Not started / NA", cls: "bg-muted/40 border-border/40" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded border ${l.cls}`} />
                <span className="text-[10px] text-muted-foreground font-semibold">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Detail Drawer */}
        {selectedUnit && (
          <div className="lg:col-span-5 bg-card border border-border rounded-xl overflow-hidden self-start">
            <div className={`flex items-center justify-between px-4 py-3 border-b border-border/60 ${selectedUnitCol.bg}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${selectedUnitCol.bg} ${selectedUnitCol.text}`}>
                  {selectedUnit.id}
                </div>
                <div>
                  <p className={`text-xs font-bold ${selectedUnitCol.text}`}>{selectedUnit.name}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedUnitPhase?.name} · {selectedUnit.type}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUnitId(null)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-muted-foreground"><X size={13} /></button>
            </div>

            <div className="divide-y divide-border/40 max-h-[500px] overflow-y-auto">
              {assignments.map((a) => {
                const p = getUnitScopeProgress(selectedUnit.id, a);
                if (p === null && a.level !== "project") return null;
                const displayP = p ?? 0;

                let qtyInfo = "";
                if (a.level === "unit") {
                  const ub = (a.unitBreakdown || []).find((u) => u.unitId === selectedUnit.id);
                  qtyInfo = ub ? `${ub.done} / ${ub.qty} ${a.uom}` : "Not assigned";
                } else if (a.level === "phase") {
                  const unit = units.find((u) => u.id === selectedUnit.id);
                  const phase = unit ? phases.find((ph) => ph.id === unit.phaseId) : null;
                  const phRow = phase ? (a.phaseBreakdown || []).find((pb) => pb.phaseId === phase.id) : null;
                  const unitCount = phase?.unitIds?.length || 1;
                  qtyInfo = phRow ? `${(phRow.done / unitCount).toFixed(1)} / ${(phRow.qty / unitCount).toFixed(1)} ${a.uom} (share)` : "—";
                } else {
                  const totalLogged = logs.filter((l) => l.assignmentId === a.id).reduce((s, l) => s + l.qtyCompleted, 0);
                  qtyInfo = `Project pool: ${totalLogged} / ${a.totalQty} ${a.uom}`;
                }

                const sc = displayP >= 100 ? "text-emerald-500" : displayP > 0 ? "text-primary" : "text-muted-foreground";

                // Recent logs for this unit and scope
                const unitLogs = logs.filter((l) => l.assignmentId === a.id && l.unitId === selectedUnit.id);

                return (
                  <div key={a.id} className="p-4 hover:bg-muted/10">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{a.tradeIcon}</span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{a.scopeName}</p>
                          <p className="text-[10px] text-muted-foreground">{a.assigneeName} · {a.uom}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-extrabold ${sc} shrink-0`}>
                        {displayP >= 100 ? "✓ Complete" : `${displayP}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full ${displayP >= 100 ? "bg-emerald-500" : displayP > 0 ? "bg-primary" : "bg-muted"}`}
                        style={{ width: `${displayP}%` }}
                      />
                    </div>
                    <p className="text-[10.5px] text-muted-foreground">{qtyInfo}</p>
                    {unitLogs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {unitLogs.slice(0, 3).map((log) => (
                          <div key={log.id} className="flex items-center gap-2 text-[10px]">
                            <span className="text-muted-foreground">{log.date}</span>
                            <span className="text-foreground font-semibold">+{log.qtyCompleted} {log.uom}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">SAR {log.amountEarned?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
