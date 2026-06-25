"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

/* ─── Colour palette for phases ─────────────────────────────────────── */
export const PHASE_COLORS = [
  { id: "blue",    bg: "bg-blue-500/15",    text: "text-blue-600 dark:text-blue-400",    dot: "bg-blue-500",    border: "border-blue-500/25",    hex: "#3b82f6" },
  { id: "purple",  bg: "bg-purple-500/15",  text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500",  border: "border-purple-500/25",  hex: "#8b5cf6" },
  { id: "amber",   bg: "bg-amber-500/15",   text: "text-amber-600 dark:text-amber-400",   dot: "bg-amber-500",   border: "border-amber-500/25",   hex: "#f59e0b" },
  { id: "emerald", bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500/25", hex: "#10b981" },
  { id: "rose",    bg: "bg-rose-500/15",    text: "text-rose-600 dark:text-rose-400",    dot: "bg-rose-500",    border: "border-rose-500/25",    hex: "#f43f5e" },
  { id: "cyan",    bg: "bg-cyan-500/15",    text: "text-cyan-600 dark:text-cyan-400",    dot: "bg-cyan-500",    border: "border-cyan-500/25",    hex: "#06b6d4" },
];

const useProjectStore = create((set, get) => ({
  projects: [],
  loading: false,
  loaded: false,
  error: null,

  /* ── Fetch all projects ─────────────────────────────────── */
  fetchProjects: async (force = false) => {
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      const res = await axios.get("/api/projects");
      set({ projects: res.data, loaded: true, error: null });
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load projects";
      set({ error: msg });
      toast.error(msg);
    } finally {
      set({ loading: false });
    }
  },

  /* ── Add project ────────────────────────────────────────── */
  addProject: async (projectData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/projects", projectData);
      const newProject = res.data;
      set((state) => ({ projects: [...state.projects, newProject] }));
      toast.success("Project created successfully!");
      return newProject;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create project";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Update project ─────────────────────────────────────── */
  updateProject: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/projects/${id}`, data);
      const updated = res.data;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
      }));
      toast.success("Project updated");
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update project";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Delete project ─────────────────────────────────────── */
  deleteProject: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
      toast.success("Project removed");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete project";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Sync a single project (re-fetch from DB) ───────────── */
  refreshProject: async (id) => {
    try {
      const res = await axios.get(`/api/projects/${id}`);
      const updated = res.data;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
      }));
      return updated;
    } catch (err) {
      console.error("refreshProject error:", err);
    }
  },

  /* ── Getters ─────────────────────────────────────────────── */
  getProject: (id) => get().projects.find((p) => p.id === id),

  /* ── Phase management (via project update) ───────────────── */
  addPhase: async (projectId, phaseData) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    const newPhases = [
      ...(project.phases || []),
      {
        name: phaseData.name,
        colorId: phaseData.colorId || "blue",
        unitIds: [],
      },
    ];
    return get().updateProject(projectId, { phases: newPhases });
  },

  updatePhase: async (projectId, phaseId, data) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    const newPhases = (project.phases || []).map((ph) =>
      ph.id === phaseId ? { ...ph, ...data } : ph
    );
    return get().updateProject(projectId, { phases: newPhases });
  },

  deletePhase: async (projectId, phaseId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    const newPhases = (project.phases || []).filter((ph) => ph.id !== phaseId);
    const newUnits = (project.units || []).map((u) =>
      u.phaseId === phaseId ? { ...u, phaseId: null } : u
    );
    return get().updateProject(projectId, { phases: newPhases, units: newUnits });
  },

  /* ── Unit management ─────────────────────────────────────── */
  addUnit: async (projectId, unitData) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    const newUnit = {
      id: unitData.id || undefined,
      name: unitData.name,
      phaseId: unitData.phaseId || null,
      type: unitData.type || "",
    };
    const newUnits = [...(project.units || []), newUnit];
    const newPhases = (project.phases || []).map((ph) =>
      ph.id === newUnit.phaseId
        ? { ...ph, unitIds: [...(ph.unitIds || []), unitData.id] }
        : ph
    );
    return get().updateProject(projectId, { units: newUnits, phases: newPhases });
  },

  updateUnit: async (projectId, unitId, data) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    const newUnits = (project.units || []).map((u) =>
      u.id === unitId ? { ...u, ...data } : u
    );
    return get().updateProject(projectId, { units: newUnits });
  },

  deleteUnit: async (projectId, unitId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    const newUnits = (project.units || []).filter((u) => u.id !== unitId);
    const newPhases = (project.phases || []).map((ph) => ({
      ...ph,
      unitIds: (ph.unitIds || []).filter((id) => id !== unitId),
    }));
    return get().updateProject(projectId, { units: newUnits, phases: newPhases });
  },

  addBulkUnits: async (projectId, unitsArray) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    const newUnits = [...(project.units || []), ...unitsArray];
    return get().updateProject(projectId, { units: newUnits });
  },
}));

export default useProjectStore;
