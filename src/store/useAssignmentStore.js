"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  Assignment levels:
    "project" — one total qty for the whole project (distributed across units/phases as a pool)
    "phase"   — qty per phase; per-unit share = phaseQty / phase.units.length
    "unit"    — individual qty per unit/villa
*/

function genId(list) {
  const nums = list
    .map((x) => parseInt((x.id || "ASN-0").replace("ASN-", ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `ASN-${String(max + 1).padStart(3, "0")}`;
}

/* ── ABO YARA seed assignments ───────────────────────────────────────── */
const SEED_ASSIGNMENTS = [
  // ── RAFT SLAB — project level (whole project) ──────────────────────
  {
    id: "ASN-001",
    projectId: "PRJ-001",
    scopeId: "SCO-002",
    scopeName: "Raft / Foundation Slab",
    trade: "Civil & Structural",
    tradeIcon: "🏗️",
    uom: "m³",
    level: "project",                    // whole-project pool
    clientRate: 900,
    subRate: 650,
    assigneeType: "contractor",
    assigneeId: "CON-001",
    assigneeName: "Gulf Build Co.",
    targetDate: "2025-04-30",
    notes: "Raft slab for entire compound",
    totalQty: 480,                       // project-wide qty
    phaseBreakdown: [],
    unitBreakdown: [],
    createdAt: "2025-01-15",
  },

  // ── GROUND SLAB — unit level (different qty per villa) ────────────
  {
    id: "ASN-002",
    projectId: "PRJ-001",
    scopeId: "SCO-002",
    scopeName: "Ground Floor Slab",
    trade: "Civil & Structural",
    tradeIcon: "🏗️",
    uom: "m²",
    level: "unit",
    clientRate: 85,
    subRate: 60,
    assigneeType: "contractor",
    assigneeId: "CON-001",
    assigneeName: "Gulf Build Co.",
    targetDate: "2025-05-15",
    notes: "",
    totalQty: 0, // computed from unitBreakdown
    phaseBreakdown: [],
    unitBreakdown: [
      { unitId: "801", qty: 50, done: 50 },
      { unitId: "804", qty: 48, done: 48 },
      { unitId: "811", qty: 52, done: 52 },
      { unitId: "814", qty: 48, done: 40 },
      { unitId: "817", qty: 50, done: 30 },
      { unitId: "902", qty: 50, done: 50 },
      { unitId: "903", qty: 48, done: 48 },
      { unitId: "911", qty: 50, done: 50 },
      { unitId: "914", qty: 48, done: 20 },
      { unitId: "917", qty: 50, done: 0 },
      { unitId: "925", qty: 45, done: 0 },
      { unitId: "101", qty: 52, done: 0 },
      { unitId: "102", qty: 52, done: 0 },
      { unitId: "103", qty: 50, done: 0 },
      { unitId: "104", qty: 48, done: 0 },
      { unitId: "105", qty: 48, done: 0 },
    ],
    createdAt: "2025-01-20",
  },

  // ── FENCE — phase level ──────────────────────────────────────────
  {
    id: "ASN-003",
    projectId: "PRJ-001",
    scopeId: "SCO-018",
    scopeName: "Boundary Fence & Wall",
    trade: "External Works",
    tradeIcon: "🧱",
    uom: "LM",
    level: "phase",
    clientRate: 250,
    subRate: 180,
    assigneeType: "contractor",
    assigneeId: "CON-001",
    assigneeName: "Gulf Build Co.",
    targetDate: "2025-06-30",
    notes: "Perimeter boundary fence per phase",
    totalQty: 0, // computed
    phaseBreakdown: [
      { phaseId: "PH-A", phaseName: "Phase A", qty: 360, done: 300 },
      { phaseId: "PH-B", phaseName: "Phase B", qty: 420, done: 180 },
      { phaseId: "PH-C", phaseName: "Phase C", qty: 300, done: 0 },
    ],
    unitBreakdown: [],
    createdAt: "2025-02-01",
  },

  // ── ELECTRICAL WIRING — unit level ────────────────────────────────
  {
    id: "ASN-004",
    projectId: "PRJ-001",
    scopeId: "SCO-010",
    scopeName: "Electrical Phase Wiring",
    trade: "MEP – Electrical",
    tradeIcon: "⚡",
    uom: "LM",
    level: "unit",
    clientRate: 350,
    subRate: 250,
    assigneeType: "contractor",
    assigneeId: "CON-002",
    assigneeName: "Al-Farsi Electric",
    targetDate: "2025-08-31",
    notes: "Phase 1,2,3 electrical wiring",
    totalQty: 0,
    phaseBreakdown: [],
    unitBreakdown: [
      { unitId: "801", qty: 150, done: 120 },
      { unitId: "804", qty: 150, done: 150 },
      { unitId: "811", qty: 150, done: 80 },
      { unitId: "814", qty: 130, done: 50 },
      { unitId: "817", qty: 130, done: 0 },
      { unitId: "902", qty: 150, done: 100 },
      { unitId: "903", qty: 150, done: 90 },
      { unitId: "911", qty: 150, done: 150 },
      { unitId: "914", qty: 130, done: 60 },
      { unitId: "917", qty: 130, done: 0 },
      { unitId: "925", qty: 120, done: 0 },
      { unitId: "101", qty: 150, done: 0 },
      { unitId: "102", qty: 150, done: 0 },
      { unitId: "103", qty: 130, done: 0 },
      { unitId: "104", qty: 120, done: 0 },
      { unitId: "105", qty: 120, done: 0 },
    ],
    createdAt: "2025-02-15",
  },

  // ── DB INSTALLATION — unit level (Nos) ───────────────────────────
  {
    id: "ASN-005",
    projectId: "PRJ-001",
    scopeId: "SCO-011",
    scopeName: "DB (Panel) Installation",
    trade: "MEP – Electrical",
    tradeIcon: "⚡",
    uom: "No.",
    level: "unit",
    clientRate: 2800,
    subRate: 2000,
    assigneeType: "contractor",
    assigneeId: "CON-002",
    assigneeName: "Al-Farsi Electric",
    targetDate: "2025-09-30",
    notes: "One main DB per villa",
    totalQty: 0,
    phaseBreakdown: [],
    unitBreakdown: [
      { unitId: "801", qty: 1, done: 1 },
      { unitId: "804", qty: 1, done: 1 },
      { unitId: "811", qty: 1, done: 1 },
      { unitId: "814", qty: 1, done: 1 },
      { unitId: "817", qty: 1, done: 0 },
      { unitId: "902", qty: 1, done: 1 },
      { unitId: "903", qty: 1, done: 1 },
      { unitId: "911", qty: 1, done: 1 },
      { unitId: "914", qty: 1, done: 0 },
      { unitId: "917", qty: 1, done: 0 },
      { unitId: "925", qty: 1, done: 0 },
      { unitId: "101", qty: 1, done: 0 },
      { unitId: "102", qty: 1, done: 0 },
      { unitId: "103", qty: 1, done: 0 },
      { unitId: "104", qty: 1, done: 0 },
      { unitId: "105", qty: 1, done: 0 },
    ],
    createdAt: "2025-03-01",
  },

  // ── FLOORING — project level (pool) ───────────────────────────────
  {
    id: "ASN-006",
    projectId: "PRJ-001",
    scopeId: "SCO-007",
    scopeName: "Tiling & Flooring",
    trade: "Architectural & Finishes",
    tradeIcon: "🎨",
    uom: "m²",
    level: "project",
    clientRate: 80,
    subRate: 55,
    assigneeType: "contractor",
    assigneeId: "CON-003",
    assigneeName: "Al-Nour Finishes",
    targetDate: "2025-11-30",
    notes: "All floor tiling across project",
    totalQty: 1000,
    phaseBreakdown: [],
    unitBreakdown: [],
    createdAt: "2025-03-15",
  },

  // ── FIRST FIX PLUMBING — phase level ─────────────────────────────
  {
    id: "ASN-007",
    projectId: "PRJ-001",
    scopeId: "SCO-013",
    scopeName: "First Fix Plumbing",
    trade: "MEP – Plumbing",
    tradeIcon: "🚰",
    uom: "LM",
    level: "phase",
    clientRate: 120,
    subRate: 85,
    assigneeType: "contractor",
    assigneeId: "CON-004",
    assigneeName: "Gulf Plumbing Co.",
    targetDate: "2025-07-31",
    notes: "Cold & hot water first fix",
    totalQty: 0,
    phaseBreakdown: [
      { phaseId: "PH-A", phaseName: "Phase A", qty: 750, done: 600 },
      { phaseId: "PH-B", phaseName: "Phase B", qty: 900, done: 360 },
      { phaseId: "PH-C", phaseName: "Phase C", qty: 600, done: 0 },
    ],
    unitBreakdown: [],
    createdAt: "2025-03-01",
  },

  // ── CABLES (LV) — project level ───────────────────────────────────
  {
    id: "ASN-008",
    projectId: "PRJ-001",
    scopeId: "SCO-010",
    scopeName: "LV Cable Laying",
    trade: "MEP – Electrical",
    tradeIcon: "⚡",
    uom: "LM",
    level: "project",
    clientRate: 45,
    subRate: 30,
    assigneeType: "team",
    assigneeId: "TEAM-01",
    assigneeName: "Team A (In-house)",
    targetDate: "2025-10-31",
    notes: "Low voltage cable runs",
    totalQty: 5000,
    phaseBreakdown: [],
    unitBreakdown: [],
    createdAt: "2025-04-01",
  },
];

const useAssignmentStore = create(
  persist(
    (set, get) => ({
      assignments: SEED_ASSIGNMENTS,

      /* ── CRUD ───────────────────────────────────────────────────── */
      addAssignment: (data) => {
        const list = get().assignments;
        const id = genId(list);
        // compute totalQty based on level
        let totalQty = data.totalQty || 0;
        if (data.level === "unit" && data.unitBreakdown?.length) {
          totalQty = data.unitBreakdown.reduce((s, u) => s + (u.qty || 0), 0);
        } else if (data.level === "phase" && data.phaseBreakdown?.length) {
          totalQty = data.phaseBreakdown.reduce((s, p) => s + (p.qty || 0), 0);
        }
        const newItem = {
          ...data,
          id,
          totalQty,
          createdAt: new Date().toISOString().split("T")[0],
        };
        set({ assignments: [...list, newItem] });
        return newItem;
      },

      updateAssignment: (id, data) => {
        set((state) => ({
          assignments: state.assignments.map((a) => {
            if (a.id !== id) return a;
            const updated = { ...a, ...data };
            // recompute totalQty
            if (updated.level === "unit" && updated.unitBreakdown?.length) {
              updated.totalQty = updated.unitBreakdown.reduce((s, u) => s + (u.qty || 0), 0);
            } else if (updated.level === "phase" && updated.phaseBreakdown?.length) {
              updated.totalQty = updated.phaseBreakdown.reduce((s, p) => s + (p.qty || 0), 0);
            }
            return updated;
          }),
        }));
      },

      deleteAssignment: (id) => {
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
        }));
      },

      /* ── Update done quantity from a progress log ──────────────── */
      applyProgress: (assignmentId, unitId, phaseId, deltaQty) => {
        set((state) => ({
          assignments: state.assignments.map((a) => {
            if (a.id !== assignmentId) return a;

            if (a.level === "project") {
              // Project-level: no per-unit breakdown needed, doneQty computed from logs
              return a; // handled purely through progressStore aggregation
            }

            if (a.level === "unit" && unitId) {
              const updated = (a.unitBreakdown || []).map((u) =>
                u.unitId === unitId
                  ? { ...u, done: Math.max(0, u.done + deltaQty) }
                  : u
              );
              return { ...a, unitBreakdown: updated };
            }

            if (a.level === "phase" && phaseId) {
              const updated = (a.phaseBreakdown || []).map((p) =>
                p.phaseId === phaseId
                  ? { ...p, done: Math.max(0, p.done + deltaQty) }
                  : p
              );
              return { ...a, phaseBreakdown: updated };
            }

            return a;
          }),
        }));
      },

      /* ── Queries ─────────────────────────────────────────────────── */
      getProjectAssignments: (projectId) =>
        get().assignments.filter((a) => a.projectId === projectId),

      getAssignment: (id) => get().assignments.find((a) => a.id === id),

      /* ── Derived totals ──────────────────────────────────────────── */
      getTotalQty: (a) => {
        if (a.level === "unit" && a.unitBreakdown?.length)
          return a.unitBreakdown.reduce((s, u) => s + (u.qty || 0), 0);
        if (a.level === "phase" && a.phaseBreakdown?.length)
          return a.phaseBreakdown.reduce((s, p) => s + (p.qty || 0), 0);
        return a.totalQty || 0;
      },

      getDoneQty: (a, progressLogs) => {
        // For project-level, sum all logs for this assignment
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

      getUnitDone: (a, unitId) => {
        if (a.level === "unit" && a.unitBreakdown?.length) {
          const row = a.unitBreakdown.find((u) => u.unitId === unitId);
          return row ? row.done : 0;
        }
        return null;
      },

      getUnitQty: (a, unitId) => {
        if (a.level === "unit" && a.unitBreakdown?.length) {
          const row = a.unitBreakdown.find((u) => u.unitId === unitId);
          return row ? row.qty : null;
        }
        return null;
      },
    }),
    {
      name: "buildtrack-assignments-v1",
      version: 1,
    }
  )
);

export default useAssignmentStore;
