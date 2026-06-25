"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const useAssignmentStore = create((set, get) => ({
  assignments: [],
  loading: false,
  loaded: false,
  error: null,

  /* ── Fetch assignments ──────────────────────────────────── */
  fetchAssignments: async (projectId = null, force = false) => {
    // If already loaded globally and no filter needed, skip
    if (get().loaded && !projectId && !force) return;
    set({ loading: true });
    try {
      const url = projectId
        ? `/api/assignments?projectId=${projectId}`
        : "/api/assignments";
      const res = await axios.get(url);
      if (projectId) {
        // Merge fetched project's assignments with existing (other projects stay)
        const fetched = res.data;
        set((state) => {
          const others = state.assignments.filter(
            (a) => a.projectId !== projectId
          );
          return { assignments: [...others, ...fetched], error: null };
        });
      } else {
        set({ assignments: res.data, loaded: true, error: null });
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load assignments";
      set({ error: msg });
      toast.error(msg);
    } finally {
      set({ loading: false });
    }
  },

  /* ── Add assignment ─────────────────────────────────────── */
  addAssignment: async (data) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/assignments", data);
      const newItem = res.data;
      set((state) => ({ assignments: [...state.assignments, newItem] }));
      toast.success("Scope assigned successfully!");
      return newItem;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to assign scope";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Update assignment ──────────────────────────────────── */
  updateAssignment: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/assignments/${id}`, data);
      const updated = res.data;
      set((state) => ({
        assignments: state.assignments.map((a) => (a.id === id ? updated : a)),
      }));
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update assignment";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Delete assignment ──────────────────────────────────── */
  deleteAssignment: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/assignments/${id}`);
      set((state) => ({
        assignments: state.assignments.filter((a) => a.id !== id),
      }));
      toast.success("Assignment removed");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to remove assignment";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Update done quantity (optimistic) ─────────────────── */
  applyProgressOptimistic: (assignmentId, unitId, phaseId, deltaQty) => {
    set((state) => ({
      assignments: state.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        if (a.level === "unit" && unitId) {
          return {
            ...a,
            unitBreakdown: (a.unitBreakdown || []).map((u) =>
              u.unitId === unitId
                ? { ...u, done: Math.max(0, (u.done || 0) + deltaQty) }
                : u
            ),
          };
        }
        if (a.level === "phase" && phaseId) {
          return {
            ...a,
            phaseBreakdown: (a.phaseBreakdown || []).map((p) =>
              p.phaseId === phaseId
                ? { ...p, done: Math.max(0, (p.done || 0) + deltaQty) }
                : p
            ),
          };
        }
        return a;
      }),
    }));
  },

  /* ── Queries ─────────────────────────────────────────────── */
  getProjectAssignments: (projectId) =>
    get().assignments.filter((a) => a.projectId === projectId),

  getAssignment: (id) => get().assignments.find((a) => a.id === id),

  /* ── Derived totals ──────────────────────────────────────── */
  getTotalQty: (a) => {
    if (a.level === "unit" && a.unitBreakdown?.length)
      return a.unitBreakdown.reduce((s, u) => s + (u.qty || 0), 0);
    if (a.level === "phase" && a.phaseBreakdown?.length)
      return a.phaseBreakdown.reduce((s, p) => s + (p.qty || 0), 0);
    return a.totalQty || 0;
  },

  getDoneQty: (a, progressLogs) => {
    if (a.level === "project") {
      return (progressLogs || [])
        .filter((l) => l.assignmentId === a.id)
        .reduce((s, l) => s + (l.qtyCompleted || 0), 0);
    }
    if (a.level === "unit" && a.unitBreakdown?.length)
      return a.unitBreakdown.reduce((s, u) => s + (u.done || 0), 0);
    if (a.level === "phase" && a.phaseBreakdown?.length)
      return a.phaseBreakdown.reduce((s, p) => s + (p.done || 0), 0);
    return 0;
  },
}));

export default useAssignmentStore;
