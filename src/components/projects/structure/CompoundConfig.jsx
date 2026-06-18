"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { parseUnitInput, PHASE_COLORS } from "../ProjectTypeConfig";

/* Compound: Multiple blocks/buildings, each can have units or floors */

function UnitChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-md border border-primary/20">
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 text-primary/60 hover:text-destructive cursor-pointer"><X size={10} /></button>
    </span>
  );
}

function UnitInputRow({ label = "Unit Numbers", units, onUnitsChange }) {
  const [raw, setRaw] = useState("");
  function commit() {
    const parsed = parseUnitInput(raw);
    if (parsed.length) { onUnitsChange([...new Set([...units, ...parsed])]); setRaw(""); }
  }
  return (
    <div>
      <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
        {label} <span className="font-normal normal-case text-muted-foreground/60">(manual or range)</span>
      </label>
      <input type="text" value={raw} onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === ",") && (e.preventDefault(), commit())}
        onBlur={() => raw.trim() && commit()}
        placeholder="e.g. U1-U20 or B1,B2,B3"
        className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors" />
      {units.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {units.map((u) => <UnitChip key={u} label={u} onRemove={() => onUnitsChange(units.filter((x) => x !== u))} />)}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">{units.length} unit{units.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function CompoundConfig({ structure, onChange }) {
  const blocks = structure?.blocks || [];

  function update(patch) { onChange({ ...structure, ...patch }); }

  function addBlock() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const label = letters[blocks.length] || `BL${blocks.length + 1}`;
    update({ blocks: [...blocks, { id: Date.now(), label, name: `Block ${label}`, units: [] }] });
  }

  function updateBlock(id, patch) {
    update({ blocks: blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }

  function removeBlock(id) {
    update({ blocks: blocks.filter((b) => b.id !== id) });
  }

  const total = blocks.reduce((s, b) => s + b.units.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">Divide the compound into blocks/buildings, each with their own units.</p>
        <span className="text-[11px] font-bold text-primary">{total} total units</span>
      </div>

      {blocks.map((block, idx) => {
        const color = PHASE_COLORS[idx % PHASE_COLORS.length];
        return (
          <div key={block.id} className={`rounded-xl border ${color.border} bg-card overflow-hidden`}>
            <div className={`flex items-center gap-3 px-4 py-3 ${color.bg}`}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${color.text} bg-white/20`}>{block.label}</span>
              <input type="text" value={block.name} onChange={(e) => updateBlock(block.id, { name: e.target.value })}
                className={`flex-1 bg-transparent text-sm font-semibold ${color.text} border-none outline-none`}
                placeholder="Block name..." />
              <span className={`text-[10px] font-bold ${color.text} opacity-70`}>{block.units.length} units</span>
              <button type="button" onClick={() => removeBlock(block.id)} className="text-destructive/50 hover:text-destructive cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="px-4 pb-4 pt-3">
              <UnitInputRow units={block.units} onUnitsChange={(u) => updateBlock(block.id, { units: u })} />
            </div>
          </div>
        );
      })}

      <button type="button" onClick={addBlock}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
        <Plus size={14} /> Add Block / Building
      </button>
    </div>
  );
}
