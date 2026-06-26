"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Calendar, Percent, Building2, ChevronRight, Loader2, FileText } from "lucide-react";
import useProjectStore from "@/store/useProjectStore";
import useInvoiceStore from "@/store/useInvoiceStore";
import useSettingsStore from "@/store/useSettingsStore";

export default function GenerateInvoiceModal({ onClose, onSuccess }) {
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const generateInvoice = useInvoiceStore((s) => s.generateInvoice);
  const settings = useSettingsStore((s) => s.settings);

  const [step, setStep] = useState(1); // 1=config, 2=preview (simplified)
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    projectId: "",
    invoiceType: "progress",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    retentionRate: 5,
    vatRate: parseFloat(settings.vatRate) || 15,
    periodFrom: "",
    periodTo: "",
    notes: "",
    companyName: settings.companyName || "",
    companyReg: settings.registrationNumber || "",
    companyAddress: settings.headquartersAddress || "",
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selectedProject = projects.find((p) => p.id === form.projectId);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleGenerate = async () => {
    if (!form.projectId) return;
    setSubmitting(true);
    try {
      const payload = {
        projectId: form.projectId,
        invoiceType: form.invoiceType,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || null,
        retentionRate: form.retentionRate / 100,
        vatRate: form.vatRate / 100,
        periodFrom: form.periodFrom || null,
        periodTo: form.periodTo || null,
        notes: form.notes,
        companyName: form.companyName,
        companyReg: form.companyReg,
        companyAddress: form.companyAddress,
      };
      const invoice = await generateInvoice(payload);
      onSuccess?.(invoice);
      onClose?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Generate Invoice</h2>
              <p className="text-[11px] text-muted-foreground">Auto-build from progress data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-colors disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Project */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.projectId}
              onChange={(e) => set("projectId", e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50 cursor-pointer"
            >
              <option value="">— Select a project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.client})
                </option>
              ))}
            </select>
            {selectedProject && (
              <div className="mt-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-[11px] font-semibold text-primary">{selectedProject.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedProject.client} · {selectedProject.location}</p>
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Invoice Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["progress", "final", "variation"].map((t) => (
                <button
                  key={t}
                  onClick={() => set("invoiceType", t)}
                  disabled={submitting}
                  className={`py-2 rounded-lg text-[11px] font-bold capitalize transition-all border cursor-pointer disabled:opacity-50
                    ${form.invoiceType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                <Calendar size={10} className="inline mr-1" />Invoice Date
              </label>
              <input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => set("invoiceDate", e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                <Calendar size={10} className="inline mr-1" />Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Period Filter */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Progress Period (optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={form.periodFrom}
                onChange={(e) => set("periodFrom", e.target.value)}
                disabled={submitting}
                placeholder="From"
                className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
              />
              <input
                type="date"
                value={form.periodTo}
                onChange={(e) => set("periodTo", e.target.value)}
                disabled={submitting}
                placeholder="To"
                className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Leave empty to include all logged progress</p>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                <Percent size={10} className="inline mr-1" />Retention Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.retentionRate}
                  onChange={(e) => set("retentionRate", parseFloat(e.target.value) || 0)}
                  disabled={submitting}
                  className="w-full px-3 py-2 pr-8 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">%</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                <Percent size={10} className="inline mr-1" />VAT Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.vatRate}
                  onChange={(e) => set("vatRate", parseFloat(e.target.value) || 0)}
                  disabled={submitting}
                  className="w-full px-3 py-2 pr-8 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="border-t border-border pt-4 space-y-3">
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <Building2 size={10} className="inline mr-1" />Company Details (on invoice)
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="Company name"
              disabled={submitting}
              className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.companyReg}
                onChange={(e) => set("companyReg", e.target.value)}
                placeholder="Reg. / CR number"
                disabled={submitting}
                className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
              />
              <input
                type="text"
                value={form.companyAddress}
                onChange={(e) => set("companyAddress", e.target.value)}
                placeholder="Address"
                disabled={submitting}
                className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Payment terms, bank details, remarks..."
              rows={3}
              disabled={submitting}
              className="w-full px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30 rounded-b-2xl shrink-0 gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!form.projectId || submitting}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={13} />
                Generate Draft Invoice
                <ChevronRight size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
