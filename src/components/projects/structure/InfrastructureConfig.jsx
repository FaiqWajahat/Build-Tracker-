"use client";

import { Plus, Trash2 } from "lucide-react";

export default function InfrastructureConfig({ structure, onChange }) {
  const segments = structure?.segments || [];

  function update(patch) { onChange({ ...structure, ...patch }); }

  function addSegment() {
    update({ segments: [...segments, { id: Date.now(), name: `Segment ${segments.length + 1}`, description: "", length: "" }] });
  }

  function updateSegment(id, patch) {
    update({ segments: segments.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  }

  function removeSegment(id) {
    update({ segments: segments.filter((s) => s.id !== id) });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-1">
        Break the project into segments, stations, or sections.
      </p>

      {segments.map((seg, idx) => (
        <div key={seg.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-400 shrink-0">
              {idx + 1}
            </span>
            <input type="text" value={seg.name} onChange={(e) => updateSegment(seg.id, { name: e.target.value })}
              className="flex-1 px-3 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg border border-border outline-none focus:border-ring"
              placeholder="Segment / Station name..." />
            <button type="button" onClick={() => removeSegment(seg.id)} className="text-destructive/40 hover:text-destructive cursor-pointer">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Length / Distance</label>
              <input type="text" value={seg.length} onChange={(e) => updateSegment(seg.id, { length: e.target.value })}
                placeholder="e.g. 1.2 km"
                className="w-full px-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" />
            </div>
            <div>
              <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Description</label>
              <input type="text" value={seg.description} onChange={(e) => updateSegment(seg.id, { description: e.target.value })}
                placeholder="Brief note..."
                className="w-full px-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addSegment}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
        <Plus size={14} /> Add Segment / Station
      </button>
    </div>
  );
}
