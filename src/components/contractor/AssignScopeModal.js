"use client";

import { useState, useMemo } from "react";
import {
  X, ChevronDown, Plus, Trash2, Layers, Target,
  Calendar, FileText, Hash, DollarSign, AlertTriangle
} from "lucide-react";
import useProjectStore from "@/store/useProjectStore";
import useScopeStore from "@/store/useScopeStore";
import useAssignmentStore from "@/store/useAssignmentStore";

const TRADE_ICONS = {
  "Civil & Structural": "🏗️",
  "Architectural & Finishes": "🎨",
  "MEP – Electrical": "⚡",
  "MEP – Plumbing": "🚰",
  "MEP – Mechanical (HVAC)": "❄️",
  "MEP – Fire Fighting": "🔥",
  "External Works": "🌿",
  "Facade & Envelope": "🏢",
  "Structural Steel": "🔩",
  "Preliminaries": "📋",
  "Mechanical & Electrical": "⚙️",
  "Plumbing & Drainage": "🔧",
};

const STEP_LABELS = ["Project & Scope", "Level & Qty", "Rates & Dates", "Review"];

export default function AssignScopeModal({ contractor, onClose, onSuccess }) {
  const projects = useProjectStore((s) => s.projects);
  const scopes = useScopeStore((s) => s.scopes);
  const addAssignment = useAssignmentStore((s) => s.addAssignment);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    projectId: "",
    scopeId: "",
    level: "project",
    totalQty: "",
    subRate: "",
    clientRate: "",
    targetDate: "",
    notes: "",
    phaseBreakdown: [],
    unitBreakdown: [],
  });
  const [errors, setErrors] = useState({});

  const selectedProject = useMemo(() => projects.find((p) => p.id === form.projectId), [projects, form.projectId]);
  const selectedScope = useMemo(() => scopes.find((s) => s.id === form.scopeId), [scopes, form.scopeId]);

  const scopesByTrade = useMemo(() => {
    return scopes.reduce((acc, s) => {
      if (!acc[s.trade]) acc[s.trade] = [];
      acc[s.trade].push(s);
      return acc;
    }, {});
  }, [scopes]);

  // When level changes, initialise breakdown arrays
  const handleLevelChange = (level) => {
    let phaseBreakdown = [];
    let unitBreakdown = [];
    if (level === "phase" && selectedProject?.phases?.length) {
      phaseBreakdown = selectedProject.phases.map((ph) => ({ phaseId: ph.id, phaseName: ph.name, qty: "", done: 0 }));
    }
    if (level === "unit" && selectedProject?.units?.length) {
      unitBreakdown = selectedProject.units.map((u) => ({ unitId: u.id, unitName: u.name, phaseId: u.phaseId, qty: "", done: 0 }));
    }
    setForm((f) => ({ ...f, level, phaseBreakdown, unitBreakdown }));
  };

  const handleProjectChange = (projectId) => {
    const proj = projects.find((p) => p.id === projectId);
    let phaseBreakdown = [];
    let unitBreakdown = [];
    const level = form.level;
    if (proj) {
      if (level === "phase" && proj.phases?.length) {
        phaseBreakdown = proj.phases.map((ph) => ({ phaseId: ph.id, phaseName: ph.name, qty: "", done: 0 }));
      }
      if (level === "unit" && proj.units?.length) {
        unitBreakdown = proj.units.map((u) => ({ unitId: u.id, unitName: u.name, phaseId: u.phaseId, qty: "", done: 0 }));
      }
    }
    setForm((f) => ({ ...f, projectId, phaseBreakdown, unitBreakdown }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.projectId) e.projectId = "Select a project";
      if (!form.scopeId) e.scopeId = "Select a scope";
    }
    if (s === 1) {
      if (form.level === "project" && (!form.totalQty || Number(form.totalQty) <= 0)) e.totalQty = "Enter quantity";
      if (form.level === "phase") {
        const hasQty = form.phaseBreakdown.some((p) => Number(p.qty) > 0);
        if (!hasQty) e.phaseBreakdown = "Enter qty for at least one phase";
      }
      if (form.level === "unit") {
        const hasQty = form.unitBreakdown.some((u) => Number(u.qty) > 0);
        if (!hasQty) e.unitBreakdown = "Enter qty for at least one unit";
      }
    }
    if (s === 2) {
      if (!form.subRate || Number(form.subRate) <= 0) e.subRate = "Enter sub-contractor rate";
      if (!form.targetDate) e.targetDate = "Set a target date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => s + 1);
  };

  const handleSubmit = () => {
    if (!validateStep(2)) return;
    const phaseBreakdown = form.phaseBreakdown.map((p) => ({ ...p, qty: Number(p.qty) || 0, done: 0 }));
    const unitBreakdown = form.unitBreakdown.map((u) => ({ ...u, qty: Number(u.qty) || 0, done: 0 }));
    const assignment = addAssignment({
      projectId: form.projectId,
      scopeId: form.scopeId,
      scopeName: selectedScope?.name || "",
      trade: selectedScope?.trade || "",
      tradeIcon: TRADE_ICONS[selectedScope?.trade] || "📋",
      uom: selectedScope?.uom || "",
      level: form.level,
      clientRate: Number(form.clientRate) || 0,
      subRate: Number(form.subRate),
      assigneeType: "contractor",
      assigneeId: contractor.id,
      assigneeName: contractor.name,
      targetDate: form.targetDate,
      notes: form.notes,
      totalQty: form.level === "project" ? Number(form.totalQty) : 0,
      phaseBreakdown,
      unitBreakdown,
    });
    onSuccess?.(assignment);
    onClose();
  };

  const totalQtyCalc = useMemo(() => {
    if (form.level === "project") return Number(form.totalQty) || 0;
    if (form.level === "phase") return form.phaseBreakdown.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    if (form.level === "unit") return form.unitBreakdown.reduce((s, u) => s + (Number(u.qty) || 0), 0);
    return 0;
  }, [form]);

  const totalContractVal = totalQtyCalc * (Number(form.subRate) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-sm font-black text-foreground">Assign Scope to {contractor.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Create a new subcontract assignment</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-1.5 ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border transition-all
                    ${i < step ? "bg-primary border-primary text-primary-foreground" :
                      i === step ? "border-primary text-primary bg-primary/10" :
                      "border-border text-muted-foreground"}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="text-[10px] font-bold hidden sm:block whitespace-nowrap">{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-px transition-all ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          {/* ── Step 0: Project & Scope ── */}
          {step === 0 && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                  Project *
                </label>
                <select
                  value={form.projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className={`w-full px-3 py-2.5 bg-muted text-sm text-foreground rounded-xl border outline-none transition-colors cursor-pointer
                    ${errors.projectId ? "border-rose-500" : "border-border focus:border-ring"}`}
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.projectId && <p className="text-rose-500 text-[10px] mt-1">{errors.projectId}</p>}
                {selectedProject && (
                  <div className="mt-2 p-3 bg-muted/40 rounded-xl border border-border/50 text-xs text-muted-foreground flex gap-4">
                    <span><span className="font-semibold text-foreground">{selectedProject.location}</span> · {selectedProject.type}</span>
                    <span>{selectedProject.phases?.length || 0} phases · {selectedProject.units?.length || 0} units</span>
                    <span className={`font-bold ${selectedProject.status === "On Track" ? "text-emerald-500" : selectedProject.status === "Delayed" ? "text-rose-500" : "text-amber-500"}`}>
                      {selectedProject.status}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                  Scope of Work *
                </label>
                <select
                  value={form.scopeId}
                  onChange={(e) => setForm((f) => ({ ...f, scopeId: e.target.value }))}
                  className={`w-full px-3 py-2.5 bg-muted text-sm text-foreground rounded-xl border outline-none transition-colors cursor-pointer
                    ${errors.scopeId ? "border-rose-500" : "border-border focus:border-ring"}`}
                >
                  <option value="">Select scope...</option>
                  {Object.entries(scopesByTrade).map(([trade, tradeScopes]) => (
                    <optgroup key={trade} label={`${TRADE_ICONS[trade] || "📋"} ${trade}`}>
                      {tradeScopes.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.uom})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.scopeId && <p className="text-rose-500 text-[10px] mt-1">{errors.scopeId}</p>}
                {selectedScope && (
                  <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs flex items-center gap-2">
                    <span className="text-base">{TRADE_ICONS[selectedScope.trade] || "📋"}</span>
                    <div>
                      <p className="font-bold text-foreground">{selectedScope.name}</p>
                      <p className="text-muted-foreground">{selectedScope.trade} · UOM: {selectedScope.uom} · {selectedScope.subScopes?.length || 0} sub-scopes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Level & Qty ── */}
          {step === 1 && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">Assignment Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "project", label: "Project-Wide", desc: "One pool for entire project", icon: "🏗️" },
                    { id: "phase", label: "Per Phase", desc: "Qty per phase", icon: "📐", disabled: !selectedProject?.phases?.length },
                    { id: "unit", label: "Per Unit", desc: "Qty per villa/floor", icon: "🏠", disabled: !selectedProject?.units?.length },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => !opt.disabled && handleLevelChange(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer
                        ${form.level === opt.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"}
                        ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <div className="text-base mb-1">{opt.icon}</div>
                      <p className="text-[11px] font-bold">{opt.label}</p>
                      <p className="text-[9px]">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Project level — single qty */}
              {form.level === "project" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                    Total Quantity ({selectedScope?.uom || "units"}) *
                  </label>
                  <input
                    type="number"
                    value={form.totalQty}
                    onChange={(e) => setForm((f) => ({ ...f, totalQty: e.target.value }))}
                    placeholder="e.g. 480"
                    className={`w-full px-3 py-2.5 bg-muted text-sm text-foreground rounded-xl border outline-none font-bold
                      ${errors.totalQty ? "border-rose-500" : "border-border focus:border-ring"}`}
                  />
                  {errors.totalQty && <p className="text-rose-500 text-[10px] mt-1">{errors.totalQty}</p>}
                </div>
              )}

              {/* Phase level — table */}
              {form.level === "phase" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">
                    Qty per Phase ({selectedScope?.uom || "units"}) *
                  </label>
                  {errors.phaseBreakdown && <p className="text-rose-500 text-[10px] mb-2">{errors.phaseBreakdown}</p>}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr] px-4 py-2 bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                      <span>Phase</span>
                      <span>Quantity</span>
                    </div>
                    {form.phaseBreakdown.map((ph, idx) => (
                      <div key={ph.phaseId} className={`grid grid-cols-[1fr_1fr] px-4 py-2 items-center ${idx < form.phaseBreakdown.length - 1 ? "border-b border-border/50" : ""}`}>
                        <span className="text-xs font-semibold text-foreground">{ph.phaseName}</span>
                        <input
                          type="number"
                          value={ph.qty}
                          onChange={(e) => {
                            const updated = form.phaseBreakdown.map((p, i) => i === idx ? { ...p, qty: e.target.value } : p);
                            setForm((f) => ({ ...f, phaseBreakdown: updated }));
                          }}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-muted text-xs text-foreground rounded-lg border border-border outline-none font-bold max-w-[120px]"
                        />
                      </div>
                    ))}
                  </div>
                  {totalQtyCalc > 0 && (
                    <p className="text-[11px] text-primary font-bold mt-2">Total: {totalQtyCalc.toLocaleString()} {selectedScope?.uom}</p>
                  )}
                </div>
              )}

              {/* Unit level — table (grouped by phase) */}
              {form.level === "unit" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">
                    Qty per Unit ({selectedScope?.uom || "units"}) *
                  </label>
                  {errors.unitBreakdown && <p className="text-rose-500 text-[10px] mb-2">{errors.unitBreakdown}</p>}
                  <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                    <div className="grid grid-cols-[1fr_1fr_1fr] px-4 py-2 bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0">
                      <span>Unit</span>
                      <span>Phase</span>
                      <span>Quantity</span>
                    </div>
                    {form.unitBreakdown.map((u, idx) => {
                      const phase = selectedProject?.phases?.find((p) => p.id === u.phaseId);
                      return (
                        <div key={u.unitId} className={`grid grid-cols-[1fr_1fr_1fr] px-4 py-2 items-center ${idx < form.unitBreakdown.length - 1 ? "border-b border-border/40" : ""}`}>
                          <span className="text-xs font-semibold text-foreground">{u.unitName || u.unitId}</span>
                          <span className="text-[11px] text-muted-foreground">{phase?.name || "—"}</span>
                          <input
                            type="number"
                            value={u.qty}
                            onChange={(e) => {
                              const updated = form.unitBreakdown.map((uu, i) => i === idx ? { ...uu, qty: e.target.value } : uu);
                              setForm((f) => ({ ...f, unitBreakdown: updated }));
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1 bg-muted text-xs text-foreground rounded-lg border border-border outline-none font-bold max-w-[100px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                  {totalQtyCalc > 0 && (
                    <p className="text-[11px] text-primary font-bold mt-2">Total: {totalQtyCalc.toLocaleString()} {selectedScope?.uom}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Rates & Dates ── */}
          {step === 2 && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                    Sub-Contractor Rate (SAR / {selectedScope?.uom || "unit"}) *
                  </label>
                  <input
                    type="number"
                    value={form.subRate}
                    onChange={(e) => setForm((f) => ({ ...f, subRate: e.target.value }))}
                    placeholder="e.g. 650"
                    className={`w-full px-3 py-2.5 bg-muted text-sm text-foreground rounded-xl border outline-none font-bold
                      ${errors.subRate ? "border-rose-500" : "border-border focus:border-ring"}`}
                  />
                  {errors.subRate && <p className="text-rose-500 text-[10px] mt-1">{errors.subRate}</p>}
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                    Client Rate (SAR / {selectedScope?.uom || "unit"})
                  </label>
                  <input
                    type="number"
                    value={form.clientRate}
                    onChange={(e) => setForm((f) => ({ ...f, clientRate: e.target.value }))}
                    placeholder="e.g. 900"
                    className="w-full px-3 py-2.5 bg-muted text-sm text-foreground rounded-xl border border-border outline-none font-bold focus:border-ring"
                  />
                  {form.subRate && form.clientRate && (
                    <p className="text-[10px] text-emerald-500 font-bold mt-1">
                      Margin: SAR {(Number(form.clientRate) - Number(form.subRate)).toLocaleString()} / {selectedScope?.uom}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                  Target Completion Date *
                </label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  className={`w-full px-3 py-2.5 bg-muted text-sm text-foreground rounded-xl border outline-none
                    ${errors.targetDate ? "border-rose-500" : "border-border focus:border-ring"}`}
                />
                {errors.targetDate && <p className="text-rose-500 text-[10px] mt-1">{errors.targetDate}</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Notes / Special Conditions</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special conditions, materials, or instructions..."
                  className="w-full px-3 py-2.5 bg-muted text-xs text-foreground rounded-xl border border-border outline-none resize-none focus:border-ring"
                />
              </div>

              {totalQtyCalc > 0 && form.subRate && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Subcontract Value Preview</p>
                  <p className="text-lg font-black text-primary">SAR {totalContractVal.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{totalQtyCalc.toLocaleString()} {selectedScope?.uom} × SAR {Number(form.subRate).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Project", value: selectedProject?.name },
                  { label: "Scope", value: selectedScope?.name },
                  { label: "Contractor", value: contractor.name },
                  { label: "Assignment Level", value: form.level.charAt(0).toUpperCase() + form.level.slice(1) },
                  { label: "Total Qty", value: `${totalQtyCalc.toLocaleString()} ${selectedScope?.uom}` },
                  { label: "Sub Rate", value: `SAR ${Number(form.subRate).toLocaleString()} / ${selectedScope?.uom}` },
                  { label: "Client Rate", value: form.clientRate ? `SAR ${Number(form.clientRate).toLocaleString()} / ${selectedScope?.uom}` : "—" },
                  { label: "Target Date", value: form.targetDate || "—" },
                ].map((row, i) => (
                  <div key={i} className="bg-muted/40 rounded-xl p-3 border border-border/50">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">{row.label}</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Subcontract Value</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">SAR {totalContractVal.toLocaleString()}</p>
              </div>
              {form.notes && (
                <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Notes</p>
                  <p className="text-xs text-foreground">{form.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer transition-all"
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 cursor-pointer transition-all"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Plus size={13} /> Create Assignment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
