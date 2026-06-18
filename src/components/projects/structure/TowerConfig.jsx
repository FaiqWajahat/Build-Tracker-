"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { parseUnitInput } from "../ProjectTypeConfig";

/* Reusable for: Office Tower, Mixed-Use Tower, Hotel, Serviced Apartments */

const UNIT_TYPES = ["Office", "Retail", "Parking", "Residential", "Hotel Room", "Penthouse", "Service"];

function UnitChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-md border border-primary/20">
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 text-primary/60 hover:text-destructive cursor-pointer"><X size={10} /></button>
    </span>
  );
}

function UnitInputRow({ units, onUnitsChange }) {
  const [raw, setRaw] = useState("");
  function commit() {
    const parsed = parseUnitInput(raw);
    if (parsed.length) { onUnitsChange([...new Set([...units, ...parsed])]); setRaw(""); }
  }
  return (
    <div>
      <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
        Unit Numbers <span className="font-normal normal-case text-muted-foreground/60">(e.g. 101-115 or 101,102,103)</span>
      </label>
      <input type="text" value={raw} onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === ",") && (e.preventDefault(), commit())}
        onBlur={() => raw.trim() && commit()}
        placeholder="e.g. 101-120 or 201,202,203"
        className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
      />
      {units.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {units.map((u) => <UnitChip key={u} label={u} onRemove={() => onUnitsChange(units.filter((x) => x !== u))} />)}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">{units.length} unit{units.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function TowerConfig({ structure, onChange, subtype }) {
  const floors = structure?.floors || [];

  function update(patch) { onChange({ ...structure, ...patch }); }

  function addFloor() {
    const auto = ["B3","B2","B1","GF","M","1F","2F","3F","4F","5F","6F","7F","8F","9F","10F","11F","12F","13F","14F","15F","20F","25F","30F","RF","Roof"];
    const used = new Set(floors.map((f) => f.label));
    const next = auto.find((l) => !used.has(l)) || `${floors.length}F`;
    update({ floors: [...floors, { id: Date.now(), label: next, unitType: "Office", units: [] }] });
  }

  function updateFloor(id, patch) {
    update({ floors: floors.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  }

  function removeFloor(id) {
    update({ floors: floors.filter((f) => f.id !== id) });
  }

  const totalUnits = floors.reduce((s, f) => s + f.units.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">
          Add each floor and manually specify unit numbers and type.
        </p>
        <span className="text-[11px] font-bold text-primary">{totalUnits} total units</span>
      </div>

      {floors.map((floor, idx) => (
        <FloorCard key={floor.id} floor={floor} index={idx}
          onUpdate={(p) => updateFloor(floor.id, p)}
          onRemove={() => removeFloor(floor.id)} />
      ))}

      <button type="button" onClick={addFloor}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
        <Plus size={14} /> Add Floor
      </button>
    </div>
  );
}

function FloorCard({ floor, index, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
        <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0">{index + 1}</span>
        <input type="text" value={floor.label} onChange={(e) => onUpdate({ label: e.target.value.toUpperCase() })}
          className="w-16 bg-transparent text-sm font-bold text-foreground border-none outline-none" placeholder="GF" />
        <select value={floor.unitType} onChange={(e) => onUpdate({ unitType: e.target.value })}
          className="flex-1 px-2 py-1 bg-muted text-foreground text-xs rounded-md border border-border outline-none focus:border-ring cursor-pointer">
          {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-[10px] text-muted-foreground shrink-0">{floor.units.length} units</span>
        <button type="button" onClick={() => setExpanded((e) => !e)} className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button type="button" onClick={onRemove} className="text-destructive/40 hover:text-destructive cursor-pointer shrink-0"><Trash2 size={13} /></button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-3">
          <UnitInputRow units={floor.units} onUnitsChange={(u) => onUpdate({ units: u })} />
        </div>
      )}
    </div>
  );
}
