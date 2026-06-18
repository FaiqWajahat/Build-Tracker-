"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, BookOpen, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TRADES, UOM_LIST, getUomGroups } from "./ScopeConfig";
import useScopeStore from "@/store/useScopeStore";

/* ─── UOM Grouped Select ─────────────────────────────────────────── */
function UomSelect({ value, onChange, className = "" }) {
  const groups = getUomGroups();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 bg-muted text-foreground text-[12.5px] rounded-xl border border-border outline-none focus:border-ring transition-colors cursor-pointer appearance-none ${className}`}
    >
      <option value="">Select UOM...</option>
      {Object.entries(groups).map(([group, items]) => (
        <optgroup key={group} label={group}>
          {items.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

const EMPTY_SCOPE = {
  trade: "",
  name: "",
  uom: "",
  subScopes: [],
};

export default function AddScopeModal({ open, onClose, editScope = null }) {
  const addScope    = useScopeStore((s) => s.addScope);
  const updateScope = useScopeStore((s) => s.updateScope);

  const [form, setForm]       = useState(EMPTY_SCOPE);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});

  const isEdit = !!editScope;

  useEffect(() => {
    if (open) {
      setForm(editScope ? { ...editScope } : EMPTY_SCOPE);
      setErrors({});
      setSaving(false);
    }
  }, [open, editScope]);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  }

  /* ─── Sub-scope helpers ──────────────────────────────────── */
  function addSubScope() {
    set("subScopes", [
      ...form.subScopes,
      { id: `tmp-${Date.now()}`, name: "", uom: form.uom || "" },
    ]);
  }

  function updateSubScope(idx, patch) {
    const updated = form.subScopes.map((ss, i) =>
      i === idx ? { ...ss, ...patch } : ss
    );
    set("subScopes", updated);
  }

  function removeSubScope(idx) {
    set("subScopes", form.subScopes.filter((_, i) => i !== idx));
  }

  /* ─── Validation ─────────────────────────────────────────── */
  function validate() {
    const e = {};
    if (!form.trade)       e.trade = "Trade / Category is required";
    if (!form.name.trim()) e.name  = "Scope name is required";
    if (!form.uom)         e.uom   = "Unit of measure is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ─── Submit ─────────────────────────────────────────────── */
  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    if (isEdit) {
      updateScope(editScope.id, form);
    } else {
      addScope(form);
    }
    setSaving(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">
                {isEdit ? "Edit Scope" : "Add New Scope to Library"}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Scopes are reusable across all projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

          {/* Row 1: Trade + Scope Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Trade / Category" required>
              <select
                value={form.trade}
                onChange={(e) => set("trade", e.target.value)}
                className={`w-full px-3 py-2.5 bg-muted text-foreground text-[12.5px] rounded-xl border outline-none focus:border-ring transition-colors cursor-pointer appearance-none
                  ${errors.trade ? "border-destructive" : "border-border"}`}
              >
                <option value="">Select trade...</option>
                {TRADES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.value}</option>
                ))}
              </select>
              {errors.trade && <p className="text-[10.5px] text-destructive mt-1">{errors.trade}</p>}
            </Field>

            <Field label="Scope Name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Fire Fighting, Landscaping..."
                className={`w-full px-3 py-2.5 bg-muted text-foreground text-[12.5px] rounded-xl border outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/50
                  ${errors.name ? "border-destructive" : "border-border"}`}
              />
              {errors.name && <p className="text-[10.5px] text-destructive mt-1">{errors.name}</p>}
            </Field>
          </div>

          {/* Row 2: UOM */}
          <Field label="Unit of Measure (UOM)" required>
            <div className={`rounded-xl border ${errors.uom ? "border-destructive" : "border-border"}`}>
              <UomSelect value={form.uom} onChange={(v) => set("uom", v)} />
            </div>
            {errors.uom && <p className="text-[10.5px] text-destructive mt-1">{errors.uom}</p>}
          </Field>

          {/* Sub-scopes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide block">
                  Sub-Scopes
                </label>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">
                  Break this scope into measurable sub-items
                  {form.name ? ` (e.g. ${form.name} › Phase Wiring, Earth Wiring...)` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={addSubScope}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25 rounded-lg hover:bg-primary/20 transition-all cursor-pointer shrink-0"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <AnimatePresence initial={false}>
              {form.subScopes.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-4 text-center border-2 border-dashed border-border rounded-xl"
                >
                  <p className="text-[11.5px] text-muted-foreground">
                    No sub-scopes yet — click &quot;Add&quot; to break this scope down
                  </p>
                </motion.div>
              )}
              {form.subScopes.map((ss, idx) => (
                <motion.div
                  key={ss.id}
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 items-start">
                    {/* Index dot */}
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-2.5">
                      {idx + 1}
                    </span>

                    {/* Sub-scope name */}
                    <input
                      type="text"
                      value={ss.name}
                      onChange={(e) => updateSubScope(idx, { name: e.target.value })}
                      placeholder={`Sub-scope name (e.g. Phase Wiring)`}
                      className="flex-1 px-3 py-2.5 bg-muted text-foreground text-[12px] rounded-xl border border-border outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/40"
                    />

                    {/* Sub-scope UOM */}
                    <div className="w-40 shrink-0">
                      <UomSelect
                        value={ss.uom}
                        onChange={(v) => updateSubScope(idx, { uom: v })}
                      />
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeSubScope(idx)}
                      className="mt-2.5 text-destructive/40 hover:text-destructive transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground border border-border bg-transparent rounded-xl cursor-pointer hover:bg-muted transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <BookOpen size={13} />
            )}
            {saving ? "Saving..." : (isEdit ? "Save Changes" : "Save Scope to Library")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
