"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckSquare, Square, Search, ChevronDown, ChevronUp, X,
  Building2, Users, FolderOpen, Layers, Home
} from "lucide-react";
import useScopeStore from "@/store/useScopeStore";
import useContractorStore from "@/store/useContractorStore";
import useLabourStore from "@/store/useLabourStore";
import { getTradeConfig } from "@/components/scopes/ScopeConfig";

const LEVEL_OPTIONS = [
  { key: "project", label: "Project",  Icon: FolderOpen, desc: "One total qty for the whole project" },
  { key: "phase",   label: "Phase",    Icon: Layers,     desc: "Qty split per phase / floor" },
  { key: "unit",    label: "Unit",     Icon: Home,       desc: "Qty split per villa / apartment" },
];

/* ─── Inline config panel per selected scope ─────────────────── */
function ScopeConfigPanel({ entry, onChange, onRemove, contractors, teams, phases, units }) {
  const [open, setOpen] = useState(false);

  const hasPhases = phases.length > 0;
  const hasUnits  = units.length  > 0;

  /* When level changes, reset/populate the breakdown arrays */
  function handleLevelChange(level) {
    onChange({
      level,
      phaseBreakdown: level === "phase"
        ? phases.map((ph) => ({ phaseName: ph.name, qty: "" }))
        : [],
      unitBreakdown: level === "unit"
        ? units.map((u) => ({ unitName: u.name, qty: "" }))
        : [],
      totalQty: "",
    });
  }

  function setPhaseQty(phaseName, qty) {
    onChange({
      phaseBreakdown: entry.phaseBreakdown.map((p) =>
        p.phaseName === phaseName ? { ...p, qty } : p
      ),
    });
  }

  function setUnitQty(unitName, qty) {
    onChange({
      unitBreakdown: entry.unitBreakdown.map((u) =>
        u.unitName === unitName ? { ...u, qty } : u
      ),
    });
  }

  function bulkFillUnits(qty) {
    onChange({ unitBreakdown: entry.unitBreakdown.map((u) => ({ ...u, qty })) });
  }

  function bulkFillPhases(qty) {
    onChange({ phaseBreakdown: entry.phaseBreakdown.map((p) => ({ ...p, qty })) });
  }

  // Summary qty for header
  const totalQtyPreview = entry.level === "unit"
    ? (entry.unitBreakdown  || []).reduce((s, u) => s + (Number(u.qty) || 0), 0)
    : entry.level === "phase"
    ? (entry.phaseBreakdown || []).reduce((s, p) => s + (Number(p.qty) || 0), 0)
    : Number(entry.totalQty) || 0;

  return (
    <div className={`border rounded-xl transition-all overflow-hidden ${open ? "border-primary/30 bg-primary/3" : "border-border bg-card"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-border hover:text-destructive transition-colors cursor-pointer"
          title="Remove scope"
        >
          <X size={13} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-foreground truncate">{entry.scopeName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
              {entry.uom}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize
              ${entry.level === "project" ? "bg-blue-500/10 text-blue-600"
                : entry.level === "phase" ? "bg-purple-500/10 text-purple-600"
                : "bg-amber-500/10 text-amber-600"}`}>
              {entry.level}
            </span>
            {entry.assigneeName ? (
              <span className="text-[10px] text-emerald-600 font-semibold truncate">→ {entry.assigneeName}</span>
            ) : (
              <span className="text-[10px] text-amber-600 font-semibold">⚠ No assignee</span>
            )}
            {totalQtyPreview > 0 && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {totalQtyPreview} {entry.uom}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Configure {open ? <ChevronUp size={11} className="ml-1" /> : <ChevronDown size={11} className="ml-1" />}
        </button>
      </div>

      {/* Expandable config */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-3">

          {/* ── 1. Assignment Level ── */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1.5">
              Assignment Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVEL_OPTIONS.map(({ key, label, Icon, desc }) => {
                const disabled = (key === "phase" && !hasPhases) || (key === "unit" && !hasUnits);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleLevelChange(key)}
                    title={disabled ? "No phases/units defined in Step 2" : desc}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all
                      ${entry.level === key
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : disabled
                        ? "opacity-40 cursor-not-allowed bg-muted border-border"
                        : "bg-muted border-border text-muted-foreground hover:bg-muted/80 cursor-pointer"}`}
                  >
                    <Icon size={12} className="mb-1" />
                    <p className="text-[10.5px] font-bold leading-tight">{label}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. Assignee ── */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1.5">
              Assigned To
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { key: "contractor", label: "Contractor",  Icon: Building2 },
                { key: "team",       label: "Labour Team", Icon: Users },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ assigneeType: key, assigneeId: "", assigneeName: "", subRate: "" })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer
                    ${entry.assigneeType === key
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted border-border text-muted-foreground hover:bg-muted/80"}`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
            <select
              value={entry.assigneeId || ""}
              onChange={(e) => {
                const list = entry.assigneeType === "contractor" ? contractors : teams;
                const found = list.find((c) => c.id === e.target.value);
                onChange({ assigneeId: found?.id || "", assigneeName: found?.name || "" });
              }}
              className="w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring transition-colors"
            >
              <option value="">— Select {entry.assigneeType === "contractor" ? "contractor" : "team"} —</option>
              {(entry.assigneeType === "contractor" ? contractors : teams).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* ── 3. Rates ── */}
          <div className={`grid gap-3 ${entry.assigneeType === "contractor" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Client Rate (/{entry.uom})
              </label>
              <input
                type="number" min="0" placeholder="0.00"
                value={entry.clientRate || ""}
                onChange={(e) => onChange({ clientRate: e.target.value })}
                className="w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring transition-colors font-bold"
              />
            </div>
            {entry.assigneeType === "contractor" && (
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Sub Rate (/{entry.uom})
                </label>
                <input
                  type="number" min="0" placeholder="0.00"
                  value={entry.subRate || ""}
                  onChange={(e) => onChange({ subRate: e.target.value })}
                  className="w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring transition-colors font-bold"
                />
              </div>
            )}
          </div>

          {/* ── 4. Quantity inputs (depend on level) ── */}

          {/* Project level — single qty */}
          {entry.level === "project" && (
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Total Qty ({entry.uom})
              </label>
              <input
                type="number" min="0" placeholder="e.g. 500"
                value={entry.totalQty || ""}
                onChange={(e) => onChange({ totalQty: e.target.value })}
                className="w-full px-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring transition-colors"
              />
            </div>
          )}

          {/* Phase level */}
          {entry.level === "phase" && entry.phaseBreakdown.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Qty per Phase ({entry.uom})
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min="0" placeholder="Bulk fill"
                    className="w-20 px-2 py-1 bg-muted text-[10px] text-foreground rounded-lg border border-border outline-none focus:border-ring transition-colors"
                    onChange={(e) => e.target.value && bulkFillPhases(e.target.value)}
                  />
                  <span className="text-[9px] text-muted-foreground">all</span>
                </div>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {entry.phaseBreakdown.map((p) => (
                  <div key={p.phaseName} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-foreground w-28 shrink-0 truncate">{p.phaseName}</span>
                    <input
                      type="number" min="0" placeholder="0"
                      value={p.qty || ""}
                      onChange={(e) => setPhaseQty(p.phaseName, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring transition-colors"
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">{entry.uom}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Total: <strong>{entry.phaseBreakdown.reduce((s, p) => s + (Number(p.qty) || 0), 0)} {entry.uom}</strong>
              </p>
            </div>
          )}

          {/* Unit level */}
          {entry.level === "unit" && entry.unitBreakdown.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Qty per Unit ({entry.uom})
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min="0" placeholder="Bulk fill"
                    className="w-20 px-2 py-1 bg-muted text-[10px] text-foreground rounded-lg border border-border outline-none focus:border-ring transition-colors"
                    onChange={(e) => e.target.value && bulkFillUnits(e.target.value)}
                  />
                  <span className="text-[9px] text-muted-foreground">all</span>
                </div>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {entry.unitBreakdown.map((u) => (
                  <div key={u.unitName} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-foreground w-28 shrink-0 truncate">{u.unitName}</span>
                    <input
                      type="number" min="0" placeholder="0"
                      value={u.qty || ""}
                      onChange={(e) => setUnitQty(u.unitName, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-muted text-xs text-foreground rounded-lg border border-border outline-none focus:border-ring transition-colors"
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">{entry.uom}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Total: <strong>{entry.unitBreakdown.reduce((s, u) => s + (Number(u.qty) || 0), 0)} {entry.uom}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Trade group for scope picker ───────────────────────────── */
function TradeGroup({ trade, tradeScopes, selectedIds, onToggleScope }) {
  const cfg = getTradeConfig(trade);
  const [open, setOpen] = useState(true);
  const selectedCount = tradeScopes.filter((s) => selectedIds.has(s.id)).length;

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer mb-1"
      >
        <span className="text-sm leading-none">{cfg?.icon || "🏗️"}</span>
        <span className="flex-1 text-left text-[11px] font-bold text-foreground uppercase tracking-wide">{trade}</span>
        {selectedCount > 0 && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
            {selectedCount} selected
          </span>
        )}
        {open ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="space-y-1 pl-1">
          {tradeScopes.map((scope) => {
            const isSelected = selectedIds.has(scope.id);
            const Icon = isSelected ? CheckSquare : Square;
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => onToggleScope(scope)}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl border text-left transition-all cursor-pointer
                  ${isSelected
                    ? "bg-primary/8 border-primary/25"
                    : "bg-card border-border text-muted-foreground hover:border-border/60 hover:bg-muted/30"}`}
              >
                <Icon size={14} className={isSelected ? "text-primary shrink-0" : "text-border shrink-0"} />
                <span className={`flex-1 text-[12px] font-semibold ${isSelected ? "text-foreground" : ""}`}>
                  {scope.name}
                </span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground/70">{scope.uom}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Step3 ─────────────────────────────────────────────── */
export default function Step3Scopes({ scopes, onChange, phases = [], units = [] }) {
  const libraryScopes       = useScopeStore((s) => s.scopes);
  const fetchScopes          = useScopeStore((s) => s.fetchScopes);
  const contractors          = useContractorStore((s) => s.contractors);
  const fetchContractorData  = useContractorStore((s) => s.fetchContractorData);
  const teams                = useLabourStore((s) => s.teams);
  const fetchLabourData      = useLabourStore((s) => s.fetchLabourData);

  const [search, setSearch]       = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    fetchScopes();
    fetchContractorData();
    fetchLabourData();
  }, [fetchScopes, fetchContractorData, fetchLabourData]);

  const byTrade = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = libraryScopes.filter(
      (s) => !search || s.name.toLowerCase().includes(q) || s.trade.toLowerCase().includes(q)
    );
    return filtered.reduce((acc, s) => {
      if (!acc[s.trade]) acc[s.trade] = [];
      acc[s.trade].push(s);
      return acc;
    }, {});
  }, [libraryScopes, search]);

  const selectedIds = useMemo(() => new Set(scopes.map((s) => s.scopeId)), [scopes]);

  // Default level: if units exist → unit, else if phases exist → phase, else → project
  const defaultLevel = units.length > 0 ? "unit" : phases.length > 0 ? "phase" : "project";

  function handleToggleScope(scope) {
    if (selectedIds.has(scope.id)) {
      onChange(scopes.filter((s) => s.scopeId !== scope.id));
    } else {
      onChange([
        ...scopes,
        {
          scopeId:        scope.id,
          scopeName:      scope.name,
          trade:          scope.trade,
          uom:            scope.uom,
          level:          defaultLevel,
          assigneeType:   "contractor",
          assigneeId:     "",
          assigneeName:   "",
          clientRate:     "",
          subRate:        "",
          totalQty:       "",
          phaseBreakdown: defaultLevel === "phase" ? phases.map((ph) => ({ phaseName: ph.name, qty: "" })) : [],
          unitBreakdown:  defaultLevel === "unit"  ? units.map((u)  => ({ unitName:  u.name,  qty: "" })) : [],
        },
      ]);
    }
  }

  function handleUpdateScope(scopeId, patch) {
    onChange(scopes.map((s) => s.scopeId === scopeId ? { ...s, ...patch } : s));
  }

  const isEmpty = libraryScopes.length === 0;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Select scopes and configure the <strong>assignment level</strong>, <strong>assignee</strong>, and <strong>rates</strong> for each.
        </p>
        <p className="text-[11px] text-muted-foreground italic shrink-0">Optional</p>
      </div>

      {/* Phase/unit availability hint */}
      {(phases.length > 0 || units.length > 0) && (
        <div className="flex flex-wrap gap-2 px-0.5">
          {phases.length > 0 && (
            <span className="text-[10px] font-semibold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md">
              {phases.length} phase{phases.length !== 1 ? "s" : ""} available
            </span>
          )}
          {units.length > 0 && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
              {units.length} unit{units.length !== 1 ? "s" : ""} available
            </span>
          )}
        </div>
      )}

      {isEmpty ? (
        <div className="py-10 text-center border-2 border-dashed border-border rounded-xl">
          <span className="text-3xl block mb-2">📋</span>
          <p className="text-sm font-semibold text-foreground mb-1">Scope Library is empty</p>
          <p className="text-xs text-muted-foreground">
            Go to <strong>Scope Library</strong> in the sidebar to add scopes first.
          </p>
        </div>
      ) : (
        <>
          {/* Scope Picker Toggle */}
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/3 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Search size={12} className="text-primary" />
            </div>
            <span className="flex-1 text-xs font-semibold text-muted-foreground text-left">
              {pickerOpen ? "Close scope picker" : `Browse & add scopes (${libraryScopes.length} available)`}
            </span>
            {pickerOpen
              ? <ChevronUp size={14} className="text-muted-foreground" />
              : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>

          {/* Scope Picker Panel */}
          {pickerOpen && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search scopes..."
                    className="w-full pl-8 pr-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-3 space-y-1">
                {Object.keys(byTrade).length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No scopes match</p>
                ) : (
                  Object.entries(byTrade).map(([trade, tradeScopes]) => (
                    <TradeGroup
                      key={trade}
                      trade={trade}
                      tradeScopes={tradeScopes}
                      selectedIds={selectedIds}
                      onToggleScope={handleToggleScope}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Selected Scopes Config List */}
          {scopes.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                  {scopes.length} scope{scopes.length !== 1 ? "s" : ""} — click Configure to set level, assignee &amp; qty
                </p>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              {scopes.map((entry) => (
                <ScopeConfigPanel
                  key={entry.scopeId}
                  entry={entry}
                  contractors={contractors}
                  teams={teams}
                  phases={phases}
                  units={units}
                  onChange={(patch) => handleUpdateScope(entry.scopeId, patch)}
                  onRemove={() => onChange(scopes.filter((s) => s.scopeId !== entry.scopeId))}
                />
              ))}

              {scopes.some((s) => !s.assigneeId) && (
                <p className="text-[11px] text-amber-600 font-semibold px-1">
                  ⚠ Scopes without an assignee will be saved as placeholders — configure them later inside the project.
                </p>
              )}
            </div>
          ) : (
            <div className="py-6 text-center border-2 border-dashed border-border rounded-xl">
              <p className="text-sm font-semibold text-foreground mb-1">No scopes selected</p>
              <p className="text-xs text-muted-foreground">Use the picker above or skip this step.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
