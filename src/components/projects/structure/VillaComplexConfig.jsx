"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { PHASE_COLORS, FLOOR_TEMPLATES, parseUnitInput } from "../ProjectTypeConfig";

/* ─── Small shared sub-components ──────────────────────────────────── */

function UnitChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-md border border-primary/20">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-primary/60 hover:text-destructive transition-colors cursor-pointer"
      >
        <X size={10} />
      </button>
    </span>
  );
}

function UnitInputRow({ units, onUnitsChange }) {
  const [raw, setRaw] = useState("");

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
  }

  function commit() {
    const parsed = parseUnitInput(raw);
    if (parsed.length) {
      // deduplicate
      const merged = [...new Set([...units, ...parsed])];
      onUnitsChange(merged);
      setRaw("");
    }
  }

  function handleBlur() {
    if (raw.trim()) commit();
  }

  return (
    <div className="mt-2">
      <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
        Unit Numbers <span className="text-muted-foreground/60 normal-case font-normal">(comma-separated or range e.g. V1-V10)</span>
      </label>
      <input
        type="text"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="e.g. V1,V2,V3 or V1-V10"
        className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
      />
      {units.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {units.map((u) => (
            <UnitChip
              key={u}
              label={u}
              onRemove={() => onUnitsChange(units.filter((x) => x !== u))}
            />
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1.5">
        {units.length} unit{units.length !== 1 ? "s" : ""} added
      </p>
    </div>
  );
}

function FloorBuilder({ floors, onFloorsChange }) {
  const [customFloor, setCustomFloor] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  function applyTemplate(tpl) {
    if (tpl.floors.length) {
      onFloorsChange([...new Set([...floors, ...tpl.floors])]);
    }
    setSelectedTemplate(tpl.label);
  }

  function addCustom() {
    const val = customFloor.trim().toUpperCase();
    if (val && !floors.includes(val)) {
      onFloorsChange([...floors, val]);
    }
    setCustomFloor("");
  }

  function removeFloor(f) {
    onFloorsChange(floors.filter((x) => x !== f));
  }

  return (
    <div className="mt-3">
      <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
        Floor Structure
      </label>

      {/* Quick templates */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {FLOOR_TEMPLATES.filter((t) => t.floors.length > 0).map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            onClick={() => applyTemplate(tpl)}
            className={`px-2 py-1 text-[10.5px] font-medium rounded-md border transition-all cursor-pointer
              ${selectedTemplate === tpl.label
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-muted border-border text-muted-foreground hover:border-ring hover:text-foreground"
              }`}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Custom floor input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customFloor}
          onChange={(e) => setCustomFloor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="Add custom floor (e.g. Mezzanine)"
          className="flex-1 px-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
        >
          Add
        </button>
      </div>

      {floors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {floors.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-secondary text-secondary-foreground text-[11px] font-bold rounded-md border border-border"
            >
              {f}
              <button type="button" onClick={() => removeFloor(f)} className="ml-0.5 text-muted-foreground hover:text-destructive cursor-pointer">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main VillaComplexConfig ──────────────────────────────────────── */

export default function VillaComplexConfig({ structure, onChange }) {
  const phases = structure?.phases || [];
  const usePhases = structure?.usePhases ?? true;

  function update(patch) {
    onChange({ ...structure, ...patch });
  }

  function addPhase() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const label = letters[phases.length] || `P${phases.length + 1}`;
    update({
      phases: [
        ...phases,
        {
          id: Date.now(),
          label,
          name: `Phase ${label}`,
          units: [],
          floors: [],
        },
      ],
    });
  }

  function updatePhase(id, patch) {
    update({ phases: phases.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }

  function removePhase(id) {
    update({ phases: phases.filter((p) => p.id !== id) });
  }

  return (
    <div className="space-y-4">
      {/* Use Phases Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
        <div>
          <p className="text-sm font-semibold text-foreground">Phase-based Structure</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Divide villas into phases, each with their own units and floor structure
          </p>
        </div>
        <button
          type="button"
          onClick={() => update({ usePhases: !usePhases, phases: usePhases ? [] : phases })}
          className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer shrink-0
            ${usePhases ? "bg-primary" : "bg-border"}`}
        >
          <span
            className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform
              ${usePhases ? "left-[calc(100%-18px)]" : "left-0.5"}`}
          />
        </button>
      </div>

      {usePhases ? (
        <>
          {phases.map((phase, idx) => {
            const color = PHASE_COLORS[idx % PHASE_COLORS.length];
            return (
              <PhaseCard
                key={phase.id}
                phase={phase}
                color={color}
                onUpdate={(patch) => updatePhase(phase.id, patch)}
                onRemove={() => removePhase(phase.id)}
              />
            );
          })}

          <button
            type="button"
            onClick={addPhase}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
          >
            <Plus size={14} /> Add Phase
          </button>

          {phases.length === 0 && (
            <p className="text-center text-[11px] text-muted-foreground py-2">
              Click &quot;Add Phase&quot; to start configuring your villa complex
            </p>
          )}
        </>
      ) : (
        /* No-phase mode: single pool of villas + shared floor structure */
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <p className="text-xs font-semibold text-foreground">All Villas (no phases)</p>
          <UnitInputRow
            units={structure?.units || []}
            onUnitsChange={(u) => update({ units: u })}
          />
          <FloorBuilder
            floors={structure?.floors || []}
            onFloorsChange={(f) => update({ floors: f })}
          />
        </div>
      )}
    </div>
  );
}

function PhaseCard({ phase, color, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`rounded-xl border ${color.border} bg-card overflow-hidden`}>
      {/* Phase header */}
      <div className={`flex items-center gap-3 px-4 py-3 ${color.bg}`}>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${color.text} bg-white/20`}>
          {phase.label}
        </span>
        <input
          type="text"
          value={phase.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className={`flex-1 bg-transparent text-sm font-semibold ${color.text} border-none outline-none placeholder:text-current/40`}
          placeholder="Phase name..."
        />
        <span className={`text-[10px] font-bold ${color.text} opacity-70`}>
          {phase.units.length} unit{phase.units.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={`${color.text} opacity-60 hover:opacity-100 transition-opacity cursor-pointer`}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-destructive/50 hover:text-destructive transition-colors cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Phase body */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-1">
          <UnitInputRow
            units={phase.units}
            onUnitsChange={(u) => onUpdate({ units: u })}
          />
          <FloorBuilder
            floors={phase.floors}
            onFloorsChange={(f) => onUpdate({ floors: f })}
          />
        </div>
      )}
    </div>
  );
}
