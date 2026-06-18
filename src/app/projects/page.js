"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderKanban, CheckCircle2, AlertTriangle,
  Search, Plus, MapPin, Calendar, User,
  Filter, Building2, Layers
} from "lucide-react";
import useProjectStore from "@/store/useProjectStore";
import AddProjectModal from "@/components/projects/AddProjectModal";
import { PROJECT_TYPES } from "@/components/projects/ProjectTypeConfig";

/* ─── Status config ───────────────────────────────────────────────── */
const statusConfig = {
  "On Track": { bgClass: "bg-status-ontrack/10 text-status-ontrack", dotClass: "bg-status-ontrack" },
  "Ahead":    { bgClass: "bg-status-ahead/10 text-status-ahead",           dotClass: "bg-status-ahead" },
  "Delayed":  { bgClass: "bg-status-delayed/10 text-status-delayed",         dotClass: "bg-status-delayed" },
  "At Risk":  { bgClass: "bg-status-atrisk/10 text-status-atrisk",           dotClass: "bg-status-atrisk" },
};

/* ─── Unit count helper ───────────────────────────────────────────── */
function countUnits(project) {
  const s = project.structure;
  if (!s) return 0;
  // Villa Complex — phases or flat
  if (s.phases) return s.phases.reduce((sum, p) => sum + (p.units?.length || 0), 0);
  if (s.units) return s.units.length;
  // Apartment / Tower — floors
  if (s.floors) return s.floors.reduce((sum, f) => sum + (f.units?.length || 0), 0);
  // Mall
  if (s.zones) return s.zones.reduce((sum, z) => sum + (z.shops?.length || 0), 0);
  // Compound
  if (s.blocks) return s.blocks.reduce((sum, b) => sum + (b.units?.length || 0), 0);
  // Industrial
  if (s.bays) return s.bays.length;
  // Infra
  if (s.segments) return s.segments.length;
  return 0;
}

function countSections(project) {
  const s = project.structure;
  if (!s) return null;
  if (s.phases) return { label: "phases", count: s.phases.length };
  if (s.floors) return { label: "floors", count: s.floors.length };
  if (s.zones)  return { label: "zones",  count: s.zones.length };
  if (s.blocks) return { label: "blocks", count: s.blocks.length };
  if (s.bays)   return { label: "bays",   count: s.bays.length };
  if (s.segments) return { label: "segments", count: s.segments.length };
  return null;
}

/* ─── Type icon helper ────────────────────────────────────────────── */
function typeIcon(typeVal) {
  return PROJECT_TYPES.find((t) => t.value === typeVal)?.icon || "🏗️";
}

/* ─── Projects Page ───────────────────────────────────────────────── */
export default function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All");
  const [modalOpen, setModalOpen]       = useState(false);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      (p.pm || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesType   = typeFilter   === "All" || p.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const onTrack  = projects.filter((p) => p.status === "On Track" || p.status === "Ahead").length;
  const atRisk   = projects.filter((p) => p.status === "At Risk"  || p.status === "Delayed").length;

  return (
    <div className="p-6 min-h-full">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Projects",
            value: projects.length,
            icon: FolderKanban,
            colorClass: "text-blue-600 bg-blue-500/10",
          },
          {
            label: "On Track / Ahead",
            value: onTrack,
            icon: CheckCircle2,
            colorClass: "text-status-ontrack bg-status-ontrack/10",
          },
          {
            label: "At Risk / Delayed",
            value: atRisk,
            icon: AlertTriangle,
            colorClass: "text-status-atrisk bg-status-atrisk/10",
          },
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

      {/* Filter and Action Header */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search project name, client, PM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>

        {/* Dropdowns + Add */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted-foreground" />
            <span className="text-[11.5px] text-muted-foreground font-semibold">Filters:</span>
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

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer ml-2"
          >
            <Plus size={14} /> Add Project
          </button>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p) => {
          const sc = statusConfig[p.status] || statusConfig["On Track"];
          const units = countUnits(p);
          const sections = countSections(p);
          const icon = typeIcon(p.type);

          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-border/80 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-xl leading-none mt-0.5 shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{p.type}</span>
                      {p.subtype && (
                        <span className="text-[10px] text-muted-foreground ml-1.5 opacity-70">· {p.subtype}</span>
                      )}
                      <h3 className="text-[15px] font-bold text-foreground truncate mt-0.5">{p.name}</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{p.client}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${sc.bgClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`} />
                    {p.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4 mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-foreground">Completion</span>
                    <span className="font-bold text-primary">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                {/* Structure summary chips */}
                {(units > 0 || sections) && (
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {sections && sections.count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 bg-secondary border border-border rounded-md text-muted-foreground">
                        <Layers size={10} />
                        {sections.count} {sections.label}
                      </span>
                    )}
                    {units > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 bg-primary/8 border border-primary/15 rounded-md text-primary">
                        <Building2 size={10} />
                        {units} units
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-border mt-3 grid grid-cols-2 gap-2 text-[11.5px] text-muted-foreground">
                {p.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="opacity-60" />
                    <span className="truncate">{p.location}</span>
                  </div>
                )}
                {p.endDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="opacity-60" />
                    <span className="truncate">Due {p.endDate}</span>
                  </div>
                )}
                {p.pm && (
                  <div className="flex items-center gap-1.5 col-span-2 mt-1 pt-1 border-t border-border/40">
                    <User size={12} className="opacity-60" />
                    <span>PM: <strong className="text-foreground">{p.pm}</strong></span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center bg-card border border-border rounded-xl">
            <span className="text-4xl block mb-3">🏗️</span>
            <p className="text-sm font-semibold text-foreground mb-1">No projects found</p>
            <p className="text-xs text-muted-foreground">
              {search || statusFilter !== "All" || typeFilter !== "All"
                ? "Try adjusting your filters"
                : "Click \"Add Project\" to create your first project"}
            </p>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <AddProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
