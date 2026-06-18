"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

function genId(list) {
  const nums = list
    .map((x) => parseInt((x.id || "LOG-0").replace("LOG-", ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `LOG-${String(max + 1).padStart(4, "0")}`;
}

/* ── Seed progress logs for PRJ-001 (ABO YARA) ───────────────────────── */
const today = new Date().toISOString().split("T")[0];
const d = (daysAgo) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString().split("T")[0];
};

const SEED_LOGS = [
  // ── ASN-002: Ground Floor Slab (unit-level, m²) ──────────────────
  { id:"LOG-0001", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"801", phaseId:"PH-A", scopeName:"Ground Floor Slab", uom:"m²", date:d(20), qtyCompleted:15, rate:85, amountEarned:1275, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Day 1 pour GF slab", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0002", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"801", phaseId:"PH-A", scopeName:"Ground Floor Slab", uom:"m²", date:d(17), qtyCompleted:20, rate:85, amountEarned:1700, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Continue slab pour", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0003", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"801", phaseId:"PH-A", scopeName:"Ground Floor Slab", uom:"m²", date:d(14), qtyCompleted:15, rate:85, amountEarned:1275, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Completed slab 801", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0004", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"804", phaseId:"PH-A", scopeName:"Ground Floor Slab", uom:"m²", date:d(18), qtyCompleted:48, rate:85, amountEarned:4080, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"804 slab done in one pour", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0005", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"811", phaseId:"PH-A", scopeName:"Ground Floor Slab", uom:"m²", date:d(16), qtyCompleted:52, rate:85, amountEarned:4420, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"811 complete", signedBy:"QA Manager", status:"Approved", editHistory:[] },
  { id:"LOG-0006", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"814", phaseId:"PH-A", scopeName:"Ground Floor Slab", uom:"m²", date:d(10), qtyCompleted:40, rate:85, amountEarned:3400, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Partial pour 814", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0007", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"817", phaseId:"PH-A", scopeName:"Ground Floor Slab", uom:"m²", date:d(8), qtyCompleted:30, rate:85, amountEarned:2550, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Ongoing", signedBy:"Site Engineer", status:"Under Review", editHistory:[] },
  { id:"LOG-0008", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"902", phaseId:"PH-B", scopeName:"Ground Floor Slab", uom:"m²", date:d(12), qtyCompleted:50, rate:85, amountEarned:4250, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Phase B start", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0009", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"903", phaseId:"PH-B", scopeName:"Ground Floor Slab", uom:"m²", date:d(11), qtyCompleted:48, rate:85, amountEarned:4080, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0010", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"911", phaseId:"PH-B", scopeName:"Ground Floor Slab", uom:"m²", date:d(9), qtyCompleted:50, rate:85, amountEarned:4250, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0011", projectId:"PRJ-001", assignmentId:"ASN-002", unitId:"914", phaseId:"PH-B", scopeName:"Ground Floor Slab", uom:"m²", date:d(5), qtyCompleted:20, rate:85, amountEarned:1700, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Partial", signedBy:"Site Engineer", status:"Under Review", editHistory:[] },

  // ── ASN-004: Electrical Phase Wiring (unit-level, LM) ────────────
  { id:"LOG-0012", projectId:"PRJ-001", assignmentId:"ASN-004", unitId:"801", phaseId:"PH-A", scopeName:"Electrical Phase Wiring", uom:"LM", date:d(15), qtyCompleted:80, rate:350, amountEarned:28000, assigneeType:"contractor", assigneeName:"Al-Farsi Electric", notes:"GF wiring 801", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0013", projectId:"PRJ-001", assignmentId:"ASN-004", unitId:"801", phaseId:"PH-A", scopeName:"Electrical Phase Wiring", uom:"LM", date:d(10), qtyCompleted:40, rate:350, amountEarned:14000, assigneeType:"contractor", assigneeName:"Al-Farsi Electric", notes:"FF wiring 801", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0014", projectId:"PRJ-001", assignmentId:"ASN-004", unitId:"804", phaseId:"PH-A", scopeName:"Electrical Phase Wiring", uom:"LM", date:d(13), qtyCompleted:150, rate:350, amountEarned:52500, assigneeType:"contractor", assigneeName:"Al-Farsi Electric", notes:"Complete 804", signedBy:"QA Manager", status:"Approved", editHistory:[] },
  { id:"LOG-0015", projectId:"PRJ-001", assignmentId:"ASN-004", unitId:"811", phaseId:"PH-A", scopeName:"Electrical Phase Wiring", uom:"LM", date:d(7), qtyCompleted:80, rate:350, amountEarned:28000, assigneeType:"contractor", assigneeName:"Al-Farsi Electric", notes:"Partial", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0016", projectId:"PRJ-001", assignmentId:"ASN-004", unitId:"902", phaseId:"PH-B", scopeName:"Electrical Phase Wiring", uom:"LM", date:d(6), qtyCompleted:100, rate:350, amountEarned:35000, assigneeType:"contractor", assigneeName:"Al-Farsi Electric", notes:"Phase B electrical start", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0017", projectId:"PRJ-001", assignmentId:"ASN-004", unitId:"911", phaseId:"PH-B", scopeName:"Electrical Phase Wiring", uom:"LM", date:d(4), qtyCompleted:150, rate:350, amountEarned:52500, assigneeType:"contractor", assigneeName:"Al-Farsi Electric", notes:"Complete 911", signedBy:"QA Manager", status:"Approved", editHistory:[] },

  // ── ASN-006: Flooring (project-level, m²) ─────────────────────────
  { id:"LOG-0018", projectId:"PRJ-001", assignmentId:"ASN-006", unitId:"801", phaseId:"PH-A", scopeName:"Tiling & Flooring", uom:"m²", date:d(8), qtyCompleted:62, rate:80, amountEarned:4960, assigneeType:"contractor", assigneeName:"Al-Nour Finishes", notes:"801 tiling complete", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0019", projectId:"PRJ-001", assignmentId:"ASN-006", unitId:"804", phaseId:"PH-A", scopeName:"Tiling & Flooring", uom:"m²", date:d(7), qtyCompleted:62, rate:80, amountEarned:4960, assigneeType:"contractor", assigneeName:"Al-Nour Finishes", notes:"804 tiling complete", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0020", projectId:"PRJ-001", assignmentId:"ASN-006", unitId:"902", phaseId:"PH-B", scopeName:"Tiling & Flooring", uom:"m²", date:d(5), qtyCompleted:62, rate:80, amountEarned:4960, assigneeType:"contractor", assigneeName:"Al-Nour Finishes", notes:"Phase B floor start", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0021", projectId:"PRJ-001", assignmentId:"ASN-006", unitId:"903", phaseId:"PH-B", scopeName:"Tiling & Flooring", uom:"m²", date:d(3), qtyCompleted:40, rate:80, amountEarned:3200, assigneeType:"contractor", assigneeName:"Al-Nour Finishes", notes:"Partial 903", signedBy:"Site Engineer", status:"Under Review", editHistory:[] },

  // ── ASN-001: Raft Slab (project-level, m³) ────────────────────────
  { id:"LOG-0022", projectId:"PRJ-001", assignmentId:"ASN-001", unitId:null, phaseId:null, scopeName:"Raft / Foundation Slab", uom:"m³", date:d(30), qtyCompleted:120, rate:900, amountEarned:108000, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"North section raft pour", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0023", projectId:"PRJ-001", assignmentId:"ASN-001", unitId:null, phaseId:null, scopeName:"Raft / Foundation Slab", uom:"m³", date:d(25), qtyCompleted:160, rate:900, amountEarned:144000, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Central section", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0024", projectId:"PRJ-001", assignmentId:"ASN-001", unitId:null, phaseId:null, scopeName:"Raft / Foundation Slab", uom:"m³", date:d(20), qtyCompleted:120, rate:900, amountEarned:108000, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"South section", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0025", projectId:"PRJ-001", assignmentId:"ASN-001", unitId:null, phaseId:null, scopeName:"Raft / Foundation Slab", uom:"m³", date:d(15), qtyCompleted:80, rate:900, amountEarned:72000, assigneeType:"contractor", assigneeName:"Gulf Build Co.", notes:"Final pour", signedBy:"QA Manager", status:"Approved", editHistory:[] },

  // ── ASN-008: LV Cable (project-level, LM) ─────────────────────────
  { id:"LOG-0026", projectId:"PRJ-001", assignmentId:"ASN-008", unitId:null, phaseId:null, scopeName:"LV Cable Laying", uom:"LM", date:d(10), qtyCompleted:800, rate:45, amountEarned:36000, assigneeType:"team", assigneeName:"Team A (In-house)", notes:"Main LV runs Phase A", signedBy:"Site Engineer", status:"Approved", editHistory:[] },
  { id:"LOG-0027", projectId:"PRJ-001", assignmentId:"ASN-008", unitId:null, phaseId:null, scopeName:"LV Cable Laying", uom:"LM", date:d(5), qtyCompleted:600, rate:45, amountEarned:27000, assigneeType:"team", assigneeName:"Team A (In-house)", notes:"Phase B main cable", signedBy:"Site Engineer", status:"Under Review", editHistory:[] },
];

const useProgressStore = create(
  persist(
    (set, get) => ({
      logs: SEED_LOGS,

      /* ── CRUD ───────────────────────────────────────────────────── */
      addLog: (data) => {
        const list = get().logs;
        const id = genId(list);
        const newLog = {
          ...data,
          id,
          amountEarned: (data.qtyCompleted || 0) * (data.rate || 0),
          status: data.status || "Under Review",
          editHistory: [],
          createdAt: new Date().toISOString(),
        };
        set({ logs: [newLog, ...list] });
        return newLog;
      },

      updateLog: (id, data) => {
        set((state) => ({
          logs: state.logs.map((l) => {
            if (l.id !== id) return l;
            const updated = {
              ...l,
              ...data,
              amountEarned: (data.qtyCompleted ?? l.qtyCompleted) * (data.rate ?? l.rate),
              editHistory: [
                ...(l.editHistory || []),
                { editedAt: new Date().toISOString(), before: { qtyCompleted: l.qtyCompleted, notes: l.notes } },
              ],
            };
            return updated;
          }),
        }));
      },

      approveLog: (id) => {
        set((state) => ({
          logs: state.logs.map((l) =>
            l.id === id ? { ...l, status: "Approved" } : l
          ),
        }));
      },

      deleteLog: (id) => {
        set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));
      },

      /* ── Queries ─────────────────────────────────────────────────── */
      getLogsForProject: (projectId) =>
        get().logs.filter((l) => l.projectId === projectId),

      getLogsForAssignment: (assignmentId) =>
        get().logs.filter((l) => l.assignmentId === assignmentId),

      getLogsForUnit: (projectId, unitId) =>
        get().logs.filter(
          (l) => l.projectId === projectId && l.unitId === unitId
        ),

      // Running total completed qty for an assignment (+optionally filtered by unit)
      getRunningTotal: (assignmentId, unitId = null) => {
        const logs = get().logs.filter(
          (l) =>
            l.assignmentId === assignmentId &&
            (unitId === null || l.unitId === unitId)
        );
        return logs.reduce((s, l) => s + (l.qtyCompleted || 0), 0);
      },

      // Previous total before a given date
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

      // Earned value for an assignment
      getEarnedValue: (assignmentId) => {
        return get()
          .logs.filter((l) => l.assignmentId === assignmentId)
          .reduce((s, l) => s + (l.amountEarned || 0), 0);
      },

      // Logs grouped by date for a project
      getLogsByDate: (projectId) => {
        const logs = get().logs.filter((l) => l.projectId === projectId);
        return logs.reduce((acc, l) => {
          if (!acc[l.date]) acc[l.date] = [];
          acc[l.date].push(l);
          return acc;
        }, {});
      },
    }),
    {
      name: "buildtrack-progress-v1",
      version: 1,
    }
  )
);

export default useProgressStore;
