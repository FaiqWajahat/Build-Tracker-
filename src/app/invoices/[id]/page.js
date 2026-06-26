"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Edit3, Save, X, Loader2,
  Plus, Trash2, Building2, MapPin, FileText,
  Hash, Layers, CheckCircle, Clock, BarChart3, User, TrendingUp
} from "lucide-react";
import useInvoiceStore from "@/store/useInvoiceStore";
import useUserStore from "@/store/useUserStore";
import { useCurrency } from "@/store/useSettingsStore";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:     { label: "Draft",     bg: "bg-slate-100 text-slate-600 border-slate-200" },
  submitted: { label: "Submitted", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  approved:  { label: "Approved",  bg: "bg-violet-50 text-violet-700 border-violet-200" },
  paid:      { label: "Paid",      bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue:   { label: "Overdue",   bg: "bg-rose-50 text-rose-700 border-rose-200" },
};
const TYPE_LABELS = {
  progress: "Progress Invoice",
  final: "Final Invoice",
  variation: "Variation Order",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtMoney(n, cur = "SAR") {
  return `${cur} ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtShortDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function pctStr(r) {
  return `${(Number(r || 0) * 100).toFixed(1)}%`;
}

// ─── Progress Ring SVG ───────────────────────────────────────────────────────
function ProgressRing({ value = 0, size = 52, stroke = 5, color = "#1e293b" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const currency = useCurrency();
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";
  const { fetchInvoice, updateInvoice } = useInvoiceStore();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [retentionInput, setRetentionInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvoice(id);
      setInvoice(data);
      setDraft(data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [id, fetchInvoice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(invoice)));
    setRetentionInput(invoice ? (Number(invoice.retentionRate || 0) * 100).toString() : "");
    setIsEditing(true);
  };
  const cancelEdit = () => {
    setDraft(JSON.parse(JSON.stringify(invoice)));
    setRetentionInput(invoice ? (Number(invoice.retentionRate || 0) * 100).toString() : "");
    setIsEditing(false);
  };
  const setField = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  const setLineItem = (idx, key, val) => {
    setDraft((d) => {
      const items = [...(d.lineItems || [])];
      items[idx] = { ...items[idx], [key]: val };
      const rate = parseFloat(items[idx].rate || 0);
      const cQty = parseFloat(items[idx].currentQty || 0);
      const pQty = parseFloat(items[idx].prevQty || 0);
      items[idx].currentAmount = cQty * rate;
      items[idx].prevAmount = pQty * rate;
      items[idx].totalAmount = (pQty + cQty) * rate;
      return { ...d, lineItems: items };
    });
  };

  const addLineItem = () => {
    setDraft((d) => ({
      ...d,
      lineItems: [...(d.lineItems || []),
        { id: Date.now(), description: "", unitLabel: "No.", prevQty: 0, currentQty: 0, totalQty: 0, rate: 0, prevAmount: 0, currentAmount: 0, totalAmount: 0 }
      ],
    }));
  };

  const removeLineItem = (idx) =>
    setDraft((d) => ({ ...d, lineItems: (d.lineItems || []).filter((_, i) => i !== idx) }));

  const computeSummary = (inv) => {
    if (!inv) return {};
    const subtotal = (inv.lineItems || []).reduce((s, li) => s + Number(li.currentAmount || 0), 0);
    const retentionRate = Number(inv.retentionRate || 0.05);
    const vatRate = 0;
    const retention = subtotal * retentionRate;
    const netAfterRetention = subtotal - retention;
    const vat = netAfterRetention * vatRate;
    return { subtotal, retentionRate, retention, netAfterRetention, vatRate, vat, grandTotal: netAfterRetention + vat };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateInvoice(id, {
        invoiceDate: draft.invoiceDate, dueDate: draft.dueDate,
        invoiceType: draft.invoiceType, status: draft.status,
        retentionRate: draft.retentionRate, vatRate: draft.vatRate,
        notes: draft.notes, companyName: draft.companyName,
        companyReg: draft.companyReg, companyAddress: draft.companyAddress,
        periodFrom: draft.periodFrom, periodTo: draft.periodTo,
        lineItems: (draft.lineItems || []).map((li) => ({
          assignmentId: li.assignmentId || null,
          description: li.description, unitLabel: li.unitLabel,
          prevQty: parseFloat(li.prevQty || 0), currentQty: parseFloat(li.currentQty || 0),
          totalQty: parseFloat(li.totalQty || 0), rate: parseFloat(li.rate || 0),
          prevAmount: parseFloat(li.prevAmount || 0), currentAmount: parseFloat(li.currentAmount || 0),
          totalAmount: parseFloat(li.totalAmount || 0),
        })),
      });
      setInvoice({ ...updated, progressData: invoice?.progressData || [] });
      setDraft({ ...updated, progressData: invoice?.progressData || [] });
      setIsEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // ─── Programmatic PDF generation using jsPDF directly ─────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      const inv = invoice;
      if (!inv) return;
      const summary = computeSummary(inv);
      const lineItems = inv.lineItems || [];
      const progressData = inv.progressData || [];

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210; // A4 width mm
      const H = 297; // A4 height mm
      const ml = 14; // left margin
      const mr = W - 14; // right margin
      const cw = mr - ml; // content width

      // ── Color palette ──────────────────────────────────────────────────
      const DARK   = [15, 23, 42];    // #0f172a
      const SLATE  = [30, 41, 59];    // #1e293b
      const MID    = [51, 65, 85];    // #334155
      const LIGHT  = [148, 163, 184]; // #94a3b8
      const WHITE  = [255, 255, 255];
      const SUBTLE = [241, 245, 249]; // #f1f5f9
      const BORDER = [226, 232, 240]; // #e2e8f0
      const GREEN  = [16, 185, 129];  // #10b981
      const ROSE   = [225, 29, 72];   // #e11d48
      const GOLD   = [196, 177, 156]; // #c4b19c

      // ── Helpers ─────────────────────────────────────────────────────────
      const setRGB   = (r, g, b) => { pdf.setFillColor(r, g, b); pdf.setTextColor(r, g, b); };
      const fillRect = (x, y, w, h, r, g, b) => { pdf.setFillColor(r, g, b); pdf.rect(x, y, w, h, "F"); };
      const line     = (x1, y1, x2, y2, r, g, b, lw = 0.3) => {
        pdf.setDrawColor(r, g, b);
        pdf.setLineWidth(lw);
        pdf.line(x1, y1, x2, y2);
      };
      const txt      = (text, x, y, size, r, g, b, style = "normal", align = "left") => {
        pdf.setFontSize(size);
        pdf.setFont("helvetica", style);
        pdf.setTextColor(r, g, b);
        pdf.text(String(text || ""), x, y, { align });
      };
      const mny = (n) => fmtMoney(n, currency);

      // ══════════════════════════════════════════════════════════════════
      // PAGE 1 — INVOICE
      // ══════════════════════════════════════════════════════════════════

      // Header banner
      fillRect(0, 0, W, 42, ...SLATE);

      // Company name + reg
      txt(inv.companyName || "Your Company", ml, 14, 16, ...WHITE, "bold");
      txt(inv.companyReg  || "", ml, 20, 8, 148, 163, 184);
      txt(inv.companyAddress || "", ml, 25.5, 7, 148, 163, 184);

      // Invoice type label
      txt(TYPE_LABELS[inv.invoiceType] || "INVOICE", mr, 10, 7, ...GOLD, "bold", "right");
      // Invoice number
      txt(inv.id || "", mr, 21, 22, ...WHITE, "bold", "right");
      // Status badge
      const statusLabel = STATUS_CONFIG[inv.status]?.label || inv.status || "Draft";
      const badgeW = pdf.getTextWidth(statusLabel) + 6;
      fillRect(mr - badgeW, 26, badgeW, 7, ...MID);
      txt(statusLabel, mr - badgeW / 2, 30.8, 7, ...GOLD, "bold", "center");

      // Info row (4 cols)
      let y = 48;
      const infoColW = cw / 4;
      const infoCols = [
        { label: "Invoice Date", value: fmtDate(inv.invoiceDate) },
        { label: "Due Date",     value: fmtDate(inv.dueDate) || "—" },
        { label: "Invoice No.",  value: `#${inv.invoiceNumber || 1}` },
        { label: "Invoice Type", value: TYPE_LABELS[inv.invoiceType] || "Progress" },
      ];
      infoCols.forEach((c, i) => {
        const x = ml + i * infoColW;
        txt(c.label.toUpperCase(), x, y, 6, ...LIGHT, "bold");
        txt(c.value, x, y + 5.5, 9, ...DARK, "bold");
      });

      // Divider
      y = 60;
      line(ml, y, mr, y, ...BORDER, 0.4);

      // Bill-to & Period
      y = 66;
      txt("BILL TO", ml, y, 6, ...LIGHT, "bold");
      txt("PROGRESS PERIOD", ml + cw / 2, y, 6, ...LIGHT, "bold");

      y += 5;
      txt(inv.clientName || "—", ml, y, 10, ...DARK, "bold");
      txt(inv.location   || "—", ml + cw / 2, y, 10, ...DARK, "bold");
      y += 5;
      txt(`Project: ${inv.projectName || "—"}`, ml, y, 7.5, 71, 85, 105);
      const period = inv.periodFrom
        ? `${fmtDate(inv.periodFrom)} → ${fmtDate(inv.periodTo)}`
        : "All progress to date";
      txt(period, ml + cw / 2, y, 7.5, 71, 85, 105);
      y += 4.5;
      txt(`Ref: ${inv.projectId || "—"}`, ml, y, 7.5, 71, 85, 105);

      // ── Line items table ─────────────────────────────────────────────
      y = 97;
      // Table header bg
      fillRect(ml, y, cw, 8, ...SLATE);

      // Column definitions — widths sum exactly to cw (182 mm) so nothing overflows
      // x = left edge of column, w = column width
      // Description:50 + Unit:12 + PrevQty:20 + CurQty:20 + TotalQty:18 + Rate:20 + PrevAmt:22 + CurAmt:20 = 182
      const C = {
        desc:    { x: ml,        w: 50 },
        unit:    { x: ml + 50,   w: 12 },
        prevQty: { x: ml + 62,   w: 20 },
        curQty:  { x: ml + 82,   w: 20 },
        totQty:  { x: ml + 102,  w: 18 },
        rate:    { x: ml + 120,  w: 20 },
        prevAmt: { x: ml + 140,  w: 22 },
        curAmt:  { x: ml + 162,  w: 20 }, // ends at ml+182 = mr exactly
      };
      const endOf = (col) => col.x + col.w;

      // Header labels
      const hdr = [
        ["Description", C.desc.x + 2,          "left"  ],
        ["Unit",        C.unit.x + C.unit.w/2,  "center"],
        ["Prev Qty",    endOf(C.prevQty),        "right" ],
        ["This Period", endOf(C.curQty),         "right" ],
        ["Total Qty",   endOf(C.totQty),         "right" ],
        ["Rate",        endOf(C.rate),           "right" ],
        ["Prev Amt",    endOf(C.prevAmt),        "right" ],
        ["Cur Amt",     endOf(C.curAmt) - 1,     "right" ],
      ];
      hdr.forEach(([label, hx, align]) => txt(label, hx, y + 5.5, 5.5, ...WHITE, "bold", align));

      y += 8;

      // Rows
      lineItems.forEach((li, idx) => {
        const rowH = 9;
        if (idx % 2 === 0) fillRect(ml, y, cw, rowH, ...SUBTLE);
        line(ml, y + rowH, mr, y + rowH, ...BORDER, 0.2);

        const cy = y + 6;
        // Clip description to avoid overrunning Unit column
        const descText = pdf.splitTextToSize(li.description || "—", C.desc.w - 2)[0] || "";
        txt(descText,              C.desc.x + 2,         cy, 7,   ...DARK, "bold");
        txt(li.unitLabel || "—",   C.unit.x + C.unit.w/2, cy, 6.5, 71, 85, 105, "normal", "center");
        txt(fmtNum(li.prevQty),    endOf(C.prevQty) - 1,  cy, 6.5, 71, 85, 105, "normal", "right");
        txt(fmtNum(li.currentQty), endOf(C.curQty)  - 1,  cy, 7,   ...DARK, "bold",   "right");
        txt(fmtNum(li.totalQty),   endOf(C.totQty)  - 1,  cy, 6.5, 71, 85, 105, "normal", "right");
        txt(fmtNum(li.rate),       endOf(C.rate)    - 1,  cy, 6.5, 71, 85, 105, "normal", "right");
        txt(fmtNum(li.prevAmount), endOf(C.prevAmt) - 1,  cy, 6.5, 71, 85, 105, "normal", "right");
        txt(fmtNum(li.currentAmount), endOf(C.curAmt) - 1, cy, 7,  ...DARK, "bold",   "right");

        y += rowH;
      });

      if (lineItems.length === 0) {
        fillRect(ml, y, cw, 12, ...SUBTLE);
        txt("No line items", W / 2, y + 8, 8, ...LIGHT, "normal", "center");
        y += 12;
      }

      line(ml, y, mr, y, ...BORDER, 0.4);

      // ── Financial summary ───────────────────────────────────────────
      y += 6;
      const sumX  = mr - 82;
      const sumW  = 82;
      const sumLW = 50;
      const sumRX = mr;

      const summaryRows = [
        { label: "Subtotal (This Period)", value: mny(summary.subtotal), bold: false, color: [...DARK] },
        { label: `Retention (${pctStr(inv.retentionRate)})`, value: `- ${mny(summary.retention)}`, bold: false, color: [...ROSE] },
        { label: "Net After Retention",    value: mny(summary.netAfterRetention), bold: true, color: [...DARK] },
      ];

      summaryRows.forEach((row, i) => {
        if (i === 2) {
          line(sumX, y - 1.5, mr, y - 1.5, ...BORDER, 0.4);
        }
        txt(row.label, sumX, y + 4, 7.5, 71, 85, 105, row.bold ? "bold" : "normal");
        txt(row.value, sumRX, y + 4, 7.5, ...row.color, row.bold ? "bold" : "normal", "right");
        y += 7;
      });

      y += 1;
      // Grand Total banner
      fillRect(sumX - 2, y, sumW + 2, 13, ...DARK);
      txt("TOTAL DUE", sumX + 2, y + 5, 6.5, ...GOLD, "bold");
      txt(currency, sumX + 2, y + 9.5, 6, 148, 163, 184);
      txt(mny(summary.grandTotal), sumRX - 2, y + 8.5, 12, ...WHITE, "bold", "right");

      // Notes
      if (inv.notes) {
        y += 18;
        line(ml, y, mr, y, ...BORDER, 0.3);
        y += 5;
        txt("NOTES & PAYMENT TERMS", ml, y, 6, ...LIGHT, "bold");
        y += 4;
        const noteLines = pdf.splitTextToSize(inv.notes, cw - 4);
        noteLines.forEach((nl) => {
          txt(nl, ml, y + 4, 7.5, 71, 85, 105);
          y += 4.5;
        });
      }

      // ── Page 1 footer ───────────────────────────────────────────────
      fillRect(0, H - 14, W, 14, ...SUBTLE);
      line(0, H - 14, W, H - 14, ...BORDER, 0.3);
      txt("Generated by BuildTrack ERP · Construction Management Platform", ml, H - 6, 7, 100, 116, 139, "normal");
      txt("Page 1 of 2", mr, H - 10, 6.5, ...LIGHT, "normal", "right");
      txt(`${inv.id} · ${fmtDate(inv.invoiceDate)}`, mr, H - 5.5, 6.5, ...LIGHT, "normal", "right");

      // ══════════════════════════════════════════════════════════════════
      // PAGE 2 — PROJECT PROGRESS REPORT
      // ══════════════════════════════════════════════════════════════════
      pdf.addPage();

      // Page 2 header
      fillRect(0, 0, W, 50, ...DARK);

      txt("PROJECT PROGRESS REPORT", ml, 10, 7, ...GOLD, "bold");
      txt(inv.projectName || "Project", ml, 21, 16, ...WHITE, "bold");
      txt(`Attached to Invoice ${inv.id} · ${fmtDate(inv.invoiceDate)}`, ml, 28, 7.5, 148, 163, 184);

      // Overall progress ring (simple filled circle visual)
      const totalContract = progressData.reduce((s, a) => s + (a.contractValue || 0), 0);
      const totalEarned   = progressData.reduce((s, a) => s + (a.earnedValue || 0), 0);
      const overallPct    = totalContract > 0 ? Math.min(100, Math.round((totalEarned / totalContract) * 100)) : 0;

      txt("OVERALL COMPLETION", mr, 10, 6, 148, 163, 184, "bold", "right");
      txt(`${overallPct}%`, mr, 22, 18, ...WHITE, "bold", "right");

      // Key metrics
      const metrics = [
        { label: "Contract Value",  value: mny(totalContract) },
        { label: "Earned to Date",  value: mny(totalEarned) },
        { label: "Remaining",       value: mny(totalContract - totalEarned) },
        { label: "Total Scopes",    value: String(progressData.length) },
      ];
      const mColW = cw / 4;
      metrics.forEach((m, i) => {
        const mx = ml + i * mColW;
        fillRect(mx, 34, mColW - 3, 13, 30, 41, 59);
        txt(m.label.toUpperCase(), mx + 3, 39, 5.5, 148, 163, 184, "bold");
        txt(m.value, mx + 3, 44, 7.5, ...WHITE, "bold");
      });

      y = 57;

      // Scope breakdown
      txt("SCOPE-BY-SCOPE PROGRESS BREAKDOWN", ml, y, 6, ...LIGHT, "bold");
      y += 5;

      if (progressData.length === 0) {
        fillRect(ml, y, cw, 16, ...SUBTLE);
        txt("No scope assignments found for this project.", W / 2, y + 10, 8, ...LIGHT, "normal", "center");
        y += 16;
      }

      const addPageIfNeeded = (needed) => {
        if (y + needed > H - 18) {
          // Footer for this page
          fillRect(0, H - 14, W, 14, ...SUBTLE);
          line(0, H - 14, W, H - 14, ...BORDER, 0.3);
          txt("BuildTrack ERP · Project Progress Report", ml, H - 6, 7, 100, 116, 139);
          txt(`${inv.id} · ${inv.projectId}`, mr, H - 6, 6.5, ...LIGHT, "normal", "right");

          pdf.addPage();
          // Header for continuation page
          fillRect(0, 0, W, 12, ...DARK);
          txt(`${inv.projectName} — Scope Breakdown (continued)`, ml, 8, 7.5, ...WHITE, "bold");
          txt(inv.id, mr, 8, 7.5, ...GOLD, "bold", "right");
          y = 18;
        }
      };

      progressData.forEach((scope, si) => {
        const isComplete = scope.pct >= 100;
        const isAtRisk   = scope.pct < 30 && scope.totalQty > 0;
        const accentR    = isComplete ? GREEN : isAtRisk ? ROSE : SLATE;
        const hasUnits   = scope.unitBreakdown?.length > 0;
        const hasPhases  = scope.phaseBreakdown?.length > 0;
        const breakdown  = hasUnits ? scope.unitBreakdown : hasPhases ? scope.phaseBreakdown : [];
        const neededH    = 16 + (breakdown.length > 0 ? 8 + breakdown.length * 6.5 : 0);

        addPageIfNeeded(neededH + 4);

        // Scope header strip
        fillRect(ml, y, cw, 13, isComplete ? 240 : isAtRisk ? 255 : 248, isComplete ? 253 : isAtRisk ? 241 : 250, isComplete ? 244 : isAtRisk ? 242 : 252);
        line(ml, y, ml + 3, y, ...accentR, 3);

        txt(scope.scopeName || "—", ml + 5, y + 5.5, 8.5, ...DARK, "bold");
        if (scope.trade) txt(scope.trade, ml + 5, y + 10, 6.5, 71, 85, 105);
        if (scope.assigneeName) txt(`👤 ${scope.assigneeName}`, ml + 60, y + 10, 6.5, 71, 85, 105);

        // Right side: contract & earned & pct
        txt("Contract", mr - 90, y + 5, 5.5, ...LIGHT, "bold");
        txt(mny(scope.contractValue), mr - 90, y + 10, 7, ...DARK, "bold");
        txt("Earned", mr - 46, y + 5, 5.5, ...LIGHT, "bold");
        txt(mny(scope.earnedValue), mr - 46, y + 10, 7, ...accentR, "bold");
        txt(`${scope.pct}%`, mr, y + 9, 11, ...accentR, "bold", "right");

        y += 13;

        // Progress bar
        const barW = cw;
        fillRect(ml, y, barW, 3, ...BORDER);
        fillRect(ml, y, barW * scope.pct / 100, 3, ...accentR);
        txt(`${fmtNum(scope.doneQty)} / ${fmtNum(scope.totalQty)} ${scope.uom || "units"}`, ml, y + 7, 6.5, 71, 85, 105);
        txt(`${fmtNum(scope.remainingQty)} remaining`, mr, y + 7, 6.5, 71, 85, 105, "normal", "right");
        y += 10;

        // Breakdown table
        if (breakdown.length > 0) {
          const isUnit = hasUnits;
          const bLabel = isUnit ? "Unit" : "Phase";
          // Mini table header
          fillRect(ml, y, cw, 6, ...MID);
          txt(bLabel,      ml + 2, y + 4.3, 5.5, ...WHITE, "bold");
          txt("Target",    ml + 75, y + 4.3, 5.5, ...WHITE, "bold", "right");
          txt("Done",      ml + 105, y + 4.3, 5.5, ...WHITE, "bold", "right");
          txt("Remaining", ml + 135, y + 4.3, 5.5, ...WHITE, "bold", "right");
          txt("Progress",  mr, y + 4.3, 5.5, ...WHITE, "bold", "right");
          y += 6;

          breakdown.forEach((item, bi) => {
            if (bi % 2 === 0) fillRect(ml, y, cw, 6, ...SUBTLE);
            const label = isUnit ? (item.unitName || item.unitId) : (item.phaseName || item.phaseId);
            txt(label || "—", ml + 2, y + 4.3, 6, ...DARK);
            txt(fmtNum(item.qty),       ml + 75, y + 4.3, 6, 71, 85, 105, "normal", "right");
            txt(fmtNum(item.done),      ml + 105, y + 4.3, 6, ...DARK, "bold", "right");
            txt(fmtNum(item.remaining), ml + 135, y + 4.3, 6, 71, 85, 105, "normal", "right");
            // Progress bar inline
            const pbW = 28;
            const pbX = mr - pbW;
            fillRect(pbX, y + 1.5, pbW, 2.5, ...BORDER);
            fillRect(pbX, y + 1.5, pbW * item.pct / 100, 2.5, ...accentR);
            txt(`${item.pct}%`, mr, y + 4.3, 5.5, ...DARK, "normal", "right");
            y += 6;
          });
        }

        // Recent logs for project-level scopes
        if (!hasUnits && !hasPhases && scope.recentLogs?.length > 0) {
          scope.recentLogs.slice(0, 4).forEach((log) => {
            addPageIfNeeded(7);
            txt(`• ${fmtShortDate(log.date)}  +${fmtNum(log.qty)} ${scope.uom || ""}${log.notes ? `  — ${log.notes}` : ""}`, ml + 4, y + 5, 6.5, 71, 85, 105);
            y += 6;
          });
        }

        y += 4; // gap between scopes
      });

      // Financial summary banner
      if (progressData.length > 0) {
        addPageIfNeeded(32);
        y += 2;
        fillRect(ml, y, cw, 28, ...DARK);
        txt("PROJECT FINANCIAL SUMMARY", ml + 4, y + 6, 6.5, ...GOLD, "bold");
        const fsCols = [
          { label: "Total Contract Value", value: mny(totalContract), color: [...GOLD] },
          { label: "Total Earned to Date", value: mny(totalEarned),   color: [...GREEN] },
          { label: "Outstanding Balance",  value: mny(totalContract - totalEarned), color: [251, 191, 36] },
        ];
        fsCols.forEach((c, i) => {
          const cx = ml + 4 + i * (cw / 3);
          txt(c.label.toUpperCase(), cx, y + 13, 5.5, 148, 163, 184, "bold");
          txt(c.value, cx, y + 21, 9, ...c.color, "bold");
        });
        // Overall bar
        const barY = y + 25;
        fillRect(ml, barY, cw, 2.5, 30, 41, 59);
        fillRect(ml, barY, cw * overallPct / 100, 2.5, ...GOLD);
        y += 32;
      }

      // ── Page 2 footer ───────────────────────────────────────────────
      fillRect(0, H - 14, W, 14, ...SUBTLE);
      line(0, H - 14, W, H - 14, ...BORDER, 0.3);
      txt("BuildTrack ERP · Project Progress Report — Confidential", ml, H - 6, 7, 100, 116, 139);
      txt(`${inv.id} · ${inv.projectId}`, mr, H - 6, 6.5, ...LIGHT, "normal", "right");

      const totalPages = pdf.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        txt(`Page ${p} of ${totalPages}`, mr, H - 10, 6.5, ...LIGHT, "normal", "right");
      }

      pdf.save(`${inv.id}_${(inv.projectName || "invoice").replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setDownloading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm">Loading invoice...</p>
      </div>
    </div>
  );

  if (!invoice) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-bold">Invoice not found</p>
        <button onClick={() => router.push("/invoices")} className="mt-3 text-primary text-sm hover:underline cursor-pointer">← Back to Invoices</button>
      </div>
    </div>
  );

  const display  = isEditing ? draft : invoice;
  const summary  = computeSummary(display);
  const scfg     = STATUS_CONFIG[display?.status] || STATUS_CONFIG.draft;
  const lineItems = display?.lineItems || [];
  const progressData = invoice?.progressData || [];
  const totalContract = progressData.reduce((s, a) => s + (a.contractValue || 0), 0);
  const totalEarned   = progressData.reduce((s, a) => s + (a.earnedValue || 0), 0);
  const overallPct    = totalContract > 0 ? Math.min(100, Math.round((totalEarned / totalContract) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Action Bar ── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => router.push("/invoices")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft size={15} /> Back to Invoices
          </button>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={cancelEdit} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer disabled:opacity-40">
                  <X size={13} /> Discard
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50 shadow-sm">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                {!isReadOnly && (
                  <button onClick={startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 transition-all cursor-pointer border border-border">
                    <Edit3 size={13} /> Edit
                  </button>
                )}
                <button onClick={handleDownload} disabled={downloading}
                  className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-60">
                  {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  {downloading ? "Generating PDF..." : "Download PDF"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ══════════════════════════════════════════════════════════
            INVOICE CARD — PAGE 1 VIEW
        ══════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)" }}>
            <div className="flex items-start justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                    <Building2 size={20} className="text-white" />
                  </div>
                  {isEditing ? (
                    <div className="space-y-1">
                      <input value={draft.companyName || ""} onChange={(e) => setField("companyName", e.target.value)}
                        className="bg-white/10 text-white font-bold text-lg rounded px-2 py-0.5 border border-white/20 outline-none w-56" placeholder="Company Name" />
                      <input value={draft.companyReg || ""} onChange={(e) => setField("companyReg", e.target.value)}
                        className="bg-white/10 text-white/60 text-xs rounded px-2 py-0.5 border border-white/20 outline-none w-44 block" placeholder="Reg No." />
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-white font-bold text-lg leading-tight">{display.companyName || "Your Company"}</h1>
                      <p className="text-white/50 text-xs mt-0.5">{display.companyReg}</p>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <input value={draft.companyAddress || ""} onChange={(e) => setField("companyAddress", e.target.value)}
                    className="bg-white/10 text-white/60 text-xs rounded px-2 py-1 border border-white/20 outline-none w-72" placeholder="Company Address" />
                ) : (
                  <p className="text-white/50 text-xs">{display.companyAddress}</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-[#c4b19c] text-[10px] font-bold uppercase tracking-widest mb-1">
                  {TYPE_LABELS[display.invoiceType] || "Invoice"}
                </p>
                <h2 className="text-4xl font-black text-white tracking-tight">{display.id}</h2>
                <div className="mt-2 flex justify-end">
                  {isEditing ? (
                    <select value={draft.status} onChange={(e) => setField("status", e.target.value)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer bg-white text-slate-800">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${scfg.bg}`}>
                      {scfg.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info strip */}
            <div className="grid grid-cols-4 gap-6 mt-6 pt-5 border-t border-white/10">
              {[
                { label: "Invoice Date", content: isEditing
                  ? <input type="date" value={draft.invoiceDate || ""} onChange={(e) => setField("invoiceDate", e.target.value)} className="bg-white/10 text-white text-sm font-semibold rounded px-2 py-0.5 border border-white/20 outline-none w-full" />
                  : <p className="text-white text-sm font-semibold">{fmtDate(display.invoiceDate)}</p> },
                { label: "Due Date", content: isEditing
                  ? <input type="date" value={draft.dueDate || ""} onChange={(e) => setField("dueDate", e.target.value)} className="bg-white/10 text-white text-sm font-semibold rounded px-2 py-0.5 border border-white/20 outline-none w-full" />
                  : <p className="text-white text-sm font-semibold">{fmtDate(display.dueDate)}</p> },
                { label: "Invoice No.", content: <p className="text-white text-sm font-semibold">#{display.invoiceNumber}</p> },
                { label: "Invoice Type", content: isEditing
                  ? <select value={draft.invoiceType} onChange={(e) => setField("invoiceType", e.target.value)} className="bg-white/10 text-white text-xs font-semibold rounded px-2 py-1 border border-white/20 outline-none capitalize w-full">
                      {["progress","final","variation"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  : <p className="text-white text-sm font-semibold capitalize">{display.invoiceType}</p> },
              ].map((col) => (
                <div key={col.label}>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">{col.label}</p>
                  {col.content}
                </div>
              ))}
            </div>
          </div>

          {/* Bill To + Period */}
          <div className="grid grid-cols-2 border-b border-slate-100" style={{ background: "#f8fafc" }}>
            <div className="px-8 py-5 border-r border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Bill To</p>
              <p className="font-bold text-slate-800">{display.clientName || "—"}</p>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1"><MapPin size={10} /> {display.location || "—"}</p>
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1"><FileText size={10} /> Project: <span className="font-semibold text-slate-700 ml-0.5">{display.projectName}</span></p>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1"><Hash size={10} /> Ref: <span className="font-semibold text-slate-700 ml-0.5">{display.projectId}</span></p>
            </div>
            <div className="px-8 py-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Progress Period</p>
              {isEditing ? (
                <div className="space-y-1.5">
                  {[["From","periodFrom"],["To","periodTo"]].map(([lbl,key]) => (
                    <div key={key} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-7">{lbl}:</span>
                      <input type="date" value={draft[key] || ""} onChange={(e) => setField(key, e.target.value)}
                        className="border border-slate-200 rounded px-2 py-0.5 text-slate-700 outline-none focus:border-blue-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-800 text-sm font-semibold">
                  {display.periodFrom ? `${fmtDate(display.periodFrom)} → ${fmtDate(display.periodTo)}` : "All progress to date"}
                </p>
              )}
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                <Layers size={10} /> Type: <span className="font-semibold text-slate-700 ml-0.5 capitalize">{display.invoiceType}</span>
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Work Items & Quantities</p>
              {isEditing && (
                <button onClick={addLineItem} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                  <Plus size={11} /> Add Line
                </button>
              )}
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="grid text-[9px] font-black uppercase tracking-wider text-white px-4 py-2.5"
                style={{ background: "linear-gradient(90deg, #1e293b, #334155)", gridTemplateColumns: "3fr 0.6fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr 1.1fr" + (isEditing ? " 0.35fr" : "") }}>
                <span>Description</span><span className="text-center">Unit</span>
                <span className="text-right">Prev Qty</span><span className="text-right">This Period</span><span className="text-right">Total</span>
                <span className="text-right">Rate</span><span className="text-right">Prev Amt</span><span className="text-right">This Period</span>
                {isEditing && <span />}
              </div>
              {lineItems.map((li, idx) => (
                <div key={li.id || idx}
                  className={`grid items-center px-4 py-3 border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  style={{ gridTemplateColumns: "3fr 0.6fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr 1.1fr" + (isEditing ? " 0.35fr" : "") }}>
                  {isEditing
                    ? <input value={li.description} onChange={(e) => setLineItem(idx, "description", e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none focus:border-blue-400 w-full" />
                    : <span className="text-xs font-semibold text-slate-800 pr-2">{li.description}</span>}
                  {isEditing
                    ? <input value={li.unitLabel} onChange={(e) => setLineItem(idx, "unitLabel", e.target.value)} className="border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:border-blue-400 text-center w-full" />
                    : <span className="text-[11px] text-slate-500 text-center">{li.unitLabel}</span>}
                  {isEditing
                    ? <input type="number" value={li.prevQty} onChange={(e) => setLineItem(idx, "prevQty", e.target.value)} className="border border-slate-200 rounded px-1 py-1 text-xs text-right outline-none focus:border-blue-400 w-full" />
                    : <span className="text-xs text-slate-500 text-right">{fmtNum(li.prevQty)}</span>}
                  {isEditing
                    ? <input type="number" value={li.currentQty} onChange={(e) => setLineItem(idx, "currentQty", e.target.value)} className="border border-blue-200 bg-blue-50 rounded px-1 py-1 text-xs font-semibold text-blue-800 text-right outline-none focus:border-blue-400 w-full" />
                    : <span className="text-xs font-bold text-slate-800 text-right">{fmtNum(li.currentQty)}</span>}
                  <span className="text-xs text-slate-500 text-right">{fmtNum(li.totalQty)}</span>
                  {isEditing
                    ? <input type="number" value={li.rate} onChange={(e) => setLineItem(idx, "rate", e.target.value)} className="border border-slate-200 rounded px-1 py-1 text-xs text-right outline-none focus:border-blue-400 w-full" />
                    : <span className="text-xs text-slate-500 text-right">{fmtNum(li.rate)}</span>}
                  <span className="text-xs text-slate-500 text-right">{fmtNum(li.prevAmount)}</span>
                  <span className="text-xs font-bold text-slate-800 text-right">{fmtNum(li.currentAmount)}</span>
                  {isEditing && (
                    <button onClick={() => removeLineItem(idx)} className="flex justify-center text-rose-400 hover:text-rose-600 cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              {lineItems.length === 0 && (
                <div className="px-4 py-10 text-center text-slate-400 text-xs">
                  No line items.{isEditing && " Click 'Add Line' to add work items."}
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="px-8 pb-8 flex justify-end">
            <div className="w-80">
              <div className="h-px bg-gradient-to-r from-slate-800 to-slate-400 mb-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal (This Period)</span>
                  <span className="font-semibold">{fmtMoney(summary.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 items-center">
                  <div className="flex items-center gap-2">
                    <span>Retention</span>
                    {isEditing ? (
                      <div className="flex items-center gap-0.5">
                        <input type="number" value={retentionInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRetentionInput(val);
                            const parsed = parseFloat(val);
                            setField("retentionRate", isNaN(parsed) ? 0 : parsed / 100);
                          }}
                          className="w-12 border border-slate-200 rounded px-1 text-xs outline-none text-center" />
                        <span className="text-[10px]">%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-bold">{pctStr(display.retentionRate)}</span>
                    )}
                  </div>
                  <span className="font-semibold text-rose-600">- {fmtMoney(summary.retention, currency)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-800 py-2 border-t border-slate-100">
                  <span>Net After Retention</span><span>{fmtMoney(summary.netAfterRetention, currency)}</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl px-5 py-4" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[#c4b19c] text-[8px] font-black uppercase tracking-widest">Total Due</p>
                    <p className="text-white/50 text-[9px] mt-0.5">{currency}</p>
                  </div>
                  <p className="text-white font-black text-xl tracking-tight">{fmtMoney(summary.grandTotal, currency)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(display.notes || isEditing) && (
            <div className="px-8 pb-8 border-t border-slate-100 pt-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes & Payment Terms</p>
              {isEditing ? (
                <textarea value={draft.notes || ""} onChange={(e) => setField("notes", e.target.value)}
                  rows={3} placeholder="Bank details, payment terms, remarks..."
                  className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none resize-none bg-slate-50" />
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{display.notes}</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-4 flex items-center justify-between" style={{ background: "#f1f5f9", borderTop: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold text-slate-500">BuildTrack ERP · Construction Management Platform</p>
            <p className="text-[10px] text-slate-400">{display.id} · {fmtDate(display.invoiceDate)}</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            PROJECT PROGRESS REPORT — PAGE 2 VIEW
        ══════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

          {/* Page 2 Header */}
          <div className="px-8 py-8" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b 50%, #334155 100%)" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={16} className="text-[#c4b19c]" />
                  <p className="text-[#c4b19c] text-[10px] font-black uppercase tracking-widest">Project Progress Report</p>
                </div>
                <h2 className="text-2xl font-black text-white">{display.projectName}</h2>
                <p className="text-white/50 text-xs mt-1">Attached to Invoice {display.id} · {fmtDate(display.invoiceDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Overall Completion</p>
                <div className="relative inline-flex items-center justify-center">
                  <ProgressRing value={overallPct} size={72} stroke={6} color="#c4b19c" />
                  <span className="absolute text-white font-black text-sm">{overallPct}%</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
              {[
                { label: "Contract Value",  value: fmtMoney(totalContract, currency) },
                { label: "Earned to Date",  value: fmtMoney(totalEarned, currency) },
                { label: "Remaining",       value: fmtMoney(totalContract - totalEarned, currency) },
                { label: "Total Scopes",    value: progressData.length },
              ].map((m) => (
                <div key={m.label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="text-white font-bold text-sm">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scope list */}
          <div className="px-8 py-6 space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Scope-by-Scope Progress</p>

            {progressData.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No scope assignments found.</div>
            ) : progressData.map((scope, si) => {
              const isComplete = scope.pct >= 100;
              const isAtRisk   = scope.pct < 30 && scope.totalQty > 0;
              const accent     = isComplete ? "emerald" : isAtRisk ? "rose" : "slate";
              const accentColors = {
                emerald: { bg: "#f0fdf4", border: "#10b981", text: "#065f46", bar: "#10b981" },
                rose:    { bg: "#fff1f2", border: "#f43f5e", text: "#be123c", bar: "#f43f5e" },
                slate:   { bg: "#f8fafc", border: "#334155", text: "#1e293b", bar: "#1e293b" },
              }[accent];
              const hasUnits  = scope.unitBreakdown?.length > 0;
              const hasPhases = scope.phaseBreakdown?.length > 0;

              return (
                <div key={scope.assignmentId || si} className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Scope header */}
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: accentColors.bg, borderLeft: `3px solid ${accentColors.border}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{ background: accentColors.border + "20" }}>
                        <span>{isComplete ? "✅" : isAtRisk ? "⚠️" : "🔨"}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{scope.scopeName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {scope.trade && <span className="text-[10px] text-slate-500">{scope.trade}</span>}
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize"
                            style={{ background: accentColors.border + "20", color: accentColors.border }}>
                            {scope.level}-level
                          </span>
                          {scope.assigneeName && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <User size={9} /> {scope.assigneeName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Contract</p>
                        <p className="text-xs font-bold text-slate-700">{fmtMoney(scope.contractValue, currency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Earned</p>
                        <p className="text-xs font-bold" style={{ color: accentColors.border }}>{fmtMoney(scope.earnedValue, currency)}</p>
                      </div>
                      <div className="relative inline-flex items-center justify-center">
                        <ProgressRing value={scope.pct} size={52} stroke={5} color={accentColors.bar} />
                        <span className="absolute text-[10px] font-black text-slate-700">{scope.pct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-5 py-3" style={{ background: "#fcfcfd" }}>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                      <span><span className="font-bold text-slate-700">{fmtNum(scope.doneQty)}</span> {scope.uom || "units"} completed of <span className="font-bold text-slate-700">{fmtNum(scope.totalQty)}</span></span>
                      <span className="font-bold">{fmtNum(scope.remainingQty)} remaining</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${scope.pct}%`, background: accentColors.bar }} />
                    </div>
                  </div>

                  {/* Unit / Phase breakdown */}
                  {(hasUnits || hasPhases) && (
                    <div className="px-5 pb-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-3 mb-2">
                        {hasUnits ? "Unit" : "Phase"} Breakdown
                      </p>
                      <div className="rounded-lg overflow-hidden border border-slate-100">
                        <div className="grid text-[9px] font-black uppercase tracking-wider text-white px-4 py-2"
                          style={{ background: "#334155", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr" }}>
                          <span>{hasUnits ? "Unit" : "Phase"}</span>
                          <span className="text-right">Target</span>
                          <span className="text-right">Done</span>
                          <span className="text-right">Remaining</span>
                          <span className="text-right">Progress</span>
                        </div>
                        {(hasUnits ? scope.unitBreakdown : scope.phaseBreakdown).map((item, ii) => (
                          <div key={ii} className={`grid items-center px-4 py-2 border-b border-slate-50 last:border-0 ${ii % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr" }}>
                            <span className="text-[11px] font-semibold text-slate-700">
                              {hasUnits ? (item.unitName || item.unitId) : (item.phaseName || item.phaseId)}
                            </span>
                            <span className="text-[11px] text-slate-500 text-right">{fmtNum(item.qty)}</span>
                            <span className="text-[11px] font-bold text-slate-800 text-right">{fmtNum(item.done)}</span>
                            <span className="text-[11px] text-slate-500 text-right">{fmtNum(item.remaining)}</span>
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 max-w-[80px]">
                                <div className="h-1.5 rounded-full" style={{ width: `${item.pct}%`, background: accentColors.bar }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 w-8 text-right">{item.pct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent logs */}
                  {!hasUnits && !hasPhases && scope.recentLogs?.length > 0 && (
                    <div className="px-5 pb-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-3 mb-2">Recent Activity</p>
                      <div className="space-y-1.5">
                        {scope.recentLogs.map((log, li) => (
                          <div key={li} className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-slate-50">
                            <span className="flex items-center gap-2 text-slate-500">
                              <Clock size={10} /> {fmtShortDate(log.date)}
                              {log.notes && <span className="text-slate-400">· {log.notes}</span>}
                            </span>
                            <span className="font-bold text-slate-700">+{fmtNum(log.qty)} {scope.uom}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall summary */}
          {progressData.length > 0 && (
            <div className="px-8 pb-8">
              <div className="rounded-xl p-6" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
                <p className="text-[#c4b19c] text-[9px] font-black uppercase tracking-widest mb-4">Project Financial Summary</p>
                <div className="grid grid-cols-3 gap-6 mb-4">
                  {[
                    { label: "Total Contract", value: fmtMoney(totalContract, currency), color: "#c4b19c" },
                    { label: "Total Earned",   value: fmtMoney(totalEarned, currency),   color: "#10b981" },
                    { label: "Outstanding",    value: fmtMoney(totalContract - totalEarned, currency), color: "#fbbf24" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">{s.label}</p>
                      <p className="font-black text-base" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-white/50 mb-1.5">
                    <span>Overall Completion</span>
                    <span className="font-bold text-white">{overallPct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-2.5 rounded-full" style={{ width: `${overallPct}%`, background: "linear-gradient(90deg, #c4b19c, #a89078)" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-8 py-4 flex items-center justify-between" style={{ background: "#f1f5f9", borderTop: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold text-slate-500">BuildTrack ERP · Project Progress Report — Confidential</p>
            <p className="text-[10px] text-slate-400">{display.id} · {display.projectId}</p>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center justify-center gap-2 text-xs text-blue-600 py-2">
            <Edit3 size={12} />
            <span className="font-semibold">Editing mode — highlighted fields are editable</span>
          </div>
        )}
      </div>
    </div>
  );
}
