"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban, MapPin, Calendar, User, ChevronLeft,
  Building2, Layers, AlertCircle, BarChart3, TrendingUp,
  CircleDollarSign, Home, ClipboardList, LayoutGrid,
  Activity, PlusCircle
} from "lucide-react";

import useProjectStore, { PHASE_COLORS } from "@/store/useProjectStore";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";

import OverviewTab from "@/components/project-detail/OverviewTab";
import AssignmentsTab from "@/components/project-detail/AssignmentsTab";
import ScopeProgressTab from "@/components/project-detail/ScopeProgressTab";
import MatrixTab from "@/components/project-detail/MatrixTab";
import FinancialsTab from "@/components/project-detail/FinancialsTab";
import UnitsTab from "@/components/project-detail/UnitsTab";
import DailyLogModal from "@/components/project-detail/DailyLogModal";

const pct = (done, total) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);
const statusColor = (p) => {
  if (p >= 100) return { bar: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" };
  if (p >= 75)  return { bar: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",           dot: "bg-blue-500" };
  if (p >= 40)  return { bar: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",       dot: "bg-amber-500" };
  return          { bar: "bg-rose-500",          badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",          dot: "bg-rose-500" };
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);

  // Filter in useMemo so the selector stays stable (no new array ref every render)
  const assignments = useMemo(() => allAssignments.filter((a) => a.projectId === id), [allAssignments, id]);
  const logs = useMemo(() => allLogs.filter((l) => l.projectId === id), [allLogs, id]);

  const [activeTab, setActiveTab] = useState("overview");
  const [showLogModal, setShowLogModal] = useState(false);

  /* ── Compute overall project progress ── */
  const { overallProgress, totalContractVal, totalEarned, unitCount } = useMemo(() => {
    let totalQty = 0, totalDone = 0, totalContract = 0, totalEarned = 0;
    assignments.forEach((a) => {
      const tQty = a.level === "unit"
        ? (a.unitBreakdown || []).reduce((s, u) => s + (u.qty || 0), 0)
        : a.level === "phase"
        ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.qty || 0), 0)
        : a.totalQty || 0;
      const tDone = a.level === "unit"
        ? (a.unitBreakdown || []).reduce((s, u) => s + (u.done || 0), 0)
        : a.level === "phase"
        ? (a.phaseBreakdown || []).reduce((s, p) => s + (p.done || 0), 0)
        : logs.filter((l) => l.assignmentId === a.id).reduce((s, l) => s + (l.qtyCompleted || 0), 0);
      totalQty += tQty;
      totalDone += tDone;
      totalContract += tQty * (a.clientRate || 0);
      totalEarned += tDone * (a.clientRate || 0);
    });
    return {
      overallProgress: pct(totalDone, totalQty),
      totalContractVal: totalContract,
      totalEarned,
      unitCount: (project?.units || []).length,
    };
  }, [assignments, logs, project]);

  const sc = statusColor(overallProgress);

  if (!project) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-card border border-border rounded-xl m-6 text-center">
        <AlertCircle size={40} className="text-rose-500 mb-4" />
        <h2 className="text-base font-bold text-foreground mb-1">Project Not Found</h2>
        <p className="text-xs text-muted-foreground mb-4">The project with ID {id} does not exist.</p>
        <Link href="/projects" className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all">
          <ChevronLeft size={14} /> Back to Projects
        </Link>
      </div>
    );
  }

  const TABS = [
    { id: "overview",    label: "Overview",         icon: TrendingUp },
    { id: "units",       label: "Units & Phases",   icon: Home },
    { id: "assignments", label: "Scope Assignments",icon: Layers },
    { id: "progress",    label: "Scope Progress",   icon: BarChart3 },
    { id: "matrix",      label: "Unit Matrix",      icon: LayoutGrid },
    { id: "financials",  label: "Financials",       icon: CircleDollarSign },
  ];

  return (
    <div className="p-6 min-h-full space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={14} /> Back to Projects
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-semibold">ID: <strong className="text-foreground">{project.id}</strong></span>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
          >
            <PlusCircle size={13} /> Log Progress
          </button>
        </div>
      </div>

      {/* Project Header Card */}
      <div className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-border/60">
          <div className="flex items-start gap-4">
            <span className="text-3xl p-3 bg-muted rounded-2xl shrink-0">🏗️</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{project.type}</span>
                {project.subtype && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">{project.subtype}</span>
                  </>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.badge} ml-1`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {overallProgress >= 100 ? "Completed" : project.status}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-foreground tracking-tight mt-1">{project.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Client: <strong className="text-foreground">{project.client}</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:text-right shrink-0">
            {[
              { label: "Location", value: project.location || "N/A", icon: MapPin },
              { label: "PM Assigned", value: project.pm || "N/A", icon: User },
              { label: "Due Date", value: project.endDate ? `Due ${project.endDate}` : "N/A", icon: Calendar, span: true },
            ].map((info) => {
              const Icon = info.icon;
              return (
                <div key={info.label} className={`space-y-0.5 ${info.span ? "col-span-2 sm:col-span-1" : ""}`}>
                  <p className="text-[11px] text-muted-foreground font-semibold flex md:justify-end items-center gap-1">
                    <Icon size={10} className="opacity-60" /> {info.label}
                  </p>
                  <p className="text-xs font-bold text-foreground">{info.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress & Quick Stats */}
        <div className="pt-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex-1 max-w-lg">
            <div className="flex justify-between text-xs mb-1.5 font-semibold">
              <span className="text-muted-foreground">Overall Scope Completion</span>
              <span className={`font-black ${sc.badge.split(" ")[1]}`}>{overallProgress}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${sc.bar}`} style={{ width: `${overallProgress}%` }} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10.5px] text-muted-foreground font-semibold">
              <span>Contract: SAR {(totalContractVal / 1000).toFixed(0)}K</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400">Earned: SAR {(totalEarned / 1000).toFixed(0)}K</span>
              <span>·</span>
              <span>{logs.length} logs</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-secondary border border-border rounded-lg text-muted-foreground">
              <Layers size={12} /> {(project.phases || []).length} Phases
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-primary/8 border border-primary/15 rounded-lg text-primary">
              <Building2 size={12} /> {unitCount} Units
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Activity size={12} /> {assignments.length} Scopes
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-1 overflow-x-auto pb-px">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all outline-none whitespace-nowrap cursor-pointer
                ${isActive
                  ? "border-primary text-primary font-black bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="fade-up">
        {activeTab === "overview"    && <OverviewTab projectId={id} />}
        {activeTab === "units"       && <UnitsTab projectId={id} />}
        {activeTab === "assignments" && <AssignmentsTab projectId={id} />}
        {activeTab === "progress"    && <ScopeProgressTab projectId={id} />}
        {activeTab === "matrix"      && <MatrixTab projectId={id} />}
        {activeTab === "financials"  && <FinancialsTab projectId={id} />}
      </div>

      {/* Daily Log Modal */}
      {showLogModal && (
        <DailyLogModal
          projectId={id}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </div>
  );
}
