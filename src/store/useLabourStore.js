"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const useLabourStore = create((set, get) => ({
  workers: [],
  attendance: [],
  advances: [],
  teams: [],
  loading: false,
  loaded: false,
  error: null,

  // Fetch all labour data (workers, teams, attendance, advances) in one optimized call
  fetchLabourData: async (force = false) => {
    if (get().loaded && !force) return;
    
    set({ loading: true });
    try {
      const res = await axios.get("/api/labour");
      set({
        workers: res.data.workers,
        teams: res.data.teams,
        attendance: res.data.attendance,
        advances: res.data.advances,
        loaded: true,
        error: null,
      });
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load workforce data";
      set({ error: msg });
      toast.error(msg);
    } finally {
      set({ loading: false });
    }
  },

  /* ── Workers CRUD ──────────────────────────────────────────────────── */
  addWorker: async (workerData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/workers", workerData);
      set((state) => ({
        workers: [...state.workers, res.data],
      }));
      toast.success("Worker profile added!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to add worker profile";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateWorker: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/workers/${id}`, data);
      set((state) => ({
        workers: state.workers.map((w) => (w.id === id ? res.data : w)),
        // If team updates are needed for leader name, we re-fetch or map
        teams: state.teams.map((t) => {
          if (t.leaderId === id) {
            return { ...t, leaderName: res.data.name };
          }
          return t;
        }),
      }));
      toast.success("Worker profile updated!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update worker profile";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteWorker: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/workers/${id}`);
      set((state) => ({
        workers: state.workers.filter((w) => w.id !== id),
        attendance: state.attendance.filter((a) => a.workerId !== id),
        advances: state.advances.filter((a) => a.workerId !== id),
        teams: state.teams.map((t) => ({
          ...t,
          memberIds: t.memberIds.filter((m) => m !== id),
          leaderId: t.leaderId === id ? null : t.leaderId,
          leaderName: t.leaderId === id ? "" : t.leaderName,
        })),
      }));
      toast.success("Worker profile deleted!");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete worker";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getWorker: (id) => get().workers.find((w) => w.id === id),

  /* ── Attendance CRUD ───────────────────────────────────────────────── */
  addAttendance: async (attendanceData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/attendance", attendanceData);
      const newEntry = res.data;
      
      set((state) => {
        const list = state.attendance;
        const exists = list.some((a) => a.workerId === newEntry.workerId && a.date === newEntry.date);
        if (exists) {
          return {
            attendance: list.map((a) => (a.workerId === newEntry.workerId && a.date === newEntry.date ? newEntry : a)),
          };
        } else {
          return {
            attendance: [newEntry, ...list],
          };
        }
      });
      toast.success("Attendance marked!");
      return newEntry;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to record attendance";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateAttendance: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/attendance/${id}`, data);
      set((state) => ({
        attendance: state.attendance.map((a) => (a.id === id ? res.data : a)),
      }));
      toast.success("Attendance updated!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update attendance";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteAttendance: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/attendance/${id}`);
      set((state) => ({
        attendance: state.attendance.filter((a) => a.id !== id),
      }));
      toast.success("Attendance record removed!");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete attendance record";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  bulkMarkAttendance: async (entries) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/attendance/bulk", { entries });
      const savedEntries = res.data.data;
      
      set((state) => {
        let list = [...state.attendance];
        savedEntries.forEach((newEntry) => {
          const exists = list.some((a) => a.workerId === newEntry.workerId && a.date === newEntry.date);
          if (exists) {
            list = list.map((a) => (a.workerId === newEntry.workerId && a.date === newEntry.date ? newEntry : a));
          } else {
            list.unshift(newEntry);
          }
        });
        return { attendance: list };
      });
      toast.success("Bulk attendance records saved!");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed bulk marking attendance";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getWorkerAttendance: (workerId) =>
    get()
      .attendance.filter((a) => a.workerId === workerId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),

  calculatePayable: (workerId, fromDate, toDate) => {
    const worker = get().workers.find((w) => w.id === workerId);
    if (!worker) return 0;
    const records = get().attendance.filter((a) => {
      const d = a.date;
      return a.workerId === workerId && d >= fromDate && d <= toDate;
    });
    if (worker.payType === "monthly") {
      const presentDays = records.filter((a) => a.status === "present").length;
      const halfDays = records.filter((a) => a.status === "half-day").length;
      const dailyRate = worker.rate / 26;
      return presentDays * dailyRate + halfDays * dailyRate * 0.5;
    } else {
      const totalDays = records.reduce((sum, a) => {
        if (a.status === "present") return sum + 1;
        if (a.status === "half-day") return sum + 0.5;
        return sum;
      }, 0);
      return totalDays * worker.rate;
    }
  },

  calculateHourlyPayable: (workerId, fromDate, toDate) => {
    const worker = get().workers.find((w) => w.id === workerId);
    if (!worker) return 0;
    const records = get().attendance.filter((a) => {
      return a.workerId === workerId && a.date >= fromDate && a.date <= toDate;
    });
    const totalHours = records.reduce((s, a) => s + (a.hoursWorked || 0), 0);
    const overtimeHours = records.reduce((s, a) => s + (a.overtime || 0), 0);
    let hourlyRate;
    if (worker.payType === "monthly") {
      hourlyRate = worker.rate / 26 / 8;
    } else {
      hourlyRate = worker.rate / 8;
    }
    const regularHours = totalHours - overtimeHours;
    return regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5;
  },

  /* ── Advances / Expenses CRUD ──────────────────────────────────────── */
  addAdvance: async (advanceData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/advances", advanceData);
      set((state) => ({
        advances: [res.data, ...state.advances],
      }));
      toast.success("Transaction recorded!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to record transaction";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateAdvance: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/advances/${id}`, data);
      set((state) => ({
        advances: state.advances.map((a) => (a.id === id ? res.data : a)),
      }));
      toast.success("Transaction updated!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update transaction";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteAdvance: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/advances/${id}`);
      set((state) => ({
        advances: state.advances.filter((a) => a.id !== id),
      }));
      toast.success("Transaction deleted!");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete transaction";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getWorkerAdvances: (workerId) =>
    get()
      .advances.filter((a) => a.workerId === workerId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),

  /* ── Teams CRUD ────────────────────────────────────────────────────── */
  addTeam: async (teamData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/teams", teamData);
      set((state) => ({
        teams: [...state.teams, res.data],
      }));
      toast.success("Team created successfully!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create team";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateTeam: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/teams/${id}`, data);
      set((state) => ({
        teams: state.teams.map((t) => (t.id === id ? res.data : t)),
      }));
      toast.success("Team updated successfully!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update team";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteTeam: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/teams/${id}`);
      set((state) => ({
        teams: state.teams.filter((t) => t.id !== id),
      }));
      toast.success("Team deleted!");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete team";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getTeam: (id) => get().teams.find((t) => t.id === id),
}));

export default useLabourStore;
