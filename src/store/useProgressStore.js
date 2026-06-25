"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

// ---------------------------------------------------------------------------
// Helper: after a log mutation, sync the affected project + its assignments
// back from the DB so all stores reflect the latest data without a page reload.
// ---------------------------------------------------------------------------
async function syncProjectData(projectId) {
  if (!projectId) return;
  try {
    // Lazy import to avoid circular dependency at module load time
    const [{ default: useProjectStore }, { default: useAssignmentStore }] =
      await Promise.all([
        import("./useProjectStore"),
        import("./useAssignmentStore"),
      ]);
    // Run both refreshes in parallel — non-blocking
    await Promise.all([
      useProjectStore.getState().refreshProject(projectId),
      useAssignmentStore.getState().fetchAssignments(projectId, true),
    ]);
  } catch (err) {
    // Sync failure is non-fatal — UI still shows the new/updated log
    console.warn("syncProjectData failed silently:", err);
  }
}

const useProgressStore = create((set, get) => ({
  logs: [],
  loading: false,
  loaded: false,
  error: null,

  /* ── Fetch logs ─────────────────────────────────────────── */
  fetchLogs: async (projectId = null, force = false) => {
    if (get().loaded && !projectId && !force) return;
    set({ loading: true });
    try {
      const url = projectId
        ? `/api/progress-logs?projectId=${projectId}`
        : "/api/progress-logs";
      const res = await axios.get(url);
      if (projectId) {
        set((state) => {
          const others = state.logs.filter((l) => l.projectId !== projectId);
          return { logs: [...others, ...res.data], error: null };
        });
      } else {
        set({ logs: res.data, loaded: true, error: null });
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load progress logs";
      set({ error: msg });
      toast.error(msg);
    } finally {
      set({ loading: false });
    }
  },

  /* ── Add log ────────────────────────────────────────────── */
  addLog: async (data) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/progress-logs", data);
      const newLog = res.data;
      set((state) => ({ logs: [newLog, ...state.logs] }));
      toast.success("Progress logged!");
      // Sync project totals + assignment breakdown done qty in background
      syncProjectData(newLog.projectId);
      return newLog;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save progress log";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Update log ─────────────────────────────────────────── */
  updateLog: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/progress-logs/${id}`, data);
      const updated = res.data;
      set((state) => ({
        logs: state.logs.map((l) => (l.id === id ? updated : l)),
      }));
      toast.success("Log updated");
      // Sync so project progress % and assignment done qty reflect new value
      syncProjectData(updated.projectId);
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update log";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Approve log ────────────────────────────────────────── */
  approveLog: async (id) => {
    return get().updateLog(id, { status: "Approved" });
  },

  /* ── Delete log ─────────────────────────────────────────── */
  deleteLog: async (id) => {
    set({ loading: true });
    // Capture projectId BEFORE deletion so we can sync afterward
    const logToDelete = get().logs.find((l) => l.id === id);
    const projectId = logToDelete?.projectId;
    try {
      await axios.delete(`/api/progress-logs/${id}`);
      set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));
      toast.success("Log deleted");
      // Sync project totals + assignment breakdown done qty downward
      syncProjectData(projectId);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete log";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Queries ─────────────────────────────────────────────── */
  getLogsForProject: (projectId) =>
    get().logs.filter((l) => l.projectId === projectId),

  getLogsForAssignment: (assignmentId) =>
    get().logs.filter((l) => l.assignmentId === assignmentId),

  getLogsForUnit: (projectId, unitId) =>
    get().logs.filter(
      (l) => l.projectId === projectId && l.unitId === unitId
    ),

  getRunningTotal: (assignmentId, unitId = null) => {
    const logs = get().logs.filter(
      (l) =>
        l.assignmentId === assignmentId &&
        (unitId === null || l.unitId === unitId)
    );
    return logs.reduce((s, l) => s + (l.qtyCompleted || 0), 0);
  },

  getTotalBefore: (assignmentId, unitId, beforeDate) => {
    return get()
      .logs.filter(
        (l) =>
          l.assignmentId === assignmentId &&
          (unitId === null || l.unitId === unitId) &&
          l.date < beforeDate
      )
      .reduce((s, l) => s + (l.qtyCompleted || 0), 0);
  },

  getEarnedValue: (assignmentId) => {
    return get()
      .logs.filter((l) => l.assignmentId === assignmentId)
      .reduce((s, l) => s + (l.amountEarned || 0), 0);
  },

  getLogsByDate: (projectId) => {
    const logs = get().logs.filter((l) => l.projectId === projectId);
    return logs.reduce((acc, l) => {
      if (!acc[l.date]) acc[l.date] = [];
      acc[l.date].push(l);
      return acc;
    }, {});
  },
}));

export default useProgressStore;
