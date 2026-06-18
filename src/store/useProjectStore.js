"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ─── Colour palette for phases ─────────────────────────────────────── */
export const PHASE_COLORS = [
  { id: "blue",   bg: "bg-blue-500/15",   text: "text-blue-600 dark:text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/25",   hex: "#3b82f6" },
  { id: "purple", bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500", border: "border-purple-500/25", hex: "#8b5cf6" },
  { id: "amber",  bg: "bg-amber-500/15",  text: "text-amber-600 dark:text-amber-400",  dot: "bg-amber-500",  border: "border-amber-500/25",  hex: "#f59e0b" },
  { id: "emerald",bg: "bg-emerald-500/15",text: "text-emerald-600 dark:text-emerald-400",dot: "bg-emerald-500",border: "border-emerald-500/25",hex: "#10b981"},
  { id: "rose",   bg: "bg-rose-500/15",   text: "text-rose-600 dark:text-rose-400",   dot: "bg-rose-500",   border: "border-rose-500/25",   hex: "#f43f5e" },
  { id: "cyan",   bg: "bg-cyan-500/15",   text: "text-cyan-600 dark:text-cyan-400",   dot: "bg-cyan-500",   border: "border-cyan-500/25",   hex: "#06b6d4" },
];

/* ─── Seed projects ─────────────────────────────────────────────────── */
const SEED_PROJECTS = [
  {
    id: "PRJ-001",
    name: "ABO YARA Villa Project",
    client: "Yamas Arabian Contracting",
    location: "Al-Khobar",
    pm: "Ahmed M.",
    startDate: "2025-01-01",
    endDate: "2026-02",
    type: "Residential",
    subtype: "Villa Complex",
    status: "On Track",
    progress: 68,
    createdAt: "2025-01-01",
    // Project structure
    phases: [
      { id: "PH-A", name: "Phase A", colorId: "blue",   unitIds: ["801","804","811","814","817"] },
      { id: "PH-B", name: "Phase B", colorId: "purple", unitIds: ["902","903","911","914","917","925"] },
      { id: "PH-C", name: "Phase C", colorId: "amber",  unitIds: ["101","102","103","104","105"] },
    ],
    units: [
      { id: "801", name: "Villa 801", phaseId: "PH-A", type: "GF, FF, RF" },
      { id: "804", name: "Villa 804", phaseId: "PH-A", type: "GF, FF, RF" },
      { id: "811", name: "Villa 811", phaseId: "PH-A", type: "GF, FF, RF" },
      { id: "814", name: "Villa 814", phaseId: "PH-A", type: "GF, FF" },
      { id: "817", name: "Villa 817", phaseId: "PH-A", type: "GF, FF" },
      { id: "902", name: "Villa 902", phaseId: "PH-B", type: "B1, GF, FF, RF" },
      { id: "903", name: "Villa 903", phaseId: "PH-B", type: "B1, GF, FF, RF" },
      { id: "911", name: "Villa 911", phaseId: "PH-B", type: "B1, GF, FF, RF" },
      { id: "914", name: "Villa 914", phaseId: "PH-B", type: "GF, FF, RF" },
      { id: "917", name: "Villa 917", phaseId: "PH-B", type: "GF, FF, RF" },
      { id: "925", name: "Villa 925", phaseId: "PH-B", type: "B2, B1, GF, FF, RF" },
      { id: "101", name: "Villa 101", phaseId: "PH-C", type: "GF, FF, RF" },
      { id: "102", name: "Villa 102", phaseId: "PH-C", type: "GF, FF, RF" },
      { id: "103", name: "Villa 103", phaseId: "PH-C", type: "B1, GF, FF, RF" },
      { id: "104", name: "Villa 104", phaseId: "PH-C", type: "GF, FF, RF" },
      { id: "105", name: "Villa 105", phaseId: "PH-C", type: "GF, FF, RF" },
    ],
    scopes: [],
  },
  {
    id: "PRJ-002",
    name: "Tower Block A",
    client: "Al-Rashid Co.",
    location: "Al-Khobar",
    pm: "Sara K.",
    startDate: "2025-02-01",
    endDate: "2026-04",
    type: "Commercial",
    subtype: "Office Tower",
    status: "Delayed",
    progress: 45,
    createdAt: "2025-02-01",
    phases: [
      { id: "PH-A", name: "Ground & Podium", colorId: "blue",   unitIds: ["FL-B","FL-1","FL-2","FL-3"] },
      { id: "PH-B", name: "Typical Floors",  colorId: "purple", unitIds: ["FL-4","FL-5","FL-6","FL-7","FL-8","FL-9","FL-10"] },
    ],
    units: [
      { id: "FL-B",  name: "Basement",    phaseId: "PH-A", type: "" },
      { id: "FL-1",  name: "Ground Flr",  phaseId: "PH-A", type: "" },
      { id: "FL-2",  name: "1st Floor",   phaseId: "PH-A", type: "" },
      { id: "FL-3",  name: "2nd Floor",   phaseId: "PH-A", type: "" },
      { id: "FL-4",  name: "3rd Floor",   phaseId: "PH-B", type: "" },
      { id: "FL-5",  name: "4th Floor",   phaseId: "PH-B", type: "" },
      { id: "FL-6",  name: "5th Floor",   phaseId: "PH-B", type: "" },
      { id: "FL-7",  name: "6th Floor",   phaseId: "PH-B", type: "" },
      { id: "FL-8",  name: "7th Floor",   phaseId: "PH-B", type: "" },
      { id: "FL-9",  name: "8th Floor",   phaseId: "PH-B", type: "" },
      { id: "FL-10", name: "9th Floor",   phaseId: "PH-B", type: "" },
    ],
    scopes: [],
  },
  {
    id: "PRJ-003",
    name: "Villa Complex B",
    client: "Ahmed Group",
    location: "Riyadh",
    pm: "Hassan U.",
    startDate: "2025-03-01",
    endDate: "2026-06",
    type: "Residential",
    subtype: "Villa Complex",
    status: "On Track",
    progress: 82,
    createdAt: "2025-03-01",
    phases: [],
    units: [],
    scopes: [],
  },
  {
    id: "PRJ-004",
    name: "Mall Extension",
    client: "RetailPros",
    location: "Jeddah",
    pm: "Omar T.",
    startDate: "2025-04-01",
    endDate: "2025-12",
    type: "Retail",
    subtype: "Mall",
    status: "At Risk",
    progress: 30,
    createdAt: "2025-04-01",
    phases: [],
    units: [],
    scopes: [],
  },
];

function generateId(projects) {
  const nums = projects
    .map((p) => parseInt(p.id.replace("PRJ-", ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `PRJ-${String(max + 1).padStart(3, "0")}`;
}

function genPhaseId(phases) {
  return `PH-${Date.now()}-${phases.length + 1}`;
}

function genUnitId(units) {
  return `U-${Date.now()}-${units.length + 1}`;
}

const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: SEED_PROJECTS,

      addProject: (projectData) => {
        const projects = get().projects;
        const id = generateId(projects);
        
        let phases = projectData.phases || [];
        let units = projectData.units || [];
        
        // Parse structure to populate phases and units if structure is present
        if (projectData.structure) {
          const struct = projectData.structure;
          const { subtype } = projectData;
          
          if (subtype === "Villa Complex") {
            if (struct.usePhases !== false && struct.phases) {
              phases = struct.phases.map((p, idx) => {
                const phId = `PH-${Date.now()}-${idx + 1}`;
                const unitIds = p.units.map(u => u.toString());
                
                // Add units
                p.units.forEach(u => {
                  units.push({
                    id: u.toString(),
                    name: `Villa ${u}`,
                    phaseId: phId,
                    type: p.floors ? p.floors.join(", ") : "GF, FF, RF"
                  });
                });
                
                return {
                  id: phId,
                  name: p.name || `Phase ${p.label}`,
                  colorId: PHASE_COLORS[idx % PHASE_COLORS.length].id,
                  unitIds: unitIds
                };
              });
            } else if (struct.units) {
              // No phases
              const floors = struct.floors || ["GF", "FF", "RF"];
              struct.units.forEach(u => {
                units.push({
                  id: u.toString(),
                  name: `Villa ${u}`,
                  phaseId: null,
                  type: floors.join(", ")
                });
              });
            }
          }
          else if (subtype === "Single Villa" || subtype === "Showroom") {
            const floors = struct.floors || ["GF", "FF", "RF"];
            units = [{
              id: "BUILDING",
              name: projectData.name || "Main Building",
              phaseId: null,
              type: floors.join(", ")
            }];
          }
          else if (
            subtype === "Apartment Block" ||
            subtype === "Office Tower" ||
            subtype === "Mixed-Use Tower" ||
            subtype === "Hotel" ||
            subtype === "Serviced Apartments"
          ) {
            const floors = struct.floors || [];
            floors.forEach((f, idx) => {
              const phId = `PH-${Date.now()}-${idx + 1}`;
              const unitIds = f.units.map(u => u.toString());
              
              f.units.forEach(u => {
                units.push({
                  id: u.toString(),
                  name: `Unit ${u}`,
                  phaseId: phId,
                  type: f.label || "Typical"
                });
              });
              
              phases.push({
                id: phId,
                name: f.label || `Floor ${idx + 1}`,
                colorId: PHASE_COLORS[idx % PHASE_COLORS.length].id,
                unitIds: unitIds
              });
            });
          }
          else if (subtype === "Compound" || subtype === "Business Park" || subtype === "Resort") {
            const blocks = struct.blocks || [];
            blocks.forEach((b, idx) => {
              const phId = `PH-${Date.now()}-${idx + 1}`;
              const unitIds = b.units.map(u => u.toString());
              
              b.units.forEach(u => {
                units.push({
                  id: u.toString(),
                  name: `Unit ${u}`,
                  phaseId: phId,
                  type: b.name || `Block ${idx + 1}`
                });
              });
              
              phases.push({
                id: phId,
                name: b.name || `Block ${idx + 1}`,
                colorId: PHASE_COLORS[idx % PHASE_COLORS.length].id,
                unitIds: unitIds
              });
            });
          }
          else if (subtype === "Mall" || subtype === "Strip Mall") {
            const zones = struct.zones || [];
            zones.forEach((z, idx) => {
              const phId = `PH-${Date.now()}-${idx + 1}`;
              const unitIds = z.shops.map(s => s.toString());
              
              z.shops.forEach(s => {
                units.push({
                  id: s.toString(),
                  name: `Shop ${s}`,
                  phaseId: phId,
                  type: z.name || `Zone ${idx + 1}`
                });
              });
              
              phases.push({
                id: phId,
                name: z.name || `Zone ${idx + 1}`,
                colorId: PHASE_COLORS[idx % PHASE_COLORS.length].id,
                unitIds: unitIds
              });
            });
          }
        }
        
        const newProject = {
          ...projectData,
          id,
          status: "On Track",
          progress: 0,
          phases,
          units,
          scopes: [],
          createdAt: new Date().toISOString().split("T")[0],
        };
        set({ projects: [...projects, newProject] });
        return newProject;
      },

      updateProject: (id, data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      getProject: (id) => get().projects.find((p) => p.id === id),

      // ── Phase management ───────────────────────────────────────────
      addPhase: (projectId, phaseData) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const newPhase = {
              id: genPhaseId(p.phases || []),
              name: phaseData.name,
              colorId: phaseData.colorId || "blue",
              unitIds: [],
            };
            return { ...p, phases: [...(p.phases || []), newPhase] };
          }),
        }));
      },

      updatePhase: (projectId, phaseId, data) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              phases: (p.phases || []).map((ph) =>
                ph.id === phaseId ? { ...ph, ...data } : ph
              ),
            };
          }),
        }));
      },

      deletePhase: (projectId, phaseId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              phases: (p.phases || []).filter((ph) => ph.id !== phaseId),
              units: (p.units || []).map((u) =>
                u.phaseId === phaseId ? { ...u, phaseId: null } : u
              ),
            };
          }),
        }));
      },

      // ── Unit management ────────────────────────────────────────────
      addUnit: (projectId, unitData) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const newUnit = {
              id: unitData.id || genUnitId(p.units || []),
              name: unitData.name,
              phaseId: unitData.phaseId || null,
              type: unitData.type || "",
            };
            // also push unit id into phase.unitIds
            const updatedPhases = (p.phases || []).map((ph) =>
              ph.id === newUnit.phaseId
                ? { ...ph, unitIds: [...(ph.unitIds || []), newUnit.id] }
                : ph
            );
            return {
              ...p,
              units: [...(p.units || []), newUnit],
              phases: updatedPhases,
            };
          }),
        }));
      },

      updateUnit: (projectId, unitId, data) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const oldUnit = (p.units || []).find((u) => u.id === unitId);
            const newUnit = { ...oldUnit, ...data };
            let updatedPhases = p.phases || [];
            // handle phase change
            if (oldUnit && data.phaseId && oldUnit.phaseId !== data.phaseId) {
              updatedPhases = updatedPhases.map((ph) => {
                if (ph.id === oldUnit.phaseId)
                  return { ...ph, unitIds: (ph.unitIds || []).filter((id) => id !== unitId) };
                if (ph.id === data.phaseId)
                  return { ...ph, unitIds: [...(ph.unitIds || []), unitId] };
                return ph;
              });
            }
            return {
              ...p,
              units: (p.units || []).map((u) => (u.id === unitId ? newUnit : u)),
              phases: updatedPhases,
            };
          }),
        }));
      },

      deleteUnit: (projectId, unitId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              units: (p.units || []).filter((u) => u.id !== unitId),
              phases: (p.phases || []).map((ph) => ({
                ...ph,
                unitIds: (ph.unitIds || []).filter((id) => id !== unitId),
              })),
            };
          }),
        }));
      },

      addBulkUnits: (projectId, unitsArray) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const existing = p.units || [];
            const newUnits = unitsArray.map((u, i) => ({
              id: u.id || `U-${Date.now()}-${i}`,
              name: u.name,
              phaseId: u.phaseId || null,
              type: u.type || "",
            }));
            let updatedPhases = p.phases || [];
            newUnits.forEach((nu) => {
              if (nu.phaseId) {
                updatedPhases = updatedPhases.map((ph) =>
                  ph.id === nu.phaseId
                    ? { ...ph, unitIds: [...(ph.unitIds || []), nu.id] }
                    : ph
                );
              }
            });
            return {
              ...p,
              units: [...existing, ...newUnits],
              phases: updatedPhases,
            };
          }),
        }));
      },
    }),
    {
      name: "buildtrack-projects-v2",
      version: 2,
    }
  )
);

export default useProjectStore;
