"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban, CheckCircle2, AlertTriangle,
  Search, Plus, MapPin, Calendar, User,
  Filter, Building2, Layers, TrendingUp, Clock,
  ChevronRight, BarChart3, MoreVertical, Trash2
} from "lucide-react";
import useProjectStore from "@/store/useProjectStore";
import AddProjectModal from "@/components/projects/AddProjectModal";
import { PROJECT_TYPES } from "@/components/projects/ProjectTypeConfig";
import useUserStore from "@/store/useUserStore";
import useSettingsStore from "@/store/useSettingsStore";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { computeProjectStatus, PROJECT_STATUS_CONFIG } from "@/lib/projectStatus";

/* Triggers a project fetch the first time the page is visited */
function useProjectsFetch() {
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);
}

/* ─── Status config (use shared config from utility) ─────────────── */
const statusConfig = PROJECT_STATUS_CONFIG;


/* ─── Progress bar colour ─────────────────────────────────────────── */
function progressBarColor(p) {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 80) return "bg-status-ontrack";
  if (p >= 50) return "bg-primary";
  if (p >= 25) return "bg-status-delayed";
  return "bg-status-atrisk";
}

function radialProgressColor(p) {
  if (p >= 100) return "stroke-emerald-500 text-emerald-500";
  if (p >= 80) return "stroke-status-ontrack text-status-ontrack";
  if (p >= 50) return "stroke-primary text-primary";
  if (p >= 25) return "stroke-status-delayed text-status-delayed";
  return "stroke-status-atrisk text-status-atrisk";
}

/* ─── Unit & section count helpers ───────────────────────────────── */
function countUnits(project) {
  // First: use stored units array (populated when project is created / edited)
  if (project.units && project.units.length > 0) return project.units.length;
  // Fallback: derive from structure (for older/seed data)
  const s = project.structure;
  if (!s) return 0;
  if (s.phases) return s.phases.reduce((sum, p) => sum + (p.units?.length || 0), 0);
  if (s.units)  return s.units.length;
  if (s.floors) return s.floors.reduce((sum, f) => sum + (f.units?.length || 0), 0);
  if (s.zones)  return s.zones.reduce((sum, z) => sum + (z.shops?.length || 0), 0);
  if (s.blocks) return s.blocks.reduce((sum, b) => sum + (b.units?.length || 0), 0);
  if (s.bays)   return s.bays.length;
  if (s.segments) return s.segments.length;
  return 0;
}

function countSections(project) {
  // First: use stored phases array
  if (project.phases && project.phases.length > 0) {
    return { label: "phases", count: project.phases.length };
  }
  // Fallback: derive from structure
  const s = project.structure;
  if (!s) return null;
  if (s.phases)   return { label: "phases",   count: s.phases.length };
  if (s.floors)   return { label: "floors",   count: s.floors.length };
  if (s.zones)    return { label: "zones",    count: s.zones.length };
  if (s.blocks)   return { label: "blocks",   count: s.blocks.length };
  if (s.bays)     return { label: "bays",     count: s.bays.length };
  if (s.segments) return { label: "segments", count: s.segments.length };
  return null;
}

/* ─── Type icon helper ────────────────────────────────────────────── */
function typeIcon(typeVal) {
  return PROJECT_TYPES.find((t) => t.value === typeVal)?.icon || "🏗️";
}

/* ─── Metric Card ─────────────────────────────────────────────────── */
function MetricCard({ label, value, icon: Icon, colorClass, sub }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all duration-200 fade-up group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-muted-foreground">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass} transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
    </div>
  );
}

/* ─── Project Card ────────────────────────────────────────────────── */
function ProjectCard({ project }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const formatCurrency = useSettingsStore((s) => s.formatCurrency);
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";

  const progressPercent = project.progress !== null ? Math.round(project.progress) : 0;
  // Auto-compute status from actual progress vs expected timeline
  const resolvedStatus = computeProjectStatus(project);
  const sc = statusConfig[resolvedStatus] || statusConfig["On Track"];
  const units = countUnits(project);
  const sections = countSections(project);
  const icon = typeIcon(project.type);
  const barColor = progressBarColor(progressPercent);
  const strokeColorClass = radialProgressColor(progressPercent);

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <>
      <Link
        href={`/projects/${project.id}`}
        className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-border/60 transition-all duration-200 flex flex-col relative animate-in fade-in"
      >
        {/* Top accent bar — color by progress */}
        <div className="h-1 w-full bg-muted">
          <div
            className={`h-full ${barColor} transition-all duration-700 rounded-r-full`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-5 flex flex-col flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="text-xl leading-none mt-0.5 shrink-0">{icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{project.type}</span>
                  {project.subtype && (
                    <span className="text-[10px] text-muted-foreground opacity-60">· {project.subtype}</span>
                  )}
                </div>
                <h3 className="text-[14px] font-extrabold text-foreground truncate mt-0.5 group-hover:text-primary transition-colors duration-200">
                  {project.name}
                </h3>
                <p className="text-[11.5px] text-muted-foreground mt-0.5 font-medium">{project.client}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {resolvedStatus}
              </span>

              {/* Three dots actions menu */}
              {!isReadOnly && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(!menuOpen);
                    }}
                    className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpen(false);
                        }}
                      />
                      <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen(false);
                            setDeleteConfirmOpen(true);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors font-semibold"
                        >
                          <Trash2 size={13} />
                          Delete Project
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Graphics & Progress Indicators */}
          <div className="flex items-center gap-4 mb-4 bg-muted/20 border border-border/40 p-3 rounded-xl">
            {/* Radial Circular Progress SVG */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-[54px] h-[54px] transform -rotate-90">
                <circle
                  cx="27"
                  cy="27"
                  r={radius}
                  className="stroke-muted-foreground/10"
                  strokeWidth="4.5"
                  fill="transparent"
                />
                <circle
                  cx="27"
                  cy="27"
                  r={radius}
                  className={`${strokeColorClass.split(" ")[0]} transition-all duration-700`}
                  strokeWidth="4.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10.5px] font-black text-foreground">
                {progressPercent}%
              </span>
            </div>

            {/* Stats Breakdown */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Scope Completeness Ratio */}
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                <span>Scopes Done</span>
                <span className="text-foreground font-black">
                  {project.completedAssignmentsCount || 0} / {project.assignmentsCount || 0}
                </span>
              </div>
              {/* Scope completeness mini progress bar */}
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${project.assignmentsCount > 0 ? (project.completedAssignmentsCount / project.assignmentsCount) * 100 : 0}%`
                  }}
                />
              </div>

              {/* Financial budget earned progress bar */}
              {project.totalContractVal > 0 && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex justify-between text-[9.5px] font-bold text-muted-foreground">
                    <span>Earned / Budget</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {formatCurrency(project.totalEarned)}
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (project.totalEarned / project.totalContractVal) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Structure chips */}
          {(units > 0 || sections) && (
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              {sections && sections.count > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-secondary border border-border rounded-md text-muted-foreground">
                  <Layers size={9} />
                  {sections.count} {sections.label}
                </span>
              )}
              {units > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-primary/8 border border-primary/15 rounded-md text-primary">
                  <Building2 size={9} />
                  {units} units
                </span>
              )}
              {project.assignmentsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/8 border border-emerald-500/15 rounded-md text-emerald-600 dark:text-emerald-400">
                  <BarChart3 size={9} />
                  {project.assignmentsCount} scopes
                </span>
              )}
            </div>
          )}

          {/* Footer meta */}
          <div className="pt-3 border-t border-border mt-auto grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            {project.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="opacity-50 shrink-0" />
                <span className="truncate">{project.location}</span>
              </div>
            )}
            {project.endDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={11} className="opacity-50 shrink-0" />
                <span className="truncate">Due {project.endDate}</span>
              </div>
            )}
            {project.pm && (
              <div className="flex items-center gap-1.5 col-span-2 mt-1 pt-2 border-t border-border/40">
                <User size={11} className="opacity-50 shrink-0" />
                <span>PM: <strong className="text-foreground font-semibold">{project.pm}</strong></span>
              </div>
            )}
          </div>

          {/* View indicator */}
          <div className="flex items-center justify-end mt-2 pt-1.5">
            <span className="text-[10.5px] font-semibold text-primary/60 group-hover:text-primary flex items-center gap-0.5 transition-colors duration-200">
              View project <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </span>
          </div>
        </div>
      </Link>

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await deleteProject(project.id);
          } catch (err) {
            // error is handled in store
          }
        }}
        title="Delete Project"
        description="Are you sure you want to delete this project? This will permanently remove all assignments, units, phases, and progress logs."
        itemName={project.name}
      />
    </>
  );
}

/* ─── Projects Page ───────────────────────────────────────────────── */
export default function ProjectsPage() {
  useProjectsFetch();  // Fetch from DB on mount
  const projects = useProjectStore((s) => s.projects);
  const projectsLoading = useProjectStore((s) => s.loading);
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All");
  const [modalOpen, setModalOpen]       = useState(false);

  const filteredProjects = projects.filter((p) => {
    const computedStatus = computeProjectStatus(p);
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      (p.pm || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || computedStatus === statusFilter;
    const matchesType   = typeFilter   === "All" || p.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const onTrack = projects.filter((p) => {
    const s = computeProjectStatus(p);
    return s === "On Track" || s === "Ahead";
  }).length;
  const atRisk = projects.filter((p) => {
    const s = computeProjectStatus(p);
    return s === "At Risk" || s === "Delayed";
  }).length;
  const avgProg  = projects.length
    ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length)
    : 0;

  return (
    <div className="p-6 min-h-full space-y-6">

      {/* ── Metrics Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Projects"
          value={projects.length}
          icon={FolderKanban}
          colorClass="text-blue-600 bg-blue-500/10"
          sub={`${filteredProjects.length} shown`}
        />
        <MetricCard
          label="On Track / Ahead"
          value={onTrack}
          icon={CheckCircle2}
          colorClass="text-status-ontrack bg-status-ontrack/10"
          sub={`${projects.length > 0 ? Math.round((onTrack / projects.length) * 100) : 0}% of portfolio`}
        />
        <MetricCard
          label="At Risk / Delayed"
          value={atRisk}
          icon={AlertTriangle}
          colorClass="text-status-atrisk bg-status-atrisk/10"
          sub="Needs attention"
        />
        <MetricCard
          label="Avg. Progress"
          value={`${avgProg}%`}
          icon={TrendingUp}
          colorClass="text-primary bg-primary/10"
          sub="Across all projects"
        />
      </div>

      {/* ── Filter & Action Bar ───────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search project, client or PM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>

        {/* Filters + Add */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted-foreground" />
            <span className="text-[11.5px] text-muted-foreground font-semibold">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs outline-none cursor-pointer focus:border-ring"
          >
            <option value="All">All Statuses</option>
            <option value="On Track">On Track</option>
            <option value="Ahead">Ahead</option>
            <option value="Delayed">Delayed</option>
            <option value="At Risk">At Risk</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs outline-none cursor-pointer focus:border-ring"
          >
            <option value="All">All Types</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {!isReadOnly && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm cursor-pointer ml-1"
            >
              <Plus size={13} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* ── Grid of Projects ─────────────────────────────────────────── */}
      <div>
        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11.5px] font-semibold text-muted-foreground">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
            {(search || statusFilter !== "All" || typeFilter !== "All") && " found"}
          </p>
          {(search || statusFilter !== "All" || typeFilter !== "All") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); setTypeFilter("All"); }}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p, i) => (
            <div key={p.id} className={`fade-up du-${Math.min(i + 1, 9)}`}>
              <ProjectCard project={p} />
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-20 text-center bg-card border border-dashed border-border rounded-xl">
              <span className="text-4xl block mb-3">🏗️</span>
              <p className="text-sm font-bold text-foreground mb-1">No projects found</p>
              <p className="text-xs text-muted-foreground mb-4">
                {search || statusFilter !== "All" || typeFilter !== "All"
                  ? "Try adjusting your filters"
                  : "Click \"New Project\" to create your first project"}
              </p>
              {!isReadOnly && !search && statusFilter === "All" && typeFilter === "All" && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <Plus size={13} /> Create Project
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      <AddProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
