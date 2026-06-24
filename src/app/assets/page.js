"use client";

import { useState, useEffect } from "react";
import {
  Package, Wrench, AlertTriangle, ShieldCheck,
  Search, Plus, Hammer, User, MapPin, Calendar,
  ChevronRight, CheckCircle, Edit2, Trash2, X, Clock
} from "lucide-react";
import useAssetStore, { ASSET_CATEGORIES, ASSET_STATUSES } from "@/store/useAssetStore";
import useProjectStore from "@/store/useProjectStore";
import useLabourStore from "@/store/useLabourStore";
import Loader from "@/components/ui/Loader";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import useUserStore from "@/store/useUserStore";

const statusStyles = {
  "In Use":            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  "Idle":              "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  "Inspection Due":    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  "Under Maintenance": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

const defaultStatusStyle = "bg-muted text-muted-foreground border border-border";

function AssetModal({ existing, onClose, onSave, projects, workers }) {
  const [form, setForm] = useState({
    name: existing?.name || "",
    category: existing?.category || ASSET_CATEGORIES[0],
    projectId: existing?.projectId || "",
    operatorId: existing?.operatorId || "",
    expectedReturnDate: existing?.expectedReturnDate || "",
    status: existing?.status || ASSET_STATUSES[0],
    notes: existing?.notes || ""
  });

  const setF = (k, v) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      // Auto-clear return date and optionally set status to Idle if unassigned
      if (k === "projectId" && !v) {
        next.expectedReturnDate = "";
        // If it was "In Use", maybe switch to "Idle", but let's keep user manual control for now
      }
      // If we assign it to a project, switch status to "In Use"
      if (k === "projectId" && v && prev.status === "Idle") {
        next.status = "In Use";
      }
      return next;
    });
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert("Asset name is required.");
    if (form.projectId && !form.expectedReturnDate) {
      return alert("Expected Return Date is required when assigned to a project.");
    }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-foreground text-base">{existing ? "Edit Asset" : "Add Asset"}</h3>
            {existing && <p className="text-xs text-muted-foreground mt-0.5">{existing.id}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={15} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Asset Name *</label>
              <input 
                type="text" 
                required
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={form.name} onChange={(e) => setF("name", e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Category</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={form.category} onChange={(e) => setF("category", e.target.value)}
                >
                  {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Status</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={form.status} onChange={(e) => setF("status", e.target.value)}
                >
                  {ASSET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Active Site (Project)</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={form.projectId} onChange={(e) => setF("projectId", e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Operator (Labour)</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={form.operatorId} onChange={(e) => setF("operatorId", e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.trade})</option>)}
                </select>
              </div>
            </div>

            {form.projectId && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-500" /> Expected Return Date *
                </label>
                <input 
                  type="date" 
                  required
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={form.expectedReturnDate} onChange={(e) => setF("expectedReturnDate", e.target.value)} 
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Notes</label>
              <textarea 
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-h-[80px]"
                value={form.notes} onChange={(e) => setF("notes", e.target.value)} 
                placeholder="Optional notes or issues..."
              />
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0 bg-card rounded-b-2xl">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Save Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssetProfileModal({ asset, onClose, projectName, operatorName }) {
  const statusClass = statusStyles[asset.status] || defaultStatusStyle;
  
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = asset.projectId && asset.expectedReturnDate && asset.expectedReturnDate < today;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-foreground text-lg">{asset.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{asset.id} • {asset.category}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}`}>
              {asset.status}
            </span>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} className="text-muted-foreground" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Active Site</span>
              <div className="text-sm font-semibold text-foreground truncate">{projectName}</div>
            </div>
            <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Operator</span>
              <div className="text-sm font-semibold text-foreground truncate">{operatorName}</div>
            </div>
            <div className={`p-4 rounded-xl border ${isOverdue ? "bg-rose-500/10 border-rose-500/30" : "bg-muted/40 border-border/50"}`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${isOverdue ? "text-rose-500" : "text-muted-foreground"}`}>
                Expected Return
              </span>
              <div className={`text-sm font-semibold truncate ${isOverdue ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
                {asset.projectId ? (asset.expectedReturnDate || "Not Set") : "— Unassigned —"}
                {isOverdue && <span className="ml-2 text-xs font-bold">(Overdue)</span>}
              </div>
            </div>
          </div>

          {/* Notes */}
          {asset.notes && (
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Notes</h4>
              <div className="bg-muted/40 p-4 rounded-xl border border-border/50 text-sm text-muted-foreground">
                {asset.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { assets, addAsset, updateAsset, deleteAsset, fetchAssetData, loading, loaded } = useAssetStore();
  const { projects } = useProjectStore();
  const { workers, fetchLabourData } = useLabourStore();
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";

  useEffect(() => {
    fetchLabourData();
    fetchAssetData();
  }, [fetchLabourData, fetchAssetData]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalAsset, setModalAsset] = useState(null); // null = closed, {} = new, {id:...} = edit
  const [viewAsset, setViewAsset] = useState(null); // The asset profile to view
  const [deleteTarget, setDeleteTarget] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          a.category.toLowerCase().includes(search.toLowerCase()) ||
                          a.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const inUseCount = assets.filter(a => a.status === "In Use").length;
  const maintenanceCount = assets.filter(a => a.status === "Under Maintenance").length;
  
  // Calculate Overdue Returns
  const overdueReturnsCount = assets.filter(a => a.projectId && a.expectedReturnDate && a.expectedReturnDate < today).length;

  function handleSaveAsset(data) {
    if (modalAsset?.id) {
      updateAsset(modalAsset.id, data);
    } else {
      addAsset(data);
    }
    setModalAsset(null);
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteAsset(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function getProjectName(pid) {
    return projects.find(p => p.id === pid)?.name || "--";
  }

  function getOperatorName(wid) {
    return workers.find(w => w.id === wid)?.name || "--";
  }

  return (
    <div className="p-6 min-h-full relative">
      {loading && (
        <Loader 
          message={!loaded ? "Loading asset registry..." : "Updating registry..."} 
        />
      )}
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Asset Registry", value: `${assets.length} Assets`, icon: Package, colorClass: "text-blue-600 bg-blue-500/10" },
          { label: "Assets In Use", value: `${inUseCount} Active`, icon: ShieldCheck, colorClass: "text-emerald-600 bg-emerald-500/10" },
          { label: "In Maintenance", value: `${maintenanceCount} Idle`, icon: Wrench, colorClass: "text-amber-600 bg-amber-500/10" },
          { label: "Overdue Returns", value: `${overdueReturnsCount} Alert(s)`, icon: AlertTriangle, colorClass: overdueReturnsCount > 0 ? "text-rose-600 bg-rose-500/10 shadow-sm shadow-rose-500/20 border-rose-500/30" : "text-emerald-600 bg-emerald-500/10" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-card border border-border rounded-xl p-5 transition-all duration-200 fade-up ${stat.label === "Overdue Returns" && overdueReturnsCount > 0 ? "border-rose-500/50" : "hover:shadow-xs"}`}>
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

      {/* Filter and Action Header */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search asset name, category, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs outline-none cursor-pointer focus:border-ring"
          >
            <option value="All">All Statuses</option>
            {ASSET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {!isReadOnly && (
            <button 
              onClick={() => setModalAsset({})} 
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Grid of Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((a) => {
          const statusClass = statusStyles[a.status] || defaultStatusStyle;
          const isOverdue = a.projectId && a.expectedReturnDate && a.expectedReturnDate < today;

          return (
            <div
              key={a.id}
              className={`bg-card rounded-xl p-5 transition-all duration-200 flex flex-col justify-between group border ${isOverdue ? 'border-rose-500/50 shadow-sm shadow-rose-500/10' : 'border-border hover:shadow-md hover:border-border/80'}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{a.category}</span>
                    <h3 className="text-[14.5px] font-bold text-foreground truncate mt-0.5 flex items-center gap-2">
                      {a.name}
                      {isOverdue && <AlertTriangle size={14} className="text-rose-500 animate-pulse" />}
                    </h3>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">ID: {a.id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${statusClass}`}>
                      {a.status}
                    </span>
                    {!isReadOnly && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => setModalAsset(a)} className="p-1.5 rounded bg-muted hover:bg-primary/20 text-primary transition-colors cursor-pointer border-none">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded bg-muted hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer border-none" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Operator Details */}
                <div className="space-y-2.5 mt-4 pt-3.5 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <MapPin size={13} className="opacity-75" /> Active Site:
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[155px]">
                      {a.projectId ? getProjectName(a.projectId) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <User size={13} className="opacity-75" /> Operator:
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[155px]">
                      {a.operatorId ? getOperatorName(a.operatorId) : "—"}
                    </span>
                  </div>
                  {a.projectId && (
                    <div className={`flex items-center justify-between text-xs pt-1 border-t ${isOverdue ? 'border-rose-500/30 text-rose-500' : 'border-border/30 text-muted-foreground'}`}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className={isOverdue ? "text-rose-500" : "opacity-75"} /> Expected Return:
                      </span>
                      <span className={`font-semibold ${isOverdue ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
                        {a.expectedReturnDate || "Not Set"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Asset Actions */}
              <div className="pt-3 border-t border-border mt-4 flex items-center justify-between">
                <button 
                  onClick={() => setViewAsset(a)}
                  className="text-[11.5px] font-semibold text-primary flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline"
                >
                  View Deployment <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground text-sm bg-card border border-border rounded-xl">
            No assets found matching the criteria.
          </div>
        )}
      </div>

      {modalAsset && (
        <AssetModal
          existing={Object.keys(modalAsset).length ? modalAsset : null}
          projects={projects}
          workers={workers}
          onClose={() => setModalAsset(null)}
          onSave={handleSaveAsset}
        />
      )}

      {viewAsset && (
        <AssetProfileModal
          asset={viewAsset}
          onClose={() => setViewAsset(null)}
          projectName={getProjectName(viewAsset.projectId)}
          operatorName={getOperatorName(viewAsset.operatorId)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete Asset"
          description="Are you sure you want to delete this asset? This action will permanently remove it from the registry."
          itemName={deleteTarget.name}
        />
      )}
    </div>
  );
}
