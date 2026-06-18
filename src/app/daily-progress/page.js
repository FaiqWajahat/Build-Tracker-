"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, CheckCircle2, Clipboard, AlertOctagon,
  Search, Plus, Calendar, User, Check, X, ChevronRight,
  Filter, Clock, DollarSign, Activity, Eye, Pencil
} from "lucide-react";
import Link from "next/link";
import useProgressStore from "@/store/useProgressStore";
import useProjectStore from "@/store/useProjectStore";
import useAssignmentStore from "@/store/useAssignmentStore";

const statusStyles = {
  Approved:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Under Review":"bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Flagged:       "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export default function DailyProgressPage() {
  const logs = useProgressStore((s) => s.logs);
  const approveLog = useProgressStore((s) => s.approveLog);
  const deleteLog = useProgressStore((s) => s.deleteLog);
  const projects = useProjectStore((s) => s.projects);
  const assignments = useAssignmentStore((s) => s.assignments);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedLog, setExpandedLog] = useState(null);

  /* ── KPIs ── */
  const today = new Date().toISOString().split("T")[0];
  const kpis = useMemo(() => {
    const todayLogs = logs.filter((l) => l.date === today);
    const approved = logs.filter((l) => l.status === "Approved");
    const pending = logs.filter((l) => l.status === "Under Review");
    const flagged = logs.filter((l) => l.status === "Flagged");
    const totalEarned = logs.reduce((s, l) => s + (l.amountEarned || 0), 0);
    return { todayCount: todayLogs.length, approved: approved.length, pending: pending.length, flagged: flagged.length, totalEarned };
  }, [logs, today]);

  /* ── Filtered Logs ── */
  const filtered = useMemo(() => {
    return [...logs]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt?.localeCompare(a.createdAt || "") || 0)
      .filter((l) => {
        const q = search.toLowerCase();
        const matchSearch = !q || l.scopeName?.toLowerCase().includes(q) || l.assigneeName?.toLowerCase().includes(q) || l.unitId?.toLowerCase().includes(q) || l.notes?.toLowerCase().includes(q);
        const matchStatus = statusFilter === "All" || l.status === statusFilter;
        const matchProject = projectFilter === "All" || l.projectId === projectFilter;
        const matchFrom = !dateFrom || l.date >= dateFrom;
        const matchTo = !dateTo || l.date <= dateTo;
        return matchSearch && matchStatus && matchProject && matchFrom && matchTo;
      });
  }, [logs, search, statusFilter, projectFilter, dateFrom, dateTo]);

  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || id;
  const getAssignment = (id) => assignments.find((a) => a.id === id);

  /* ── Group by date for feed display ── */
  const grouped = useMemo(() => {
    return filtered.reduce((acc, l) => {
      if (!acc[l.date]) acc[l.date] = [];
      acc[l.date].push(l);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="p-6 min-h-full space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Logged Today", value: kpis.todayCount, icon: Clipboard, cls: "text-blue-600 bg-blue-500/10" },
          { label: "Approved", value: kpis.approved, icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-500/10" },
          { label: "Pending Review", value: kpis.pending, icon: Clock, cls: "text-amber-600 bg-amber-500/10" },
          { label: "Flagged", value: kpis.flagged, icon: AlertOctagon, cls: "text-rose-600 bg-rose-500/10" },
          { label: "Total Earned (All)", value: `SAR ${(kpis.totalEarned / 1000).toFixed(0)}K`, icon: DollarSign, cls: "text-purple-600 bg-purple-500/10" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground font-semibold">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.cls}`}><Icon size={15} /></div>
              </div>
              <p className="text-xl font-extrabold text-foreground">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search scope, unit, assignee, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring transition-colors"
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-2 bg-muted text-xs text-foreground border border-border rounded-xl outline-none cursor-pointer">
          <option value="All">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Under Review">Under Review</option>
          <option value="Flagged">Flagged</option>
        </select>

        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
          className="px-2.5 py-2 bg-muted text-xs text-foreground border border-border rounded-xl outline-none cursor-pointer">
          <option value="All">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-2 bg-muted text-xs text-foreground border border-border rounded-xl outline-none cursor-pointer" />
          <span className="text-muted-foreground text-xs">→</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-2 bg-muted text-xs text-foreground border border-border rounded-xl outline-none cursor-pointer" />
        </div>

        <p className="text-xs text-muted-foreground font-semibold ml-auto">
          {filtered.length} {filtered.length === 1 ? "log" : "logs"}
        </p>
      </div>

      {/* Log Feed (grouped by date) */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([date, dayLogs]) => {
          const dateObj = new Date(date);
          const isToday = date === today;
          const dayTotal = dayLogs.reduce((s, l) => s + (l.qtyCompleted || 0), 0);
          const dayEarned = dayLogs.reduce((s, l) => s + (l.amountEarned || 0), 0);

          return (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {isToday ? "Today" : dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div className="h-px flex-1 bg-border" />
                <p className="text-[11px] text-muted-foreground font-semibold">
                  {dayLogs.length} logs · SAR {dayEarned.toLocaleString()} earned
                </p>
              </div>

              <div className="space-y-2">
                {dayLogs.map((log) => {
                  const assignment = getAssignment(log.assignmentId);
                  const statusClass = statusStyles[log.status] || "bg-muted text-muted-foreground";
                  const isExpanded = expandedLog === log.id;

                  return (
                    <div key={log.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-xs transition-all">
                      {/* Log Row */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        {/* Trade Icon */}
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-base shrink-0">
                          {assignment?.tradeIcon || "📋"}
                        </div>

                        {/* Scope & Unit */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-foreground">{log.scopeName}</p>
                            {log.unitId && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-primary/10 text-primary rounded-md">
                                Unit {log.unitId}
                              </span>
                            )}
                            {log.phaseId && !log.unitId && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md">
                                {log.phaseId}
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-muted-foreground mt-0.5">
                            {getProjectName(log.projectId)} · {log.assigneeName}
                            {log.signedBy ? ` · Signed: ${log.signedBy}` : ""}
                          </p>
                        </div>

                        {/* Qty & Amount */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-foreground">+{log.qtyCompleted} {log.uom}</p>
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            SAR {log.amountEarned?.toLocaleString()}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusClass}`}>
                          {log.status}
                        </span>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="border-t border-border/60 px-4 py-3 bg-muted/10 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date</p>
                              <p className="font-semibold text-foreground mt-0.5">{log.date}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Rate</p>
                              <p className="font-semibold text-foreground mt-0.5">SAR {log.rate?.toLocaleString()} / {log.uom}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Log ID</p>
                              <p className="font-semibold text-foreground mt-0.5">{log.id}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Signed By</p>
                              <p className="font-semibold text-foreground mt-0.5">{log.signedBy || "—"}</p>
                            </div>
                          </div>
                          {log.notes && (
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Notes</p>
                              <p className="text-xs text-foreground mt-0.5 bg-muted/30 p-2.5 rounded-lg">{log.notes}</p>
                            </div>
                          )}
                          {(log.editHistory || []).length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Edit History ({log.editHistory.length})</p>
                              {log.editHistory.map((h, i) => (
                                <p key={i} className="text-[10.5px] text-muted-foreground mt-0.5">
                                  Edited {new Date(h.editedAt).toLocaleString()} — was {h.before?.qtyCompleted} {log.uom}
                                </p>
                              ))}
                            </div>
                          )}
                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            {log.status === "Under Review" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); approveLog(log.id); }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                <Check size={12} /> Approve
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteLog(log.id); setExpandedLog(null); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer border-none"
                            >
                              <X size={12} /> Delete
                            </button>
                            <Link
                              href={`/projects/${log.projectId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 transition-colors"
                            >
                              <Eye size={12} /> View Project
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm bg-card border border-dashed border-border rounded-xl">
            <Activity size={28} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">No progress logs match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
