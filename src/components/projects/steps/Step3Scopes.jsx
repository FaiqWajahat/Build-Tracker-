"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, CheckSquare, Square, MinusSquare, Search, Layers } from "lucide-react";
import useScopeStore from "@/store/useScopeStore";
import { getTradeConfig } from "@/components/scopes/ScopeConfig";

/*
  scopes prop shape (what gets stored in the project):
  [
    {
      scopeId:         "SCO-001",
      scopeName:       "Excavation & Earthworks",
      trade:           "Civil & Structural",
      uom:             "m³",
      selectedSubScopes: [
        { id: "SS-001-1", name: "Bulk Excavation", uom: "m³" },
        ...
      ]
    },
    ...
  ]
*/

/* ─── Checkbox icon ─────────────────────────────────────────────── */
function Checkbox({ checked, indeterminate, onChange, size = 15 }) {
  const Icon = indeterminate ? MinusSquare : checked ? CheckSquare : Square;
  return (
    <button
      type="button"
      onClick={onChange}
      className={`shrink-0 transition-colors cursor-pointer
        ${checked || indeterminate ? "text-primary" : "text-border hover:text-muted-foreground"}`}
    >
      <Icon size={size} />
    </button>
  );
}

/* ─── Sub-scope row ─────────────────────────────────────────────── */
function SubScopeRow({ subScope, parentUom, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer
        ${checked
          ? "bg-primary/8 border border-primary/20"
          : "bg-transparent border border-transparent hover:bg-muted/60"}`}
    >
      <Checkbox checked={checked} onChange={onToggle} size={14} />
      <span className={`flex-1 text-[12px] font-medium ${checked ? "text-foreground" : "text-muted-foreground"}`}>
        {subScope.name}
      </span>
      <span className="text-[10px] font-mono font-bold text-muted-foreground/70 shrink-0">
        {subScope.uom || parentUom}
      </span>
    </button>
  );
}

/* ─── Scope block (parent + its sub-scopes) ─────────────────────── */
function ScopeBlock({ scope, selectedEntry, onToggleScope, onToggleSubScope }) {
  const [open, setOpen] = useState(false);

  const hasSubScopes = scope.subScopes && scope.subScopes.length > 0;
  const selectedIds  = new Set(selectedEntry?.selectedSubScopes?.map((s) => s.id) || []);
  const allCount     = scope.subScopes?.length || 0;
  const selCount     = selectedIds.size;

  const allSelected  = allCount > 0 && selCount === allCount;
  const someSelected = selCount > 0 && selCount < allCount;
  const isSelected   = !!selectedEntry; // scope-level (no subScopes)

  // For scopes with no sub-scopes: simple toggle on scope itself
  if (!hasSubScopes) {
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

  return (
    <div className={`rounded-xl border overflow-hidden transition-all
      ${allSelected ? "border-primary/30" : someSelected ? "border-primary/15" : "border-border"}`}
    >
      {/* Scope header */}
      <div className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors
        ${allSelected ? "bg-primary/8" : someSelected ? "bg-primary/4" : "bg-card hover:bg-muted/30"}`}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={onToggleScope}
        />
        <span className={`flex-1 text-[12.5px] font-semibold ${allSelected || someSelected ? "text-foreground" : "text-muted-foreground"}`}>
          {scope.name}
        </span>
        {selCount > 0 && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
            {selCount}/{allCount}
          </span>
        )}
        <span className="text-[10px] font-mono font-bold text-muted-foreground/60 mr-1">{scope.uom}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Sub-scopes list */}
      {open && (
        <div className="px-3 pb-2 pt-1 space-y-0.5 border-t border-border/50 bg-muted/10">
          {scope.subScopes.map((ss) => (
            <SubScopeRow
              key={ss.id}
              subScope={ss}
              parentUom={scope.uom}
              checked={selectedIds.has(ss.id)}
              onToggle={() => onToggleSubScope(ss)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Trade group ───────────────────────────────────────────────── */
function TradeGroup({ trade, tradeScopes, selectedScopes, onToggleScope, onToggleSubScope }) {
  const cfg = getTradeConfig(trade);
  const [open, setOpen] = useState(true);

  const selectedInTrade = tradeScopes.reduce((count, scope) => {
    const entry = selectedScopes.find((s) => s.scopeId === scope.id);
    if (!entry) return count;
    return count + (scope.subScopes?.length > 0 ? entry.selectedSubScopes.length : 1);
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
              selectedEntry={selectedScopes.find((s) => s.scopeId === scope.id)}
              onToggleScope={() => onToggleScope(scope)}
              onToggleSubScope={(ss) => onToggleSubScope(scope, ss)}
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
  const [search, setSearch] = useState("");

  /* Group library by trade */
  const byTrade = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = libraryScopes.filter(
      (s) =>
        !search ||
        s.name.toLowerCase().includes(q) ||
        s.trade.toLowerCase().includes(q) ||
        s.subScopes?.some((ss) => ss.name.toLowerCase().includes(q))
    );
    return filtered.reduce((acc, s) => {
      if (!acc[s.trade]) acc[s.trade] = [];
      acc[s.trade].push(s);
      return acc;
    }, {});
  }, [libraryScopes, search]);

  /* ── Toggle whole scope (select all sub-scopes or deselect) ───── */
  function handleToggleScope(scope) {
    const existingIdx = scopes.findIndex((s) => s.scopeId === scope.id);

    if (existingIdx !== -1) {
      const existing = scopes[existingIdx];
      // If has sub-scopes and not all selected yet → select all
      if (scope.subScopes?.length > 0 && existing.selectedSubScopes.length < scope.subScopes.length) {
        onChange(scopes.map((s, i) =>
          i === existingIdx ? { ...s, selectedSubScopes: [...scope.subScopes] } : s
        ));
      } else {
        // Otherwise remove scope entirely
        onChange(scopes.filter((_, i) => i !== existingIdx));
      }
    } else {
      // Add scope — select ALL sub-scopes by default when clicking header
      const entry = {
        scopeId: scope.id,
        scopeName: scope.name,
        trade: scope.trade,
        uom: scope.uom,
        selectedSubScopes: scope.subScopes ? [...scope.subScopes] : [],
      };
      onChange([...scopes, entry]);
    }
  }

  /* ── Toggle individual sub-scope ────────────────────────────── */
  function handleToggleSubScope(scope, subScope) {
    const existingIdx = scopes.findIndex((s) => s.scopeId === scope.id);

    if (existingIdx === -1) {
      // Scope not in list yet — add it with just this sub-scope
      onChange([
        ...scopes,
        {
          scopeId: scope.id,
          scopeName: scope.name,
          trade: scope.trade,
          uom: scope.uom,
          selectedSubScopes: [subScope],
        },
      ]);
    } else {
      const existing = scopes[existingIdx];
      const alreadyIn = existing.selectedSubScopes.some((s) => s.id === subScope.id);

      if (alreadyIn) {
        const newSubs = existing.selectedSubScopes.filter((s) => s.id !== subScope.id);
        if (newSubs.length === 0) {
          // Remove scope entry entirely if no sub-scopes remain
          onChange(scopes.filter((_, i) => i !== existingIdx));
        } else {
          onChange(scopes.map((s, i) =>
            i === existingIdx ? { ...s, selectedSubScopes: newSubs } : s
          ));
        }
      } else {
        onChange(scopes.map((s, i) =>
          i === existingIdx
            ? { ...s, selectedSubScopes: [...s.selectedSubScopes, subScope] }
            : s
        ));
      }
    }
  }

  /* ── Summary counts ─────────────────────────────────────────── */
  const totalSelectedScopes  = scopes.length;
  const totalSelectedSubScopes = scopes.reduce((n, s) => n + s.selectedSubScopes.length, 0);

  const isEmpty = libraryScopes.length === 0;

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Select the scopes and sub-scopes that apply to this project. Click a scope header to select all its sub-scopes, or expand to pick individually.
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
            placeholder="Search scopes or sub-scopes..."
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
              onToggleSubScope={handleToggleSubScope}
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
            {totalSelectedSubScopes > 0 && (
              <span className="text-muted-foreground font-normal">
                {" "}· {totalSelectedSubScopes} sub-scope{totalSelectedSubScopes !== 1 ? "s" : ""}
              </span>
            )}
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
