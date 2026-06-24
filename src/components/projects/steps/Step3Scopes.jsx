"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckSquare, Square, Search, ChevronDown, ChevronUp } from "lucide-react";
import useScopeStore from "@/store/useScopeStore";
import { getTradeConfig } from "@/components/scopes/ScopeConfig";

/*
  scopes prop shape (what gets stored in the project):
  [
    {
      scopeId:   "SCO-001",
      scopeName: "Bulk Excavation",
      trade:     "Civil & Structural",
      uom:       "m³"
    },
    ...
  ]
*/

/* ─── Checkbox icon ─────────────────────────────────────────────── */
function Checkbox({ checked, onChange, size = 15 }) {
  const Icon = checked ? CheckSquare : Square;
  return (
    <button
      type="button"
      onClick={onChange}
      className={`shrink-0 transition-colors cursor-pointer
        ${checked ? "text-primary" : "text-border hover:text-muted-foreground"}`}
    >
      <Icon size={size} />
    </button>
  );
}

/* ─── Scope block (flat scope item toggle) ──────────────────────── */
function ScopeBlock({ scope, isSelected, onToggleScope }) {
  return (
    <button
      type="button"
      onClick={onToggleScope}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer
        ${isSelected
          ? "bg-primary/8 border-primary/25 text-foreground"
          : "bg-card border-border text-muted-foreground hover:border-border/60 hover:bg-muted/40"}`}
    >
      <Checkbox checked={isSelected} onChange={onToggleScope} />
      <span className={`flex-1 text-[12.5px] font-semibold ${isSelected ? "text-foreground" : ""}`}>
        {scope.name}
      </span>
      <span className="text-[10px] font-mono font-bold text-muted-foreground/70">{scope.uom}</span>
    </button>
  );
}

/* ─── Trade group ───────────────────────────────────────────────── */
function TradeGroup({ trade, tradeScopes, selectedScopes, onToggleScope }) {
  const cfg = getTradeConfig(trade);
  const [open, setOpen] = useState(true);

  const selectedInTrade = tradeScopes.reduce((count, scope) => {
    const entry = selectedScopes.find((s) => s.scopeId === scope.id);
    return count + (entry ? 1 : 0);
  }, 0);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer mb-1"
      >
        <span className="text-base leading-none">{cfg?.icon || "🏗️"}</span>
        <span className="flex-1 text-left text-[11.5px] font-bold text-foreground uppercase tracking-wide">
          {trade}
        </span>
        {selectedInTrade > 0 && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
            {selectedInTrade} selected
          </span>
        )}
        <span className="text-muted-foreground">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {open && (
        <div className="space-y-1.5 pl-1">
          {tradeScopes.map((scope) => (
            <ScopeBlock
              key={scope.id}
              scope={scope}
              isSelected={selectedScopes.some((s) => s.scopeId === scope.id)}
              onToggleScope={() => onToggleScope(scope)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Step3 ────────────────────────────────────────────────── */
export default function Step3Scopes({ scopes, onChange }) {
  const libraryScopes = useScopeStore((s) => s.scopes);
  const fetchScopes = useScopeStore((s) => s.fetchScopes);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchScopes();
  }, [fetchScopes]);

  /* Group library by trade */
  const byTrade = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = libraryScopes.filter(
      (s) =>
        !search ||
        s.name.toLowerCase().includes(q) ||
        s.trade.toLowerCase().includes(q)
    );
    return filtered.reduce((acc, s) => {
      if (!acc[s.trade]) acc[s.trade] = [];
      acc[s.trade].push(s);
      return acc;
    }, {});
  }, [libraryScopes, search]);

  /* ── Toggle scope selection ───────────────────────────────────── */
  function handleToggleScope(scope) {
    const existingIdx = scopes.findIndex((s) => s.scopeId === scope.id);

    if (existingIdx !== -1) {
      // Remove scope
      onChange(scopes.filter((_, i) => i !== existingIdx));
    } else {
      // Add scope
      const entry = {
        scopeId: scope.id,
        scopeName: scope.name,
        trade: scope.trade,
        uom: scope.uom,
      };
      onChange([...scopes, entry]);
    }
  }

  const totalSelectedScopes = scopes.length;
  const isEmpty = libraryScopes.length === 0;

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Select the scopes that apply to this project. Select items directly from the trade categories below.
        </p>
        <p className="text-[11px] text-muted-foreground italic shrink-0">Optional</p>
      </div>

      {/* Search */}
      {!isEmpty && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scopes..."
            className="w-full pl-9 pr-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <div className="py-10 text-center border-2 border-dashed border-border rounded-xl">
          <span className="text-3xl block mb-2">📋</span>
          <p className="text-sm font-semibold text-foreground mb-1">Scope Library is empty</p>
          <p className="text-xs text-muted-foreground">
            Go to <strong>Scope Library</strong> in the sidebar to add scopes first.
          </p>
        </div>
      ) : Object.keys(byTrade).length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
          <p className="text-xs text-muted-foreground">No scopes match your search</p>
        </div>
      ) : (
        <div className="space-y-1">
          {Object.entries(byTrade).map(([trade, tradeScopes]) => (
            <TradeGroup
              key={trade}
              trade={trade}
              tradeScopes={tradeScopes}
              selectedScopes={scopes}
              onToggleScope={handleToggleScope}
            />
          ))}
        </div>
      )}

      {/* Selection summary bar */}
      {totalSelectedScopes > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20">
          <CheckSquare size={14} className="text-primary shrink-0" />
          <p className="text-[11.5px] font-semibold text-foreground flex-1">
            {totalSelectedScopes} scope{totalSelectedScopes !== 1 ? "s" : ""} selected
          </p>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10.5px] font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
