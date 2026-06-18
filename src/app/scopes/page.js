"use client";

import { useState, useMemo } from "react";
import {
  CheckSquare, Layers, Tag,
  Search, Plus, Filter,
  ChevronDown, ChevronUp,
  Pencil, Trash2, Ruler,
} from "lucide-react";
import useScopeStore from "@/store/useScopeStore";
import AddScopeModal from "@/components/scopes/AddScopeModal";
import { TRADES, getTradeConfig } from "@/components/scopes/ScopeConfig";

/* ─── UOM chip ──────────────────────────────────────────────────── */
function UomChip({ uom }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-0.5 bg-secondary border border-border rounded-md text-foreground">
      <Ruler size={9} className="text-muted-foreground" />
      {uom}
    </span>
  );
}

/* ─── Scope Row ─────────────────────────────────────────────────── */
function ScopeRow({ scope, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubScopes = scope.subScopes && scope.subScopes.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/70 transition-all duration-150">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => hasSubScopes && setExpanded((e) => !e)}
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors
            ${hasSubScopes
              ? "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              : "cursor-default opacity-0"}`}
        >
          {hasSubScopes && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
        </button>

        <span className="text-[10px] font-mono text-muted-foreground/50 w-16 shrink-0 hidden md:block">
          {scope.id}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{scope.name}</p>
          {hasSubScopes && (
            <p className="text-[10.5px] text-muted-foreground mt-0.5">
              {scope.subScopes.length} sub-scope{scope.subScopes.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <UomChip uom={scope.uom} />

        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(scope)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(scope)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Sub-scopes expansion */}
      {expanded && hasSubScopes && (
        <div className="border-t border-border">
          {scope.subScopes.map((ss, idx) => (
            <div
              key={ss.id}
              className={`flex items-center gap-3 pl-12 pr-4 py-2.5 text-[12px] bg-muted/30 hover:bg-muted/60 transition-colors
                ${idx < scope.subScopes.length - 1 ? "border-b border-border/50" : ""}`}
            >
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
              <span className="flex-1 text-muted-foreground font-medium">
                {ss.name || <em className="opacity-50">Unnamed sub-scope</em>}
              </span>
              <UomChip uom={ss.uom || scope.uom} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Trade Accordion Section ───────────────────────────────────── */
function TradeSection({ trade, scopes, onEdit, onDelete }) {
  const cfg = getTradeConfig(trade);
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all cursor-pointer mb-2"
      >
        <span className="text-base leading-none">{cfg?.icon || "🏗️"}</span>
        <span className="flex-1 text-left text-[12.5px] font-bold text-foreground">{trade}</span>
        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${cfg?.color || "bg-muted text-muted-foreground border-border"}`}>
          {scopes.length} scope{scopes.length !== 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground ml-1">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <div className="space-y-2 pl-2">
          {scopes.map((scope) => (
            <ScopeRow key={scope.id} scope={scope} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Delete Confirm ────────────────────────────────────────────── */
function DeleteConfirm({ scope, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 z-10">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
          <Trash2 size={16} className="text-destructive" />
        </div>
        <h3 className="text-[15px] font-bold text-foreground mb-1">Delete Scope?</h3>
        <p className="text-xs text-muted-foreground mb-5">
          <strong className="text-foreground">{scope?.name}</strong> and all its sub-scopes will be permanently removed from the library.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-xl cursor-pointer hover:bg-muted transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-xs font-bold text-white bg-destructive rounded-xl cursor-pointer hover:bg-destructive/90 transition-all">
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function ScopeLibraryPage() {
  const scopes      = useScopeStore((s) => s.scopes);
  const deleteScope = useScopeStore((s) => s.deleteScope);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editScope,    setEditScope]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search,       setSearch]       = useState("");
  const [tradeFilter,  setTradeFilter]  = useState("All");

  /* ── Derived ─────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return scopes.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(q) ||
        s.trade.toLowerCase().includes(q) ||
        s.subScopes?.some((ss) => ss.name.toLowerCase().includes(q));
      const matchTrade = tradeFilter === "All" || s.trade === tradeFilter;
      return matchSearch && matchTrade;
    });
  }, [scopes, search, tradeFilter]);

  const byTrade = useMemo(() => {
    return filtered.reduce((acc, s) => {
      if (!acc[s.trade]) acc[s.trade] = [];
      acc[s.trade].push(s);
      return acc;
    }, {});
  }, [filtered]);

  const totalSubScopes = scopes.reduce((sum, s) => sum + (s.subScopes?.length || 0), 0);
  const usedTrades     = [...new Set(scopes.map((s) => s.trade))];

  /* ── Handlers ────────────────────────────────────────────── */
  function openAdd()          { setEditScope(null); setModalOpen(true); }
  function openEdit(scope)    { setEditScope(scope); setModalOpen(true); }
  function closeModal()       { setModalOpen(false); setEditScope(null); }
  function confirmDelete()    { if (deleteTarget) { deleteScope(deleteTarget.id); setDeleteTarget(null); } }

  return (
    <div className="p-6 min-h-full">

      {/* ── KPI Cards — same pattern as projects page ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Scopes",      value: scopes.length,       icon: CheckSquare, colorClass: "text-blue-600 bg-blue-500/10"   },
          { label: "Total Sub-Scopes",  value: totalSubScopes,      icon: Layers,      colorClass: "text-purple-600 bg-purple-500/10" },
          { label: "Trade Categories",  value: usedTrades.length,   icon: Tag,         colorClass: "text-primary bg-primary/10"     },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-card border border-border rounded-xl p-5 hover:shadow-xs transition-all duration-200 fade-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12.5px] font-semibold text-muted-foreground">{stat.label}</span>
                <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center ${stat.colorClass}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-xl font-extrabold text-foreground leading-none">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filter + Action bar — same pattern as projects page ── */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search scopes, sub-scopes, trade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>

        {/* Filters + Add button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted-foreground" />
            <span className="text-[11.5px] text-muted-foreground font-semibold">Filters:</span>
          </div>

          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs outline-none cursor-pointer focus:border-ring"
          >
            <option value="All">All Trades</option>
            {TRADES.map((t) => (
              <option key={t.value} value={t.value}>{t.icon} {t.value}</option>
            ))}
          </select>

          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer ml-2"
          >
            <Plus size={14} /> Add Scope
          </button>
        </div>
      </div>

      {/* ── Column header ─────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-3 px-4 py-1.5 mb-1 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
        <span className="w-6 shrink-0" />
        <span className="w-16 shrink-0">ID</span>
        <span className="flex-1">Scope Name</span>
        <span className="w-20 text-center">UOM</span>
        <span className="w-16 text-right">Actions</span>
      </div>

      {/* ── Scope content ─────────────────────────────────── */}
      {Object.keys(byTrade).length === 0 ? (
        <div className="py-16 text-center bg-card border border-border rounded-xl">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-sm font-semibold text-foreground mb-1">No scopes found</p>
          <p className="text-xs text-muted-foreground mb-5">
            {search || tradeFilter !== "All"
              ? "Try adjusting your search or filter"
              : "Your scope library is empty — add your first scope"}
          </p>
          {!search && tradeFilter === "All" && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg cursor-pointer hover:bg-primary/90 transition-all"
            >
              <Plus size={13} /> Add First Scope
            </button>
          )}
        </div>
      ) : (
        Object.entries(byTrade).map(([trade, tradeScopes]) => (
          <TradeSection
            key={trade}
            trade={trade}
            scopes={tradeScopes}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        ))
      )}

      {/* ── Modals ────────────────────────────────────────── */}
      <AddScopeModal open={modalOpen} onClose={closeModal} editScope={editScope} />

      {deleteTarget && (
        <DeleteConfirm
          scope={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
