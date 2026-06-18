"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { FLOOR_TEMPLATES } from "../ProjectTypeConfig";

export default function SingleVillaConfig({ structure, onChange }) {
  const floors = structure?.floors || [];
  const [customFloor, setCustomFloor] = useState("");

  function update(patch) { onChange({ ...structure, ...patch }); }

  function applyTemplate(tpl) {
    if (tpl.floors.length) update({ floors: [...new Set([...floors, ...tpl.floors])] });
  }

  function addCustom() {
    const val = customFloor.trim().toUpperCase();
    if (val && !floors.includes(val)) update({ floors: [...floors, val] });
    setCustomFloor("");
  }

  function removeFloor(f) { update({ floors: floors.filter((x) => x !== f) }); }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define the floor levels for this single villa / showroom / building.</p>

      {/* Quick templates */}
      <div>
        <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Quick Templates</label>
        <div className="flex flex-wrap gap-2">
          {FLOOR_TEMPLATES.filter((t) => t.floors.length > 0).map((tpl) => (
            <button key={tpl.label} type="button" onClick={() => applyTemplate(tpl)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-border bg-muted text-muted-foreground hover:border-ring hover:text-foreground transition-all cursor-pointer">
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom floor */}
      <div>
        <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Add Floor Level</label>
        <div className="flex gap-2">
          <input type="text" value={customFloor} onChange={(e) => setCustomFloor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="e.g. Basement, GF, FF, Mezzanine, RF..."
            className="flex-1 px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors" />
          <button type="button" onClick={addCustom}
            className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg cursor-pointer hover:bg-primary/90 transition-colors flex items-center gap-1.5">
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* Floor chips */}
      {floors.length > 0 && (
        <div>
          <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Floor Levels ({floors.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {floors.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border text-foreground text-xs font-bold rounded-lg">
                {f}
                <button type="button" onClick={() => removeFloor(f)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
