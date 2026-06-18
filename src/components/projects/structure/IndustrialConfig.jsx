"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const BAY_FUNCTIONS = ["Storage", "Production", "Assembly", "Loading Dock", "Office", "Utilities", "Cold Storage", "Hazardous"];

export default function IndustrialConfig({ structure, onChange }) {
  const bays = structure?.bays || [];

  function update(patch) { onChange({ ...structure, ...patch }); }

  function addBay() {
    update({ bays: [...bays, { id: Date.now(), name: `Bay ${bays.length + 1}`, function: "Storage", area: "", notes: "" }] });
  }

  function updateBay(id, patch) {
    update({ bays: bays.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }

  function removeBay(id) {
    update({ bays: bays.filter((b) => b.id !== id) });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-1">
        Define bays or zones within the facility. Each bay has a function and area.
      </p>

      {bays.map((bay, idx) => (
        <div key={bay.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-[10px] font-black text-amber-600 dark:text-amber-400 shrink-0">
              {idx + 1}
            </span>
            <input type="text" value={bay.name} onChange={(e) => updateBay(bay.id, { name: e.target.value })}
              className="flex-1 px-3 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg border border-border outline-none focus:border-ring"
              placeholder="Bay name..." />
            <button type="button" onClick={() => removeBay(bay.id)} className="text-destructive/40 hover:text-destructive cursor-pointer shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Function</label>
              <select value={bay.function} onChange={(e) => updateBay(bay.id, { function: e.target.value })}
                className="w-full px-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring cursor-pointer">
                {BAY_FUNCTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Area (m²)</label>
              <input type="number" value={bay.area} onChange={(e) => updateBay(bay.id, { area: e.target.value })}
                placeholder="e.g. 500"
                className="w-full px-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addBay}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
        <Plus size={14} /> Add Bay / Zone
      </button>
    </div>
  );
}
