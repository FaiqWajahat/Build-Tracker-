"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { parseUnitInput, PHASE_COLORS } from "../ProjectTypeConfig";

function UnitChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-md border border-primary/20">
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 text-primary/60 hover:text-destructive cursor-pointer"><X size={10} /></button>
    </span>
  );
}

function ShopInputRow({ shops, onShopsChange, placeholder = "e.g. S101,S102 or S101-S120" }) {
  const [raw, setRaw] = useState("");
  function commit() {
    const parsed = parseUnitInput(raw);
    if (parsed.length) { onShopsChange([...new Set([...shops, ...parsed])]); setRaw(""); }
  }
  return (
    <div>
      <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
        Shop / Unit Numbers <span className="font-normal normal-case text-muted-foreground/60">(manual or range)</span>
      </label>
      <input type="text" value={raw} onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === ",") && (e.preventDefault(), commit())}
        onBlur={() => raw.trim() && commit()}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors" />
      {shops.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {shops.map((s) => <UnitChip key={s} label={s} onRemove={() => onShopsChange(shops.filter((x) => x !== s))} />)}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">{shops.length} shop{shops.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function MallConfig({ structure, onChange }) {
  const zones = structure?.zones || [];

  function update(patch) { onChange({ ...structure, ...patch }); }

  function addZone() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const label = letters[zones.length] || `Z${zones.length + 1}`;
    update({ zones: [...zones, { id: Date.now(), label, name: `Zone ${label}`, shops: [] }] });
  }

  function updateZone(id, patch) {
    update({ zones: zones.map((z) => (z.id === id ? { ...z, ...patch } : z)) });
  }

  function removeZone(id) {
    update({ zones: zones.filter((z) => z.id !== id) });
  }

  const totalShops = zones.reduce((s, z) => s + z.shops.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">Divide the mall into zones/wings, then add shop numbers per zone.</p>
        <span className="text-[11px] font-bold text-primary">{totalShops} total shops</span>
      </div>

      {zones.map((zone, idx) => {
        const color = PHASE_COLORS[idx % PHASE_COLORS.length];
        return (
          <ZoneCard key={zone.id} zone={zone} color={color}
            onUpdate={(p) => updateZone(zone.id, p)}
            onRemove={() => removeZone(zone.id)} />
        );
      })}

      <button type="button" onClick={addZone}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
        <Plus size={14} /> Add Zone / Wing
      </button>
    </div>
  );
}

function ZoneCard({ zone, color, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className={`rounded-xl border ${color.border} bg-card overflow-hidden`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${color.bg}`}>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${color.text} bg-white/20`}>{zone.label}</span>
        <input type="text" value={zone.name} onChange={(e) => onUpdate({ name: e.target.value })}
          className={`flex-1 bg-transparent text-sm font-semibold ${color.text} border-none outline-none placeholder:text-current/40`}
          placeholder="Zone name..." />
        <span className={`text-[10px] font-bold ${color.text} opacity-70`}>{zone.shops.length} shops</span>
        <button type="button" onClick={() => setExpanded((e) => !e)} className={`${color.text} opacity-60 hover:opacity-100 cursor-pointer`}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button type="button" onClick={onRemove} className="text-destructive/50 hover:text-destructive cursor-pointer"><Trash2 size={13} /></button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-3">
          <ShopInputRow shops={zone.shops} onShopsChange={(s) => onUpdate({ shops: s })} />
        </div>
      )}
    </div>
  );
}
