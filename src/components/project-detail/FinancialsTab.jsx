"use client";

import { useMemo } from "react";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore from "@/store/useProjectStore";

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const statusColor = (p) => {
  if (p >= 100) return "text-emerald-600 dark:text-emerald-400";
  if (p >= 75)  return "text-blue-600 dark:text-blue-400";
  if (p >= 40)  return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

export default function FinancialsTab({ projectId }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);

  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === projectId), [allAssignments, projectId]);
  const logs = useMemo(() => allLogs.filter((l) => l.projectId === projectId), [allLogs, projectId]);

  const enriched = useMemo(() => assignments.map((a) => {
    const totalQty = a.level === "unit"
      ? (a.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)
      : a.level === "phase"
      ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)
      : a.totalQty || 0;
    const doneQty = a.level === "unit"
      ? (a.unitBreakdown || []).reduce((s, u) => s + (u.done || 0), 0)
      : a.level === "phase"
      ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.done || 0), 0)
      : logs.filter((l) => l.assignmentId === a.id).reduce((s, l) => s + (l.qtyCompleted || 0), 0);

    const contractValue = totalQty * (a.clientRate || 0);
    const earnedValue = doneQty * (a.clientRate || 0);
    const subCost = a.subRate ? totalQty * a.subRate : 0;
    const earnedSubCost = a.subRate ? doneQty * a.subRate : 0;
    const margin = contractValue - subCost;
    const progress = pct(doneQty, totalQty);

    return { ...a, totalQty, doneQty, contractValue, earnedValue, subCost, earnedSubCost, margin, progress };
  }), [assignments, logs]);

  const summary = useMemo(() => {
    const totalContract = enriched.reduce((s, a) => s + a.contractValue, 0);
    const totalEarned = enriched.reduce((s, a) => s + a.earnedValue, 0);
    const totalSubCost = enriched.reduce((s, a) => s + a.subCost, 0);
    const earnedSubCost = enriched.reduce((s, a) => s + a.earnedSubCost, 0);
    const grossMargin = totalContract - totalSubCost;
    const marginPct = totalContract > 0 ? Math.round((grossMargin / totalContract) * 100) : 0;
    const retention = totalEarned * 0.05;
    const net = totalEarned - retention;
    const remaining = totalContract - totalEarned;

    return { totalContract, totalEarned, totalSubCost, earnedSubCost, grossMargin, marginPct, retention, net, remaining };
  }, [enriched]);

  // Contractor breakdown
  const byContractor = useMemo(() => {
    const map = {};
    enriched.forEach((a) => {
      const key = a.assigneeName || "Unknown";
      if (!map[key]) map[key] = { name: key, type: a.assigneeType, contractValue: 0, earnedValue: 0, subCost: 0, scopes: 0 };
      map[key].contractValue += a.contractValue;
      map[key].earnedValue += a.earnedValue;
      map[key].subCost += a.earnedSubCost;
      map[key].scopes++;
    });
    return Object.values(map);
  }, [enriched]);

  return (
    <div className="space-y-5 fade-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Contract Value", value: `SAR ${(summary.totalContract / 1000).toFixed(0)}K`, sub: `${enriched.length} scopes`, cls: "text-foreground", iconCls: "text-blue-600 bg-blue-500/10" },
          { label: "Earned Value", value: `SAR ${(summary.totalEarned / 1000).toFixed(0)}K`, sub: `${pct(summary.totalEarned, summary.totalContract)}% billed`, cls: "text-emerald-600 dark:text-emerald-400", iconCls: "text-emerald-600 bg-emerald-500/10" },
          { label: "Retention (5%)", value: `SAR ${(summary.retention / 1000).toFixed(1)}K`, sub: "held back", cls: "text-amber-600 dark:text-amber-400", iconCls: "text-amber-600 bg-amber-500/10" },
          { label: "Net Payable", value: `SAR ${(summary.net / 1000).toFixed(0)}K`, sub: "after retention", cls: "text-foreground", iconCls: "text-purple-600 bg-purple-500/10" },
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10.5px] text-muted-foreground font-semibold">{k.label}</p>
            <p className={`text-lg font-extrabold mt-1 ${k.cls}`}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Margin Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Total Contract</span>
              <span className="font-bold text-foreground">SAR {summary.totalContract.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Total Sub Cost</span>
              <span className="font-bold text-foreground">SAR {summary.totalSubCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-border pt-2">
              <span className="text-muted-foreground font-bold">Gross Margin</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                SAR {summary.grossMargin.toLocaleString()} ({summary.marginPct}%)
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Earned Value</span>
              <span className="font-bold text-foreground">SAR {summary.totalEarned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Remaining</span>
              <span className="font-bold text-foreground">SAR {summary.remaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-border pt-2">
              <span className="text-muted-foreground font-bold">Completion %</span>
              <span className="font-extrabold text-primary">{pct(summary.totalEarned, summary.totalContract)}%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Gross Earned</span>
              <span className="font-bold text-foreground">SAR {summary.totalEarned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Less Retention (5%)</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">−SAR {summary.retention.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-border pt-2">
              <span className="text-muted-foreground font-bold">Net Payable</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">SAR {summary.net.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scope Breakdown Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="text-sm font-bold text-foreground">Scope-by-Scope Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-5 py-2.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Scope</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Qty</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Done Qty</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Rate</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Contract SAR</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Earned SAR</th>
                <th className="text-right px-5 py-2.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {enriched.map((a) => {
                const sc = statusColor(a.progress);
                return (
                  <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span>{a.tradeIcon}</span>
                        <div>
                          <p className="font-semibold text-foreground">{a.scopeName}</p>
                          <p className="text-[10px] text-muted-foreground">{a.assigneeName} · {a.level}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-muted-foreground">{a.totalQty.toLocaleString()} {a.uom}</td>
                    <td className="px-3 py-3 text-right font-semibold text-foreground">{a.doneQty.toLocaleString()} {a.uom}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">SAR {a.clientRate?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-semibold text-foreground">SAR {a.contractValue.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">SAR {a.earnedValue.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-extrabold ${sc}`}>{a.progress}%</span>
                    </td>
                  </tr>
                );
              })}
              {/* Total row */}
              <tr className="bg-muted/30 border-t border-border">
                <td className="px-5 py-3 font-black text-foreground">TOTAL</td>
                <td className="px-3 py-3 text-right" />
                <td className="px-3 py-3 text-right" />
                <td className="px-3 py-3 text-right" />
                <td className="px-3 py-3 text-right font-black text-foreground">SAR {summary.totalContract.toLocaleString()}</td>
                <td className="px-3 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">SAR {summary.totalEarned.toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-black text-primary">{pct(summary.totalEarned, summary.totalContract)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* By Contractor Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="text-sm font-bold text-foreground">Contractor / Team Ledger</h3>
        </div>
        <div className="divide-y divide-border/40">
          {byContractor.map((c) => {
            const progress = pct(c.earnedValue, c.contractValue);
            const sc = statusColor(progress);
            return (
              <div key={c.name} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 gap-3 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-extrabold text-foreground text-sm shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{c.type} · {c.scopes} scope{c.scopes !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Contract</p>
                    <p className="text-xs font-bold text-foreground">SAR {c.contractValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Earned</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">SAR {c.earnedValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Net (5% ret.)</p>
                    <p className="text-xs font-bold text-foreground">SAR {Math.round(c.earnedValue * 0.95).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-extrabold ${sc}`}>{progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
