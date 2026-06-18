"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

function genId(prefix, list) {
  const nums = list
    .map((x) => parseInt((x.id || `${prefix}-0`).replace(`${prefix}-`, ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

/* ─── Seed Workers ──────────────────────────────────────────────────────── */
const SEED_WORKERS = [
  {
    id: "WRK-001",
    name: "Mohammad Al-Hussain",
    iqamaNumber: "2456789012",
    nationality: "Pakistani",
    trade: "Mason",
    payType: "monthly",
    rate: 2800,
    phone: "+966 55 123 4567",
    emergencyContact: "+92 300 1234567",
    joinDate: "2024-03-15",
    status: "Active",
    photo: null,
    notes: "Senior mason with 8 years experience",
    bloodGroup: "B+",
    iqamaExpiry: "2026-12-31",
  },
  {
    id: "WRK-002",
    name: "Rajesh Kumar",
    iqamaNumber: "2567890123",
    nationality: "Indian",
    trade: "Carpenter",
    payType: "daily",
    rate: 120,
    phone: "+966 54 234 5678",
    emergencyContact: "+91 98 23456789",
    joinDate: "2024-05-01",
    status: "Active",
    photo: null,
    notes: "Formwork specialist",
    bloodGroup: "O+",
    iqamaExpiry: "2025-11-30",
  },
  {
    id: "WRK-003",
    name: "Suresh Patel",
    iqamaNumber: "2678901234",
    nationality: "Indian",
    trade: "Steel Fixer",
    payType: "daily",
    rate: 130,
    phone: "+966 56 345 6789",
    emergencyContact: "+91 99 34567890",
    joinDate: "2024-01-10",
    status: "Active",
    photo: null,
    notes: "",
    bloodGroup: "A+",
    iqamaExpiry: "2026-08-15",
  },
  {
    id: "WRK-004",
    name: "Abdul Kareem",
    iqamaNumber: "2789012345",
    nationality: "Bangladeshi",
    trade: "Helper",
    payType: "monthly",
    rate: 1800,
    phone: "+966 53 456 7890",
    emergencyContact: "+880 171 2345678",
    joinDate: "2024-07-20",
    status: "Active",
    photo: null,
    notes: "",
    bloodGroup: "AB-",
    iqamaExpiry: "2025-09-30",
  },
  {
    id: "WRK-005",
    name: "Sanjay Sharma",
    iqamaNumber: "2890123456",
    nationality: "Nepali",
    trade: "Painter",
    payType: "daily",
    rate: 110,
    phone: "+966 50 567 8901",
    emergencyContact: "+977 98 45678901",
    joinDate: "2023-11-01",
    status: "Inactive",
    photo: null,
    notes: "On medical leave",
    bloodGroup: "O-",
    iqamaExpiry: "2024-10-15",
  },
  {
    id: "WRK-006",
    name: "Ali Hassan",
    iqamaNumber: "2901234567",
    nationality: "Ethiopian",
    trade: "Electrician",
    payType: "monthly",
    rate: 3200,
    phone: "+966 57 678 9012",
    emergencyContact: "+251 91 5678901",
    joinDate: "2024-02-14",
    status: "Active",
    photo: null,
    notes: "Licensed electrician",
    bloodGroup: "B-",
    iqamaExpiry: "2026-03-31",
  },
];

/* ─── Date helpers ──────────────────────────────────────────────────────── */
const _today = new Date();
function dateStr(offset = 0) {
  const d = new Date(_today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}
// Produce a time string like "06:45"
function timeStr(h, m = 0) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* ─── Seed Attendance ───────────────────────────────────────────────────── */
// Each record now carries:
//   clockIn / clockOut (HH:MM strings, may be null)
//   breakMinutes (minutes taken for break)
//   location (freetext)
//   shift ("morning" | "afternoon" | "night" | "full-day")
const SEED_ATTENDANCE = [
  // ── WRK-001  (monthly mason) ──────────────────────────────────────────
  { id: "ATT-001", workerId: "WRK-001", date: dateStr(-6), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:45", clockOut: "17:30", breakMinutes: 60, hoursWorked: 9.75, overtime: 1.75, location: "Villa 801 – Phase A", notes: "" },
  { id: "ATT-002", workerId: "WRK-001", date: dateStr(-5), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:50", clockOut: "15:00", breakMinutes: 60, hoursWorked: 7.17, overtime: 0,    location: "Villa 804 – Phase A", notes: "" },
  { id: "ATT-003", workerId: "WRK-001", date: dateStr(-4), projectId: "PRJ-001", status: "half-day", shift: "morning",   clockIn: "06:55", clockOut: "11:00", breakMinutes: 0,  hoursWorked: 4.08, overtime: 0,    location: "Villa 811", notes: "Doctor appointment" },
  { id: "ATT-004", workerId: "WRK-001", date: dateStr(-3), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:40", clockOut: "17:45", breakMinutes: 60, hoursWorked: 10.08, overtime: 2.08, location: "Villa 814", notes: "" },
  { id: "ATT-005", workerId: "WRK-001", date: dateStr(-2), projectId: "PRJ-002", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Tower Block A – GF", notes: "Transferred for the day" },
  { id: "ATT-006", workerId: "WRK-001", date: dateStr(-1), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:50", clockOut: "15:50", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Villa 817", notes: "" },
  { id: "ATT-007", workerId: "WRK-001", date: dateStr(0),  projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:45", clockOut: "17:00", breakMinutes: 60, hoursWorked: 9.25, overtime: 1.25, location: "Villa 801", notes: "" },

  // ── WRK-002  (daily carpenter) ───────────────────────────────────────
  { id: "ATT-008", workerId: "WRK-002", date: dateStr(-6), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Villa 902", notes: "" },
  { id: "ATT-009", workerId: "WRK-002", date: dateStr(-5), projectId: "PRJ-001", status: "absent",   shift: null,        clockIn: null,    clockOut: null,    breakMinutes: 0,  hoursWorked: 0,    overtime: 0,    location: "", notes: "No show" },
  { id: "ATT-010", workerId: "WRK-002", date: dateStr(-4), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:55", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8.08, overtime: 0,    location: "Villa 903", notes: "" },
  { id: "ATT-011", workerId: "WRK-002", date: dateStr(-3), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:50", clockOut: "17:30", breakMinutes: 60, hoursWorked: 9.67, overtime: 1.67, location: "Villa 903", notes: "" },
  { id: "ATT-012", workerId: "WRK-002", date: dateStr(-2), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "07:05", clockOut: "16:05", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Villa 911", notes: "" },
  { id: "ATT-013", workerId: "WRK-002", date: dateStr(-1), projectId: "PRJ-001", status: "half-day", shift: "afternoon", clockIn: "13:00", clockOut: "17:00", breakMinutes: 0,  hoursWorked: 4,    overtime: 0,    location: "Villa 914", notes: "" },
  { id: "ATT-014", workerId: "WRK-002", date: dateStr(0),  projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:58", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8.03, overtime: 0,    location: "Villa 914", notes: "" },

  // ── WRK-003  (daily steel fixer) ──────────────────────────────────────
  { id: "ATT-015", workerId: "WRK-003", date: dateStr(-5), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:30", clockOut: "17:30", breakMinutes: 60, hoursWorked: 10,   overtime: 2,    location: "Villa 925 – Phase B", notes: "" },
  { id: "ATT-016", workerId: "WRK-003", date: dateStr(-4), projectId: "PRJ-002", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Tower Block A – FL-2", notes: "" },
  { id: "ATT-017", workerId: "WRK-003", date: dateStr(-3), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:45", clockOut: "17:30", breakMinutes: 60, hoursWorked: 9.75, overtime: 1.75, location: "Villa 101 – Phase C", notes: "" },
  { id: "ATT-018", workerId: "WRK-003", date: dateStr(-2), projectId: "PRJ-001", status: "absent",   shift: null,        clockIn: null,    clockOut: null,    breakMinutes: 0,  hoursWorked: 0,    overtime: 0,    location: "", notes: "" },
  { id: "ATT-019", workerId: "WRK-003", date: dateStr(-1), projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:50", clockOut: "15:50", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Villa 102", notes: "" },
  { id: "ATT-020", workerId: "WRK-003", date: dateStr(0),  projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "06:55", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8.08, overtime: 0,    location: "Villa 103", notes: "" },

  // ── WRK-004  (monthly helper) ─────────────────────────────────────────
  { id: "ATT-021", workerId: "WRK-004", date: dateStr(-4), projectId: "PRJ-003", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Villa Complex B", notes: "" },
  { id: "ATT-022", workerId: "WRK-004", date: dateStr(-3), projectId: "PRJ-003", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Villa Complex B", notes: "" },
  { id: "ATT-023", workerId: "WRK-004", date: dateStr(-2), projectId: "PRJ-003", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Villa Complex B", notes: "" },
  { id: "ATT-024", workerId: "WRK-004", date: dateStr(-1), projectId: "PRJ-003", status: "present",  shift: "full-day",  clockIn: "06:45", clockOut: "17:30", breakMinutes: 60, hoursWorked: 9.75, overtime: 1.75, location: "Villa Complex B", notes: "" },
  { id: "ATT-025", workerId: "WRK-004", date: dateStr(0),  projectId: "PRJ-001", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "ABO YARA – Phase A", notes: "" },

  // ── WRK-006  (monthly electrician) ───────────────────────────────────
  { id: "ATT-026", workerId: "WRK-006", date: dateStr(-6), projectId: "PRJ-002", status: "present",  shift: "full-day",  clockIn: "06:30", clockOut: "17:00", breakMinutes: 60, hoursWorked: 9.5,  overtime: 1.5,  location: "Tower – FL-4", notes: "" },
  { id: "ATT-027", workerId: "WRK-006", date: dateStr(-5), projectId: "PRJ-002", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Tower – FL-5", notes: "" },
  { id: "ATT-028", workerId: "WRK-006", date: dateStr(-4), projectId: "PRJ-002", status: "present",  shift: "full-day",  clockIn: "06:45", clockOut: "16:45", breakMinutes: 60, hoursWorked: 9,    overtime: 1,    location: "Tower – FL-6", notes: "" },
  { id: "ATT-029", workerId: "WRK-006", date: dateStr(-2), projectId: "PRJ-002", status: "half-day", shift: "morning",   clockIn: "06:45", clockOut: "11:00", breakMinutes: 0,  hoursWorked: 4.25, overtime: 0,    location: "Tower – FL-7", notes: "" },
  { id: "ATT-030", workerId: "WRK-006", date: dateStr(-1), projectId: "PRJ-002", status: "present",  shift: "full-day",  clockIn: "07:00", clockOut: "16:00", breakMinutes: 60, hoursWorked: 8,    overtime: 0,    location: "Tower – FL-8", notes: "" },
];

/* ─── Seed Advances/Expenses ────────────────────────────────────────────── */
const SEED_ADVANCES = [
  { id: "ADV-001", workerId: "WRK-001", type: "advance", amount: 500, date: dateStr(-15), description: "Salary advance - family emergency", status: "deducted" },
  { id: "ADV-002", workerId: "WRK-001", type: "expense", amount: 85,  date: dateStr(-10), description: "Transport allowance reimbursement", status: "paid" },
  { id: "ADV-003", workerId: "WRK-002", type: "advance", amount: 300, date: dateStr(-20), description: "Medical expense advance", status: "pending" },
  { id: "ADV-004", workerId: "WRK-003", type: "bonus",   amount: 200, date: dateStr(-5),  description: "Performance bonus - extra work on villa 811", status: "paid" },
  { id: "ADV-005", workerId: "WRK-004", type: "advance", amount: 400, date: dateStr(-8),  description: "Eid advance", status: "deducted" },
  { id: "ADV-006", workerId: "WRK-006", type: "expense", amount: 150, date: dateStr(-3),  description: "Electrician tools - company reimbursement", status: "paid" },
];

/* ─── Seed Teams ────────────────────────────────────────────────────────── */
const SEED_TEAMS = [
  {
    id: "TM-001",
    name: "Civil Alpha Team",
    projectId: "PRJ-001",
    projectName: "ABO YARA Villa Project",
    leaderId: "WRK-001",
    leaderName: "Mohammad Al-Hussain",
    memberIds: ["WRK-001", "WRK-002", "WRK-003", "WRK-004"],
    trade: "Civil Works",
    startDate: "2025-01-15",
    endDate: "2025-09-30",
    status: "Active",
    location: "Phase A",
    notes: "Primary civil team for Phase A villas",
    createdAt: "2025-01-10",
  },
  {
    id: "TM-002",
    name: "MEP Bravo Team",
    projectId: "PRJ-002",
    projectName: "Tower Block A",
    leaderId: "WRK-006",
    leaderName: "Ali Hassan",
    memberIds: ["WRK-006"],
    trade: "Mechanical & Electrical",
    startDate: "2025-02-10",
    endDate: "2026-03-30",
    status: "Active",
    location: "Floors 1-5",
    notes: "MEP installation team",
    createdAt: "2025-02-05",
  },
];

/* ─── Store ─────────────────────────────────────────────────────────────── */
const useLabourStore = create(
  persist(
    (set, get) => ({
      workers: SEED_WORKERS,
      attendance: SEED_ATTENDANCE,
      advances: SEED_ADVANCES,
      teams: SEED_TEAMS,

      /* ── Workers CRUD ──────────────────────────────────────────────────── */
      addWorker: (data) => {
        const list = get().workers;
        const id = genId("WRK", list);
        const newWorker = {
          ...data,
          id,
          status: data.status || "Active",
          joinDate: data.joinDate || new Date().toISOString().split("T")[0],
          photo: null,
        };
        set({ workers: [...list, newWorker] });
        return newWorker;
      },

      updateWorker: (id, data) => {
        set((state) => ({
          workers: state.workers.map((w) => (w.id === id ? { ...w, ...data } : w)),
        }));
      },

      deleteWorker: (id) => {
        set((state) => ({
          workers: state.workers.filter((w) => w.id !== id),
          attendance: state.attendance.filter((a) => a.workerId !== id),
          advances: state.advances.filter((a) => a.workerId !== id),
          teams: state.teams.map((t) => ({
            ...t,
            memberIds: t.memberIds.filter((m) => m !== id),
            leaderId: t.leaderId === id ? null : t.leaderId,
          })),
        }));
      },

      getWorker: (id) => get().workers.find((w) => w.id === id),

      /* ── Attendance CRUD ───────────────────────────────────────────────── */
      addAttendance: (data) => {
        const list = get().attendance;
        // If a record already exists for this worker+date, update it instead
        const existing = list.find(
          (a) => a.workerId === data.workerId && a.date === data.date
        );
        if (existing) {
          const updated = list.map((a) =>
            a.id === existing.id ? { ...a, ...data } : a
          );
          set({ attendance: updated });
          return existing;
        }
        const id = genId("ATT", list);
        const newEntry = {
          ...data,
          id,
          hoursWorked: Number(data.hoursWorked) || 0,
          overtime: Number(data.overtime) || 0,
          breakMinutes: Number(data.breakMinutes) || 0,
          clockIn: data.clockIn || null,
          clockOut: data.clockOut || null,
          shift: data.shift || "full-day",
          location: data.location || "",
        };
        set({ attendance: [newEntry, ...list] });
        return newEntry;
      },

      updateAttendance: (id, data) => {
        set((state) => ({
          attendance: state.attendance.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }));
      },

      deleteAttendance: (id) => {
        set((state) => ({
          attendance: state.attendance.filter((a) => a.id !== id),
        }));
      },

      // Bulk mark attendance for a date
      bulkMarkAttendance: (entries) => {
        // entries: [{ workerId, date, status, projectId, shift, clockIn, clockOut, hoursWorked, overtime, breakMinutes, location, notes }]
        const list = get().attendance;
        let updated = [...list];
        const newEntries = [];
        for (const entry of entries) {
          const existing = updated.find(
            (a) => a.workerId === entry.workerId && a.date === entry.date
          );
          if (existing) {
            updated = updated.map((a) =>
              a.id === existing.id ? { ...a, ...entry } : a
            );
          } else {
            const id = genId("ATT", [...updated, ...newEntries]);
            newEntries.push({ ...entry, id });
          }
        }
        set({ attendance: [...newEntries, ...updated] });
      },

      getWorkerAttendance: (workerId) =>
        get()
          .attendance.filter((a) => a.workerId === workerId)
          .sort((a, b) => new Date(b.date) - new Date(a.date)),

      // Calculate payable for a worker in a date range
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
          // daily rate × effective days
          const totalDays = records.reduce((sum, a) => {
            if (a.status === "present") return sum + 1;
            if (a.status === "half-day") return sum + 0.5;
            return sum;
          }, 0);
          return totalDays * worker.rate;
        }
      },

      // Calculate hourly payable (total hours × hourly rate derived from daily/monthly)
      calculateHourlyPayable: (workerId, fromDate, toDate) => {
        const worker = get().workers.find((w) => w.id === workerId);
        if (!worker) return 0;
        const records = get().attendance.filter((a) => {
          return a.workerId === workerId && a.date >= fromDate && a.date <= toDate;
        });
        const totalHours = records.reduce((s, a) => s + (a.hoursWorked || 0), 0);
        const overtimeHours = records.reduce((s, a) => s + (a.overtime || 0), 0);
        // derive hourly rate
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
      addAdvance: (data) => {
        const list = get().advances;
        const id = genId("ADV", list);
        const newEntry = {
          ...data,
          id,
          amount: Number(data.amount),
          status: data.status || "pending",
          date: data.date || new Date().toISOString().split("T")[0],
        };
        set({ advances: [newEntry, ...list] });
        return newEntry;
      },

      updateAdvance: (id, data) => {
        set((state) => ({
          advances: state.advances.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }));
      },

      deleteAdvance: (id) => {
        set((state) => ({
          advances: state.advances.filter((a) => a.id !== id),
        }));
      },

      getWorkerAdvances: (workerId) =>
        get()
          .advances.filter((a) => a.workerId === workerId)
          .sort((a, b) => new Date(b.date) - new Date(a.date)),

      /* ── Teams CRUD ────────────────────────────────────────────────────── */
      addTeam: (data) => {
        const list = get().teams;
        const id = genId("TM", list);
        const newTeam = {
          ...data,
          id,
          status: data.status || "Active",
          createdAt: new Date().toISOString().split("T")[0],
          memberIds: data.memberIds || [],
        };
        set({ teams: [...list, newTeam] });
        return newTeam;
      },

      updateTeam: (id, data) => {
        set((state) => ({
          teams: state.teams.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },

      deleteTeam: (id) => {
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== id),
        }));
      },

      getTeam: (id) => get().teams.find((t) => t.id === id),
    }),
    {
      name: "buildtrack-labour-store-v2",
      version: 2,
    }
  )
);

export default useLabourStore;
