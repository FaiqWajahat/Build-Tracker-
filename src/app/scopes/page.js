"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckSquare, Tag,
  Search, Plus, Filter,
  ChevronDown, ChevronUp,
  Pencil, Trash2, Ruler,
} from "lucide-react";
import useScopeStore from "@/store/useScopeStore";
import AddScopeModal from "@/components/scopes/AddScopeModal";
import { TRADES, getTradeConfig } from "@/components/scopes/ScopeConfig";
import Loader from "@/components/ui/Loader";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import useUserStore from "@/store/useUserStore";

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
function ScopeRow({ scope, onEdit, onDelete, isReadOnly }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/70 transition-all duration-150">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-[10px] font-mono text-muted-foreground/50 w-16 shrink-0 hidden md:block">
          {scope.id}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{scope.name}</p>
        </div>

        <UomChip uom={scope.uom} />

        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onEdit(scope)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border-none"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onDelete(scope)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border-none"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Trade Accordion Section ───────────────────────────────────── */
function TradeSection({ trade, scopes, onEdit, onDelete, isReadOnly }) {
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
            <ScopeRow key={scope.id} scope={scope} onEdit={onEdit} onDelete={onDelete} isReadOnly={isReadOnly} />
          ))}
        </div>
      )}
    </div>
  );
}


/* ─── Main Page ─────────────────────────────────────────────────── */
export default function ScopeLibraryPage() {
  const { scopes, fetchScopes, deleteScope, loading, loaded } = useScopeStore();
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";

  useEffect(() => {
    fetchScopes();
  }, [fetchScopes]);

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
        s.trade.toLowerCase().includes(q);
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

  const usedTrades = [...new Set(scopes.map((s) => s.trade))];

  /* ── Handlers ────────────────────────────────────────────── */
  function openAdd()          { setEditScope(null); setModalOpen(true); }
  function openEdit(scope)    { setEditScope(scope); setModalOpen(true); }
  function closeModal()       { setModalOpen(false); setEditScope(null); }
  function confirmDelete()    { if (deleteTarget) { deleteScope(deleteTarget.id); setDeleteTarget(null); } }

  return (
    <div className="p-6 min-h-full relative">
      {loading && (
        <Loader 
          message={!loaded && scopes.length === 0 ? "Loading scope library..." : "Updating library..."} 
        />
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { label: "Total Scopes",      value: scopes.length,       icon: CheckSquare, colorClass: "text-blue-600 bg-blue-500/10"   },
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

      {/* ── Filter + Action bar ── */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search scopes, trade..."
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
            disabled={isReadOnly}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer ml-2 disabled:opacity-50 disabled:cursor-not-allowed border-none"
          >
            <Plus size={14} /> Add Scope
          </button>
        </div>
      </div>

      {/* ── Column header ─────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-3 px-4 py-1.5 mb-1 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
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
              disabled={isReadOnly}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg cursor-pointer hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none"
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
            isReadOnly={isReadOnly}
          />
        ))
      )}

      {/* ── Modals ────────────────────────────────────────── */}
      <AddScopeModal open={modalOpen} onClose={closeModal} editScope={editScope} />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Scope"
        description="Are you sure you want to delete this scope? This action cannot be undone."
        itemName={deleteTarget?.name}
      />
    </div>
  );
}
