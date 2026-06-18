"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Search, ChevronDown, CheckCircle2, AlertCircle, Plus, FolderOpen, Layers, Home, Check } from "lucide-react";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const CONTRACTORS = [
  { id: "CON-001", name: "Gulf Build Co.", type: "contractor" },
  { id: "CON-002", name: "Al-Farsi Electric", type: "contractor" },
  { id: "CON-003", name: "Al-Nour Finishes", type: "contractor" },
  { id: "CON-004", name: "Gulf Plumbing Co.", type: "contractor" },
  { id: "TEAM-01", name: "Team A (In-house)", type: "team" },
  { id: "TEAM-02", name: "Team B (In-house)", type: "team" },
  { id: "TEAM-03", name: "Team C (In-house)", type: "team" },
];

const LEVEL_INFO = {
  project: {
    icon: FolderOpen,
    label: "Project Level",
    desc: "Log for entire project pool",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  phase: {
    icon: Layers,
    label: "Phase Level",
    desc: "Log for specific Phase",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  unit: {
    icon: Home,
    label: "Unit Level",
    desc: "Log for specific Unit/Villa",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
};

export default function DailyLogModal({ projectId, onClose, prefillUnitId = null, prefillAssignmentId = null }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const addLog = useProgressStore((s) => s.addLog);
  const allLogs = useProgressStore((s) => s.logs);

  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === projectId), [allAssignments, projectId]);
  const logs = useMemo(() => allLogs.filter((l) => l.projectId === projectId), [allLogs, projectId]);

  const phases = project?.phases || [];
  const units = project?.units || [];

  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    assignmentId: prefillAssignmentId || "",
    level: "project",
    unitId: prefillUnitId || "",
    phaseId: "",
    date: new Date().toISOString().split("T")[0],
    qtyCompleted: "",
    assigneeType: "contractor",
    assigneeId: "",
    assigneeName: "",
    notes: "",
    signedBy: "",
  });

  const selectedAssignment = assignments.find((a) => a.id === form.assignmentId);

  // Sync form when selected assignment changes (either on load or when user selects one)
  useEffect(() => {
    if (selectedAssignment) {
      // Find matches in CONTRACTORS to obtain assigneeId
      const matchedContractor = CONTRACTORS.find(
        (c) => c.name.toLowerCase() === selectedAssignment.assigneeName?.toLowerCase()
      );

      setForm((f) => ({
        ...f,
        level: selectedAssignment.level || "project",
        assigneeType: selectedAssignment.assigneeType || "contractor",
        assigneeId: matchedContractor?.id || selectedAssignment.assigneeId || "",
        assigneeName: selectedAssignment.assigneeName || "",
        unitId: selectedAssignment.level === "unit" ? (prefillUnitId || "") : "",
        phaseId: "",
      }));
    }
  }, [selectedAssignment, prefillUnitId]);

  /* ── Running total for context ── */
  const runningTotal = useMemo(() => {
    if (!selectedAssignment) return 0;
    return logs
      .filter((l) => {
        if (l.assignmentId !== form.assignmentId) return false;
        if (form.level === "unit") return l.unitId === form.unitId;
        if (form.level === "phase") return l.phaseId === form.phaseId;
        return true; // project level: total progress logged so far for the entire assignment
      })
      .reduce((s, l) => s + (l.qtyCompleted || 0), 0);
  }, [logs, form.assignmentId, form.level, form.unitId, form.phaseId]);

  const targetQty = useMemo(() => {
    if (!selectedAssignment) return 0;
    if (form.level === "unit" && form.unitId) {
      const ub = (selectedAssignment.unitBreakdown || []).find((u) => u.unitId === form.unitId);
      return ub?.qty || 0;
    }
    if (form.level === "phase" && form.phaseId) {
      const pb = (selectedAssignment.phaseBreakdown || []).find((p) => p.phaseId === form.phaseId);
      return pb?.qty || 0;
    }
    return selectedAssignment.totalQty || 0;
  }, [selectedAssignment, form.level, form.unitId, form.phaseId]);

  const earned = (Number(form.qtyCompleted) || 0) * (selectedAssignment?.clientRate || 0);
  const progressAfter = targetQty > 0 ? pct(runningTotal + (Number(form.qtyCompleted) || 0), targetQty) : 0;

  const getPhaseColor = (colorId) => PHASE_COLORS.find((c) => c.id === colorId) || PHASE_COLORS[0];

  const isValid = useMemo(() => {
    if (!form.assignmentId || !form.qtyCompleted || Number(form.qtyCompleted) <= 0) return false;
    if (form.level === "unit" && !form.unitId) return false;
    if (form.level === "phase" && !form.phaseId) return false;
    if (!form.assigneeId) return false;
    return true;
  }, [form.assignmentId, form.qtyCompleted, form.level, form.unitId, form.phaseId, form.assigneeId]);

  const handleSave = () => {
    if (!selectedAssignment || !isValid) return;

    addLog({
      projectId,
      assignmentId: form.assignmentId,
      unitId: form.level === "unit" ? form.unitId : null,
      phaseId: form.level === "phase" ? form.phaseId : null,
      scopeName: selectedAssignment.scopeName,
      uom: selectedAssignment.uom,
      date: form.date,
      qtyCompleted: Number(form.qtyCompleted),
      rate: selectedAssignment.clientRate,
      amountEarned: earned,
      assigneeType: form.assigneeType,
      assigneeName: form.assigneeName,
      assigneeId: form.assigneeId,
      notes: form.notes,
      signedBy: form.signedBy,
      status: "Under Review",
    });

    // Update the assignment's done qty directly if progress level matches assignment level
    if (selectedAssignment.level === "unit" && form.level === "unit" && form.unitId) {
      const ub = (selectedAssignment.unitBreakdown || []).find((u) => u.unitId === form.unitId);
      if (ub) {
        const newDone = Math.min(ub.qty, ub.done + Number(form.qtyCompleted));
        const updatedBreakdown = (selectedAssignment.unitBreakdown || []).map((u) =>
          u.unitId === form.unitId ? { ...u, done: newDone } : u
        );
        useAssignmentStore.getState().updateAssignment(selectedAssignment.id, { unitBreakdown: updatedBreakdown });
      }
    } else if (selectedAssignment.level === "phase" && form.level === "phase" && form.phaseId) {
      const pb = (selectedAssignment.phaseBreakdown || []).find((p) => p.phaseId === form.phaseId);
      if (pb) {
        const newDone = Math.min(pb.qty, pb.done + Number(form.qtyCompleted));
        const updatedBreakdown = (selectedAssignment.phaseBreakdown || []).map((p) =>
          p.phaseId === form.phaseId ? { ...p, done: newDone } : p
        );
        useAssignmentStore.getState().updateAssignment(selectedAssignment.id, { phaseBreakdown: updatedBreakdown });
      }
    }

    setSaved(true);
  };

  const handleLogAnother = () => {
    setForm((f) => ({
      ...f,
      qtyCompleted: "",
      notes: "",
    }));
    setSaved(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">Log Daily Progress</h3>
            <p className="text-[11px] text-muted-foreground">{project?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"><X size={16} /></button>
        </div>

        {/* Saved state */}
        {saved ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Progress Logged!</h4>
              <p className="text-xs text-muted-foreground mt-1">
                +{form.qtyCompleted} {selectedAssignment?.uom} · SAR {earned.toLocaleString()} earned
              </p>
              {form.level === "unit" && form.unitId && <p className="text-[10.5px] text-muted-foreground">Unit {form.unitId} · {selectedAssignment?.scopeName}</p>}
              {form.level === "phase" && form.phaseId && <p className="text-[10.5px] text-muted-foreground">Phase {form.phaseId} · {selectedAssignment?.scopeName}</p>}
              {form.level === "project" && <p className="text-[10.5px] text-muted-foreground">Project Level · {selectedAssignment?.scopeName}</p>}
              <p className="text-[10.5px] text-primary/80 font-medium mt-1">Completed by: {form.assigneeName} ({form.assigneeType === "contractor" ? "Contractor" : "Labour Team"})</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleLogAnother} className="px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-xl cursor-pointer transition-all">
                + Log Another
              </button>
              <button onClick={onClose} className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 cursor-pointer transition-all">
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Step 1: Select Scope */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Select Scope Assignment</label>
                <div className="mt-1.5 border border-border rounded-xl overflow-hidden max-h-[160px] overflow-y-auto">
                  {assignments.map((a) => {
                    const active = form.assignmentId === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          const matchedContractor = CONTRACTORS.find(
                            (c) => c.name.toLowerCase() === a.assigneeName?.toLowerCase()
                          );
                          setForm((f) => ({
                            ...f,
                            assignmentId: a.id,
                            level: a.level || "project",
                            unitId: a.level === "unit" ? (prefillUnitId || "") : "",
                            phaseId: "",
                            assigneeType: a.assigneeType || "contractor",
                            assigneeId: matchedContractor?.id || a.assigneeId || "",
                            assigneeName: a.assigneeName || "",
                          }));
                        }}
                        className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors cursor-pointer border-b border-border/40 last:border-b-0
                          ${active ? "bg-primary/8 text-primary font-semibold" : "hover:bg-muted/40 text-foreground"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0">{a.tradeIcon}</span>
                          <div>
                            <p className="text-xs font-semibold">{a.scopeName}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{a.level} · {a.uom} · {a.assigneeName}</p>
                          </div>
                        </div>
                        {active && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Level Toggle Selector */}
              {selectedAssignment && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Progress Level</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {Object.entries(LEVEL_INFO).map(([key, info]) => {
                      const Icon = info.icon;
                      const active = form.level === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm((f) => ({
                            ...f,
                            level: key,
                            unitId: "",
                            phaseId: ""
                          }))}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-[68px]
                            ${active ? `${info.border} ${info.bg}` : "border-border bg-muted/30 hover:bg-muted/60"}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <Icon size={14} className={active ? info.color : "text-muted-foreground"} />
                            {active && <Check size={11} className={info.color} />}
                          </div>
                          <div>
                            <p className={`text-[10.5px] font-bold ${active ? info.color : "text-foreground"}`}>{info.label}</p>
                            <p className="text-[8.5px] text-muted-foreground leading-tight">{info.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Unit / Phase selection (if applicable) */}
              {selectedAssignment && form.level === "unit" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                    <span>Select Unit / Villa</span>
                    <span className="text-[9.5px] text-primary lowercase font-semibold">(required)</span>
                  </label>
                  <select
                    value={form.unitId}
                    onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring cursor-pointer"
                  >
                    <option value="">Select unit...</option>
                    {phases.map((phase) => {
                      const col = getPhaseColor(phase.colorId);
                      const phUnits = units.filter((u) => u.phaseId === phase.id);
                      return (
                        <optgroup key={phase.id} label={phase.name}>
                          {phUnits.map((u) => {
                            const ub = (selectedAssignment.unitBreakdown || []).find((x) => x.unitId === u.id);
                            const p = ub ? pct(ub.done, ub.qty) : 0;
                            return (
                              <option key={u.id} value={u.id}>
                                {u.name} ({p}% done · {ub ? `${ub.done}/${ub.qty}` : "not assigned"} {selectedAssignment.uom})
                              </option>
                            );
                          })}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              )}

              {selectedAssignment && form.level === "phase" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                    <span>Select Phase</span>
                    <span className="text-[9.5px] text-primary lowercase font-semibold">(required)</span>
                  </label>
                  <select
                    value={form.phaseId}
                    onChange={(e) => setForm((f) => ({ ...f, phaseId: e.target.value }))}
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring cursor-pointer"
                  >
                    <option value="">Select phase...</option>
                    {selectedAssignment.level === "phase" && selectedAssignment.phaseBreakdown?.length > 0 ? (
                      selectedAssignment.phaseBreakdown.map((pb) => {
                        const p = pct(pb.done, pb.qty);
                        return (
                          <option key={pb.phaseId} value={pb.phaseId}>
                            {pb.phaseName} ({p}% · {pb.done}/{pb.qty} {selectedAssignment.uom})
                          </option>
                        );
                      })
                    ) : (
                      phases.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Project Pool)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {selectedAssignment && form.level === "project" && (
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-2.5 text-xs text-blue-600 dark:text-blue-400 animate-in slide-in-from-top-1 duration-150">
                  <FolderOpen size={16} />
                  <p className="font-medium">Logging progress directly against the whole-project pool.</p>
                </div>
              )}

              {/* Step 4: Who Completed the Work (Assignee selector) */}
              {selectedAssignment && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
                    <span>Completed By</span>
                    <span className="text-[9.5px] text-primary lowercase font-semibold">(required)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, assigneeType: "contractor", assigneeId: "", assigneeName: "" }))}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all text-center
                        ${form.assigneeType === "contractor" ? "bg-primary/8 border-primary/30 text-primary font-bold shadow-sm" : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      Contractor
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, assigneeType: "team", assigneeId: "", assigneeName: "" }))}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all text-center
                        ${form.assigneeType === "team" ? "bg-primary/8 border-primary/30 text-primary font-bold shadow-sm" : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      Labour Team
                    </button>
                  </div>
                  <select
                    value={form.assigneeId}
                    onChange={(e) => {
                      const c = CONTRACTORS.find((x) => x.id === e.target.value);
                      setForm((f) => ({ ...f, assigneeId: e.target.value, assigneeName: c?.name || "" }));
                    }}
                    className="block w-full px-3 py-2 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring cursor-pointer"
                  >
                    <option value="">Select assignee...</option>
                    {CONTRACTORS.filter((c) => c.type === form.assigneeType).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Progress context box */}
              {selectedAssignment && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/60 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Running Progress Preview</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">Previous Total</p>
                      <p className="text-base font-extrabold text-foreground">{runningTotal}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedAssignment.uom}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">+ This Entry</p>
                      <p className="text-base font-extrabold text-primary">+{form.qtyCompleted || 0}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedAssignment.uom}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">Cumulative</p>
                      <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {runningTotal + (Number(form.qtyCompleted) || 0)}
                      </p>
                      {targetQty > 0 ? (
                        <p className="text-[10px] text-muted-foreground">of {targetQty} {selectedAssignment.uom}</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">of {selectedAssignment.totalQty} {selectedAssignment.uom} (Pool)</p>
                      )}
                    </div>
                  </div>
                  {targetQty > 0 && (
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${progressAfter >= 100 ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${progressAfter}%` }}
                      />
                    </div>
                  )}
                  {form.qtyCompleted && (
                    <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold text-center mt-1">
                      Amount Earned: SAR {earned.toLocaleString()} ({Number(form.qtyCompleted)} × SAR {selectedAssignment.clientRate})
                    </p>
                  )}
                </div>
              )}

              {/* Date & Qty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Qty Completed ({selectedAssignment?.uom || "unit"})
                  </label>
                  <input
                    type="number"
                    value={form.qtyCompleted}
                    onChange={(e) => setForm((f) => ({ ...f, qtyCompleted: e.target.value }))}
                    placeholder="e.g. 45"
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-foreground text-sm font-bold rounded-xl border border-border outline-none focus:border-ring"
                    min={0}
                  />
                </div>
              </div>

              {/* Signed By + Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Signed / Verified By</label>
                  <input
                    value={form.signedBy}
                    onChange={(e) => setForm((f) => ({ ...f, signedBy: e.target.value }))}
                    placeholder="e.g. Site Engineer"
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Notes</label>
                  <input
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    className="block mt-1 w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!isValid}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                ✓ Save Progress Log
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
