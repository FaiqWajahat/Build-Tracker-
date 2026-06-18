"use client";

import { useMemo } from "react";
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, Activity, BarChart2 } from "lucide-react";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

const statusColor = (p) => {
  if (p >= 100) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  if (p >= 75)  return { bar: "bg-blue-500",    text: "text-blue-600 dark:text-blue-400",       badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
  if (p >= 40)  return { bar: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400",     badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  if (p > 0)    return { bar: "bg-rose-500",    text: "text-rose-600 dark:text-rose-400",       badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
  return          { bar: "bg-muted",            text: "text-muted-foreground",                  badge: "bg-muted text-muted-foreground" };
};

export default function OverviewTab({ projectId }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);

  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === projectId), [allAssignments, projectId]);
  const logs = useMemo(() => allLogs.filter((l) => l.projectId === projectId), [allLogs, projectId]);

  const phases = project?.phases || [];
  const units = project?.units || [];

  const getPhaseColor = (colorId) => PHASE_COLORS.find((c) => c.id === colorId) || PHASE_COLORS[0];

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
    return { ...a, totalQty, doneQty, progress: pct(doneQty, totalQty) };
  }), [assignments, logs]);

  const alerts = useMemo(() => {
    const out = [];
    enriched.forEach((a) => {
      if (a.progress === 0) out.push({ level: "critical", msg: `${a.scopeName} — Not started (0%)`, icon: "⚫" });
      else if (a.progress < 40) out.push({ level: "warning", msg: `${a.scopeName} — Behind schedule (${a.progress}%)`, icon: "🔴" });
    });
    return out.slice(0, 5);
  }, [enriched]);

  const recentLogs = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [logs]);

  return (
    <div className="space-y-5 fade-up">
      {/* Scope Progress List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart2 size={15} className="text-primary" /> Scope Progress Summary
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{enriched.length} scopes · {enriched.filter((a) => a.progress >= 100).length} complete</p>
        </div>
        <div className="divide-y divide-border/40">
          {enriched.map((a) => {
            const sc = statusColor(a.progress);
            return (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition-colors">
                <span className="text-base shrink-0">{a.tradeIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-foreground truncate">{a.scopeName}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{a.doneQty.toLocaleString()}/{a.totalQty.toLocaleString()} {a.uom}</span>
                      <span className={`text-xs font-extrabold ${sc.text}`}>{a.progress}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${sc.bar}`} style={{ width: `${a.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-muted-foreground">{a.assigneeName} · <span className="capitalize">{a.level} level</span></p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      SAR {(a.doneQty * a.clientRate).toLocaleString()} earned
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {enriched.length === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No scope assignments yet. Go to Scope Assignments tab to add scopes.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" /> Attention Required
            </h3>
          </div>
          <div className="divide-y divide-border/40">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="text-base">{alert.icon}</span>
                <p className="text-xs text-foreground">{alert.msg}</p>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="flex items-center gap-3 px-5 py-4">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">All scopes progressing normally</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Recent Progress Logs
            </h3>
          </div>
          <div className="divide-y divide-border/40">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-black text-muted-foreground shrink-0">
                  {log.date.slice(5)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{log.scopeName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {log.unitId ? `Unit ${log.unitId} · ` : ""}{log.assigneeName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">+{log.qtyCompleted} {log.uom}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">SAR {log.amountEarned?.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">No progress logs yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
