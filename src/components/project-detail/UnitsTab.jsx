"use client";

import { useState } from "react";
import {
  Plus, Trash2, Edit3, Check, X, Home, Layers,
  ChevronDown, ChevronUp, Grid3X3, Users, AlertCircle,
  Download, Upload
} from "lucide-react";
import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";
import useUserStore from "@/store/useUserStore";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function UnitsTab({ projectId }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const isVilla = project?.subtype?.toLowerCase().includes("villa") || project?.type?.toLowerCase().includes("villa");
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";
  const addPhase = useProjectStore((s) => s.addPhase);
  const updatePhase = useProjectStore((s) => s.updatePhase);
  const deletePhase = useProjectStore((s) => s.deletePhase);
  const addUnit = useProjectStore((s) => s.addUnit);
  const updateUnit = useProjectStore((s) => s.updateUnit);
  const deleteUnit = useProjectStore((s) => s.deleteUnit);
  const addBulkUnits = useProjectStore((s) => s.addBulkUnits);

  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseColor, setNewPhaseColor] = useState("blue");
  const [editingPhase, setEditingPhase] = useState(null); // { id, name, colorId }
  const [addingUnitToPhase, setAddingUnitToPhase] = useState(null);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitType, setNewUnitType] = useState("");
  const [newUnitId, setNewUnitId] = useState("");
  const [editingUnit, setEditingUnit] = useState(null);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [bulkText, setBulkText] = useState("");
  const [bulkPhase, setBulkPhase] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  // Loading/submitting UX states
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'phase' | 'unit', id, name }
  const [loadingPhaseId, setLoadingPhaseId] = useState(null);
  const [loadingUnitId, setLoadingUnitId] = useState(null);
  const [submittingPhase, setSubmittingPhase] = useState(false);
  const [submittingUnit, setSubmittingUnit] = useState(false);
  const [submittingBulk, setSubmittingBulk] = useState(false);

  if (!project) return null;

  const phases = project.phases || [];
  const units = project.units || [];

  const togglePhase = (id) =>
    setExpandedPhases((p) => ({ ...p, [id]: !p[id] }));

  const getPhaseColor = (colorId) =>
    PHASE_COLORS.find((c) => c.id === colorId) || PHASE_COLORS[0];

  const unitsInPhase = (phaseId) =>
    units.filter((u) => u.phaseId === phaseId);

  const unassignedUnits = units.filter((u) => !u.phaseId);

  const handleAddPhase = async () => {
    if (!newPhaseName.trim() || submittingPhase) return;
    setSubmittingPhase(true);
    try {
      await addPhase(projectId, { name: newPhaseName.trim(), colorId: newPhaseColor });
      setNewPhaseName("");
      setNewPhaseColor("blue");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPhase(false);
    }
  };

  const handleSavePhase = async () => {
    if (!editingPhase || !editingPhase.name.trim() || loadingPhaseId) return;
    setLoadingPhaseId(editingPhase.id);
    try {
      await updatePhase(projectId, editingPhase.id, {
        name: editingPhase.name.trim(),
        colorId: editingPhase.colorId,
      });
      setEditingPhase(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPhaseId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    setDeleteTarget(null);

    if (type === "phase") {
      setLoadingPhaseId(id);
      try {
        await deletePhase(projectId, id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPhaseId(null);
      }
    } else if (type === "unit") {
      setLoadingUnitId(id);
      try {
        await deleteUnit(projectId, id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUnitId(null);
      }
    }
  };

  const handleAddUnit = async (phaseId) => {
    if (!newUnitName.trim() || submittingUnit) return;
    setSubmittingUnit(true);
    try {
      await addUnit(projectId, {
        id: newUnitId.trim() || undefined,
        name: newUnitName.trim(),
        phaseId,
        type: newUnitType.trim(),
      });
      setNewUnitName("");
      setNewUnitType("");
      setNewUnitId("");
      setAddingUnitToPhase(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingUnit(false);
    }
  };

  const handleSaveUnit = async () => {
    if (!editingUnit || loadingUnitId) return;
    setLoadingUnitId(editingUnit.id);
    try {
      await updateUnit(projectId, editingUnit.id, {
        name: editingUnit.name,
        type: editingUnit.type,
        phaseId: editingUnit.phaseId,
      });
      setEditingUnit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUnitId(null);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim() || submittingBulk) return;
    setSubmittingBulk(true);
    try {
      const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
      const parsed = lines.map((line, i) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          id: parts[0] || undefined,
          name: parts[1] || parts[0] || `Unit ${i + 1}`,
          type: parts[2] || "",
          phaseId: bulkPhase || null,
        };
      });
      await addBulkUnits(projectId, parsed);
      setBulkText("");
      setBulkPhase("");
      setShowBulk(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingBulk(false);
    }
  };

  return (
    <div className="space-y-5 fade-up">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Units", value: units.length, icon: Home, cls: "text-blue-600 bg-blue-500/10" },
          { label: "Phases", value: phases.length, icon: Layers, cls: "text-purple-600 bg-purple-500/10" },
          { label: "Assigned", value: units.filter((u) => u.phaseId).length, icon: Check, cls: "text-emerald-600 bg-emerald-500/10" },
          { label: "Unassigned", value: unassignedUnits.length, icon: AlertCircle, cls: "text-amber-600 bg-amber-500/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground font-semibold">{s.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.cls}`}>
                  <Icon size={13} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Phase Manager */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Phases / Blocks</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Group units by phase, block, or type
            </p>
          </div>

          {/* Add Phase Form */}
          {!isReadOnly && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Phase name (e.g. Phase A)"
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
                disabled={submittingPhase}
                className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
              />
              <div className="flex items-center gap-2">
                {PHASE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setNewPhaseColor(c.id)}
                    disabled={submittingPhase}
                    className={`w-5 h-5 rounded-full transition-all disabled:opacity-50 ${newPhaseColor === c.id ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : ""}`}
                    style={{ background: c.hex }}
                  />
                ))}
                <button
                  onClick={handleAddPhase}
                  disabled={submittingPhase || !newPhaseName.trim()}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingPhase ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={12} /> Add Phase
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Phase List */}
          <div className="space-y-2">
            {phases.map((phase) => {
              const col = getPhaseColor(phase.colorId);
              const count = unitsInPhase(phase.id).length;
              const isLoadingThisPhase = loadingPhaseId === phase.id;

              return (
                <div key={phase.id} className={`rounded-xl border p-3 ${col.border} ${col.bg}`}>
                  {editingPhase?.id === phase.id ? (
                    <div className="space-y-2">
                      <input
                        value={editingPhase.name}
                        onChange={(e) => setEditingPhase({ ...editingPhase, name: e.target.value })}
                        disabled={isLoadingThisPhase}
                        className="w-full px-2 py-1 text-xs bg-card rounded border border-border outline-none disabled:opacity-50"
                      />
                      <div className="flex items-center gap-1.5">
                        {PHASE_COLORS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setEditingPhase({ ...editingPhase, colorId: c.id })}
                            disabled={isLoadingThisPhase}
                            className={`w-4 h-4 rounded-full disabled:opacity-50 ${editingPhase.colorId === c.id ? "ring-2 ring-offset-1 ring-foreground/40" : ""}`}
                            style={{ background: c.hex }}
                          />
                        ))}
                        {isLoadingThisPhase ? (
                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-auto animate-duration-500" />
                        ) : (
                          <>
                            <button onClick={handleSavePhase} disabled={!editingPhase.name.trim()} className="ml-auto p-1 rounded text-emerald-600 hover:bg-emerald-500/10 cursor-pointer disabled:opacity-40"><Check size={13} /></button>
                            <button onClick={() => setEditingPhase(null)} className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"><X size={13} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-bold ${col.text}`}>{phase.name}</p>
                        <p className="text-[10px] text-muted-foreground">{count} units</p>
                      </div>
                      {!isReadOnly && (
                        <div className="flex items-center gap-1">
                          {isLoadingThisPhase ? (
                            <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingPhase({ id: phase.id, name: phase.name, colorId: phase.colorId })}
                                disabled={!!loadingPhaseId}
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                              ><Edit3 size={11} /></button>
                              <button
                                onClick={() => setDeleteTarget({ type: "phase", id: phase.id, name: phase.name })}
                                disabled={!!loadingPhaseId}
                                className="p-1 rounded hover:bg-rose-500/10 cursor-pointer text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
                              ><Trash2 size={11} /></button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {phases.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-3">
                No phases yet. Add one above.
              </p>
            )}
          </div>
        </div>

        {/* Right: Unit Manager */}
        <div className="lg:col-span-2 space-y-3">
          {/* Bulk import */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-foreground">Units / Villas</h3>
                <p className="text-[11px] text-muted-foreground">Add or import units for this project</p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={() => setShowBulk((v) => !v)}
                  disabled={submittingBulk}
                  className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={12} /> Bulk Import
                </button>
              )}
            </div>

            {showBulk && (
              <div className="space-y-2 mt-3 p-3 bg-muted/30 rounded-xl border border-border">
                <p className="text-[10.5px] text-muted-foreground font-semibold">
                  One unit per line: <code className="bg-muted px-1 rounded">ID, Name, {isVilla ? "Floors" : "Subparts"}</code> — e.g.{" "}
                  <code className="bg-muted px-1 rounded">{isVilla ? "801, Villa 801, GF, FF, RF" : "101, Apt 101, Ground Floor"}</code>
                </p>
                <textarea
                  rows={5}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  disabled={submittingBulk}
                  placeholder={isVilla 
                    ? "801, Villa 801, GF, FF, RF\n804, Villa 804, GF, FF\n811, Villa 811, GF, FF, RF"
                    : "101, Apt 101, Ground Floor\n102, Apt 102, Ground Floor\n201, Apt 201, First Floor"
                  }
                  className="w-full px-3 py-2 text-xs bg-card border border-border rounded-lg outline-none focus:border-ring resize-none font-mono text-foreground disabled:opacity-50"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={bulkPhase}
                    onChange={(e) => setBulkPhase(e.target.value)}
                    disabled={submittingBulk}
                    className="flex-1 px-2 py-1.5 bg-card text-xs border border-border rounded-lg outline-none text-foreground disabled:opacity-50"
                  >
                    <option value="">No phase</option>
                    {phases.map((ph) => (
                      <option key={ph.id} value={ph.id}>{ph.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkAdd}
                    disabled={submittingBulk || !bulkText.trim()}
                    className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {submittingBulk ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      "Import"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Per-phase unit lists */}
          {phases.map((phase) => {
            const col = getPhaseColor(phase.colorId);
            const phUnits = unitsInPhase(phase.id);
            const isExpanded = expandedPhases[phase.id] !== false; // default open

            return (
              <div key={phase.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Phase Header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer ${col.bg} border-b border-border/60`}
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-bold ${col.text}`}>{phase.name}</span>
                    <span className="text-[10.5px] text-muted-foreground">({phUnits.length} units)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingUnitToPhase(phase.id);
                          setExpandedPhases((p) => ({ ...p, [phase.id]: true }));
                        }}
                        disabled={submittingUnit}
                        className="flex items-center gap-1 text-[10.5px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={10} /> Add Unit
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div>
                    {/* Add unit form */}
                    {addingUnitToPhase === phase.id && (
                      <div className="p-3 bg-muted/20 border-b border-border/50 flex flex-wrap items-end gap-2">
                        <div>
                          <label className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider">Unit ID</label>
                          <input
                            value={newUnitId}
                            onChange={(e) => setNewUnitId(e.target.value)}
                            disabled={submittingUnit}
                            placeholder="e.g. 801"
                            className="block mt-0.5 w-20 px-2 py-1.5 text-xs bg-card border border-border rounded-lg outline-none focus:border-ring text-foreground disabled:opacity-50"
                          />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider">Unit Name</label>
                          <input
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            disabled={submittingUnit}
                            placeholder="Villa 801"
                            className="block mt-0.5 w-full px-2 py-1.5 text-xs bg-card border border-border rounded-lg outline-none focus:border-ring text-foreground disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider">
                            {isVilla ? "Floors" : "Subparts"}
                          </label>
                          <input
                            value={newUnitType}
                            onChange={(e) => setNewUnitType(e.target.value)}
                            disabled={submittingUnit}
                            placeholder={isVilla ? "GF, FF, RF" : "Subparts"}
                            className="block mt-0.5 w-28 px-2 py-1.5 text-xs bg-card border border-border rounded-lg outline-none focus:border-ring text-foreground disabled:opacity-50"
                          />
                        </div>
                        {submittingUnit ? (
                          <div className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg flex items-center justify-center shrink-0">
                            <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAddUnit(phase.id)}
                              disabled={!newUnitName.trim()}
                              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            ><Check size={12} /></button>
                            <button
                              onClick={() => { setAddingUnitToPhase(null); setNewUnitName(""); setNewUnitId(""); setNewUnitType(""); }}
                              className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 cursor-pointer"
                            ><X size={12} /></button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Unit rows */}
                    <div className="divide-y divide-border/40">
                      {phUnits.map((unit) => {
                        const isLoadingThisUnit = loadingUnitId === unit.id;

                        return (
                          <div key={unit.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors">
                            {editingUnit?.id === unit.id ? (
                              <div className="flex items-center gap-2 flex-1 flex-wrap">
                                <input
                                  value={editingUnit.name}
                                  onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                                  disabled={isLoadingThisUnit}
                                  className="w-32 px-2 py-1 text-xs bg-card border border-border rounded outline-none text-foreground disabled:opacity-50"
                                />
                                <input
                                  value={editingUnit.type || ""}
                                  onChange={(e) => setEditingUnit({ ...editingUnit, type: e.target.value })}
                                  disabled={isLoadingThisUnit}
                                  placeholder={isVilla ? "GF, FF, RF" : "Subparts"}
                                  className="w-32 px-2 py-1 text-xs bg-card border border-border rounded outline-none text-foreground disabled:opacity-50"
                                />
                                <select
                                  value={editingUnit.phaseId || ""}
                                  onChange={(e) => setEditingUnit({ ...editingUnit, phaseId: e.target.value || null })}
                                  disabled={isLoadingThisUnit}
                                  className="px-2 py-1 text-xs bg-card border border-border rounded outline-none text-foreground disabled:opacity-50"
                                >
                                  <option value="">No phase</option>
                                  {phases.map((ph) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                                </select>
                                {isLoadingThisUnit ? (
                                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-1" />
                                ) : (
                                  <>
                                    <button onClick={handleSaveUnit} disabled={!editingUnit.name.trim()} className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded cursor-pointer disabled:opacity-40"><Check size={12} /></button>
                                    <button onClick={() => setEditingUnit(null)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"><X size={12} /></button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${col.bg} ${col.text}`}>
                                    {unit.id}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-foreground">{unit.name}</p>
                                    {unit.type && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {unit.type.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean).map((t, idx) => (
                                          <span
                                            key={idx}
                                            className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold border transition-all duration-200
                                              ${isVilla 
                                                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold" 
                                                : "bg-muted border-border text-muted-foreground font-semibold"}`}
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {!isReadOnly && (
                                  <div className="flex items-center gap-1">
                                    {isLoadingThisUnit ? (
                                      <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => setEditingUnit({ ...unit })}
                                          disabled={!!loadingUnitId}
                                          className="p-1 rounded hover:bg-muted cursor-pointer text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                                        ><Edit3 size={11} /></button>
                                        <button
                                          onClick={() => setDeleteTarget({ type: "unit", id: unit.id, name: unit.name })}
                                          disabled={!!loadingUnitId}
                                          className="p-1 rounded hover:bg-rose-500/10 cursor-pointer text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                        ><Trash2 size={11} /></button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                      {phUnits.length === 0 && (
                        <p className="text-[11px] text-muted-foreground text-center py-4">
                          No units in {phase.name} yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned units */}
          {unassignedUnits.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                <span className="text-xs font-bold text-muted-foreground">Unassigned Units ({unassignedUnits.length})</span>
              </div>
              <div className="divide-y divide-border/40">
                {unassignedUnits.map((unit) => (
                  <div key={unit.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black bg-muted text-muted-foreground">
                        {unit.id}
                      </div>
                      <p className="text-xs font-semibold text-foreground">{unit.name}</p>
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1">
                        {loadingUnitId === unit.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUnit({ ...unit })}
                              disabled={!!loadingUnitId}
                              className="p-1 rounded hover:bg-muted cursor-pointer text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                            ><Edit3 size={11} /></button>
                            <button
                              onClick={() => setDeleteTarget({ type: "unit", id: unit.id, name: unit.name })}
                              disabled={!!loadingUnitId}
                              className="p-1 rounded hover:bg-rose-500/10 cursor-pointer text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            ><Trash2 size={11} /></button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No phases or units */}
          {phases.length === 0 && units.length === 0 && (
            <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
              <Grid3X3 size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">No project structure defined</p>
              <p className="text-xs text-muted-foreground mt-1">Add phases and units to start tracking scope assignments</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "phase" ? "Delete Phase" : "Delete Unit"}
        description={
          deleteTarget?.type === "phase"
            ? "Are you sure you want to delete this phase? All units associated with this phase will become unassigned."
            : "Are you sure you want to delete this unit? This will remove it from the project structure."
        }
        confirmText="Delete"
        cancelText="Cancel"
        itemName={deleteTarget?.name}
      />
    </div>
  );
}
