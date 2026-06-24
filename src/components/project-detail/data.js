/**
 * projectData.js — Static construction project detail data
 * Think: civil engineer + PM + software engineer
 * Will be made dynamic per-project in the next iteration.
 */

// ─── Phases ─────────────────────────────────────────────────────────────────
export const PHASES = [
  {
    id: "PA", name: "Phase A",
    bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500", border: "border-blue-500/25",
    units: ["A1","A2","A3","A4","A5","A6","A7","A8"],
    floors: ["GF","FF","RF"],
  },
  {
    id: "PB", name: "Phase B",
    bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500", border: "border-purple-500/25",
    units: ["B1","B2","B3","B4","B5"],
    floors: ["GF","FF","RF"],
  },
  {
    id: "PC", name: "Phase C",
    bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500", border: "border-amber-500/25",
    units: ["C1","C2","C3"],
    floors: ["GF","FF"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const pct = (done, total) => (total > 0 ? Math.round((done / total) * 100) : 0);

export function getPhaseForUnit(unitId) {
  return PHASES.find((p) => p.units.includes(unitId));
}

export function statusColor(p) {
  if (p >= 100) return { bar: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Complete",     dot: "bg-emerald-500" };
  if (p >= 75)  return { bar: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",           label: "In Progress", dot: "bg-blue-500"    };
  if (p >= 45)  return { bar: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",       label: "Ongoing",     dot: "bg-amber-500"   };
  return           { bar: "bg-rose-500",     badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",           label: "Behind",      dot: "bg-rose-500"    };
}

function u(unitId, phaseId, qty, done) { return { unitId, phaseId, qty, done }; }

// ─── Scope Assignments ───────────────────────────────────────────────────────
/*
  assignmentLevel:
  - "whole"       — one total qty for the whole project
  - "per-phase"   — qty is split across phases
  - "per-unit"    — each villa/unit has its own qty
  - "per-floor"   — per unit, broken further down by floor level
*/
export const SCOPE_ASSIGNMENTS = [
  // ── Electrical ──────────────────────────────────────────────────────────
  {
    id: "SA-001", trade: "MEP – Electrical", tradeIcon: "⚡",
    tradeBg: "bg-amber-500/10", tradeText: "text-amber-600 dark:text-amber-400",
    scopeName: "Wiring", uom: "LM",
    assignmentLevel: "per-phase",
    assignee: { type: "sub", name: "Al-Farsi Electric" },
    clientRate: 25, subRate: 18,
    totalQty: 9360, doneQty: 7205,
    phaseBreakdown: [
      { phaseId: "PA", phaseName: "Phase A", qty: 5200, done: 4200 },
      { phaseId: "PB", phaseName: "Phase B", qty: 3000, done: 2400 },
      { phaseId: "PC", phaseName: "Phase C", qty: 1160, done:  605 },
    ],
  },
  {
    id: "SA-002", trade: "MEP – Electrical", tradeIcon: "⚡",
    tradeBg: "bg-amber-500/10", tradeText: "text-amber-600 dark:text-amber-400",
    scopeName: "DB Installation", uom: "Nos",
    assignmentLevel: "per-unit",
    assignee: { type: "sub", name: "Al-Farsi Electric" },
    clientRate: 850, subRate: 600,
    totalQty: 16, doneQty: 16,
    unitBreakdown: [
      u("A1","PA",1,1),u("A2","PA",1,1),u("A3","PA",1,1),u("A4","PA",1,1),
      u("A5","PA",1,1),u("A6","PA",1,1),u("A7","PA",1,1),u("A8","PA",1,1),
      u("B1","PB",1,1),u("B2","PB",1,1),u("B3","PB",1,1),u("B4","PB",1,1),u("B5","PB",1,1),
      u("C1","PC",1,1),u("C2","PC",1,1),u("C3","PC",1,1),
    ],
  },

  // ── Plumbing ─────────────────────────────────────────────────────────────
  {
    id: "SA-003", trade: "MEP – Plumbing", tradeIcon: "🚰",
    tradeBg: "bg-cyan-500/10", tradeText: "text-cyan-600 dark:text-cyan-400",
    scopeName: "Water Supply", uom: "LM",
    assignmentLevel: "per-unit",
    assignee: { type: "sub", name: "Gulf Plumbing" },
    clientRate: 35, subRate: 25,
    totalQty: 1280, doneQty: 736,
    unitBreakdown: [
      u("A1","PA",80,80), u("A2","PA",80,80), u("A3","PA",80,80), u("A4","PA",80,80),
      u("A5","PA",80,80), u("A6","PA",80,80), u("A7","PA",80,56), u("A8","PA",80, 0),
      u("B1","PB",80,80), u("B2","PB",80,64), u("B3","PB",80,48), u("B4","PB",80,16), u("B5","PB",80, 0),
      u("C1","PC",80, 0), u("C2","PC",80, 0), u("C3","PC",80, 0),
    ],
  },

  // ── Civil ─────────────────────────────────────────────────────────────────
  {
    id: "SA-004", trade: "Civil & Structural", tradeIcon: "🏗️",
    tradeBg: "bg-blue-500/10", tradeText: "text-blue-600 dark:text-blue-400",
    scopeName: "Block Work", uom: "m²",
    assignmentLevel: "per-floor",
    assignee: { type: "team", name: "Team Alpha" },
    clientRate: 45, subRate: null,
    totalQty: 13800, doneQty: 7590,
    // floors: GF=350, FF=350, RF=200 (Phase C has no RF → GF+FF=700)
    unitBreakdown: [
      { unitId:"A1", phaseId:"PA", qty:900, done:900, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:350}, RF:{qty:200,done:200} } },
      { unitId:"A2", phaseId:"PA", qty:900, done:900, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:350}, RF:{qty:200,done:200} } },
      { unitId:"A3", phaseId:"PA", qty:900, done:700, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:350}, RF:{qty:200,done:0}   } },
      { unitId:"A4", phaseId:"PA", qty:900, done:630, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:280}, RF:{qty:200,done:0}   } },
      { unitId:"A5", phaseId:"PA", qty:900, done:490, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:140}, RF:{qty:200,done:0}   } },
      { unitId:"A6", phaseId:"PA", qty:900, done:350, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:0},   RF:{qty:200,done:0}   } },
      { unitId:"A7", phaseId:"PA", qty:900, done:210, floors:{ GF:{qty:350,done:210}, FF:{qty:350,done:0},   RF:{qty:200,done:0}   } },
      { unitId:"A8", phaseId:"PA", qty:900, done:0,   floors:{ GF:{qty:350,done:0},   FF:{qty:350,done:0},   RF:{qty:200,done:0}   } },
      { unitId:"B1", phaseId:"PB", qty:900, done:700, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:350}, RF:{qty:200,done:0}   } },
      { unitId:"B2", phaseId:"PB", qty:900, done:560, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:210}, RF:{qty:200,done:0}   } },
      { unitId:"B3", phaseId:"PB", qty:900, done:350, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:0},   RF:{qty:200,done:0}   } },
      { unitId:"B4", phaseId:"PB", qty:900, done:210, floors:{ GF:{qty:350,done:210}, FF:{qty:350,done:0},   RF:{qty:200,done:0}   } },
      { unitId:"B5", phaseId:"PB", qty:900, done:140, floors:{ GF:{qty:350,done:140}, FF:{qty:350,done:0},   RF:{qty:200,done:0}   } },
      { unitId:"C1", phaseId:"PC", qty:700, done:700, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:350} } },
      { unitId:"C2", phaseId:"PC", qty:700, done:490, floors:{ GF:{qty:350,done:350}, FF:{qty:350,done:140} } },
      { unitId:"C3", phaseId:"PC", qty:700, done:280, floors:{ GF:{qty:350,done:280}, FF:{qty:350,done:0}   } },
    ],
  },

  // ── Architectural ─────────────────────────────────────────────────────────
  {
    id: "SA-005", trade: "Architectural & Finishes", tradeIcon: "🎨",
    tradeBg: "bg-purple-500/10", tradeText: "text-purple-600 dark:text-purple-400",
    scopeName: "Internal Plastering", uom: "m²",
    assignmentLevel: "per-unit",
    assignee: { type: "sub", name: "Al-Nour Finishes" },
    clientRate: 28, subRate: 22,
    totalQty: 24000, doneQty: 14880,
    unitBreakdown: [
      u("A1","PA",1500,1500), u("A2","PA",1500,1500), u("A3","PA",1500,1350), u("A4","PA",1500,1200),
      u("A5","PA",1500,1050), u("A6","PA",1500, 900), u("A7","PA",1500, 750), u("A8","PA",1500, 600),
      u("B1","PB",1500,1200), u("B2","PB",1500, 960), u("B3","PB",1500, 750), u("B4","PB",1500, 540), u("B5","PB",1500, 360),
      u("C1","PC",1500, 900), u("C2","PC",1500, 720), u("C3","PC",1500, 600),
    ],
  },
  {
    id: "SA-006", trade: "Architectural & Finishes", tradeIcon: "🎨",
    tradeBg: "bg-purple-500/10", tradeText: "text-purple-600 dark:text-purple-400",
    scopeName: "Painting", uom: "m²",
    assignmentLevel: "per-unit",
    assignee: { type: "sub", name: "Al-Nour Finishes" },
    clientRate: 22, subRate: 16,
    totalQty: 24000, doneQty: 6720,
    unitBreakdown: [
      u("A1","PA",1500, 900), u("A2","PA",1500, 825), u("A3","PA",1500, 750), u("A4","PA",1500, 675),
      u("A5","PA",1500, 450), u("A6","PA",1500, 300), u("A7","PA",1500, 150), u("A8","PA",1500,   0),
      u("B1","PB",1500, 450), u("B2","PB",1500, 300), u("B3","PB",1500, 120), u("B4","PB",1500,   0), u("B5","PB",1500, 0),
      u("C1","PC",1500,   0), u("C2","PC",1500,   0), u("C3","PC",1500,   0),
    ],
  },
];

// ─── Grouping ────────────────────────────────────────────────────────────────
export function getScopesByTrade() {
  return SCOPE_ASSIGNMENTS.reduce((acc, s) => {
    if (!acc[s.trade]) acc[s.trade] = { icon: s.tradeIcon, bg: s.tradeBg, text: s.tradeText, scopes: [] };
    acc[s.trade].scopes.push(s);
    return acc;
  }, {});
}

// ─── Per-unit overall completion (weighted average of scopes with unit-level data) ──
export function getUnitOverallPct(unitId) {
  let totalQty = 0, totalDone = 0;
  SCOPE_ASSIGNMENTS.forEach((scope) => {
    if (scope.unitBreakdown) {
      const row = scope.unitBreakdown.find((u) => u.unitId === unitId);
      if (row) { totalQty += row.qty; totalDone += row.done; }
    } else if (scope.phaseBreakdown) {
      const phase = getPhaseForUnit(unitId);
      if (phase) {
        const phRow = scope.phaseBreakdown.find((p) => p.phaseId === phase.id);
        if (phRow) {
          const unitCount = phase.units.length;
          totalQty  += Math.round(phRow.qty  / unitCount);
          totalDone += Math.round(phRow.done / unitCount);
        }
      }
    }
  });
  return pct(totalDone, totalQty);
}

// ─── Alerts (auto-generated) ─────────────────────────────────────────────────
export function generateAlerts() {
  const alerts = [];
  SCOPE_ASSIGNMENTS.forEach((s) => {
    const p = pct(s.doneQty, s.totalQty);
    if (p < 35)
      alerts.push({ level: "critical", icon: "🔴", trade: s.trade, message: `${s.scopeName} at ${p}% — risk of delay on handover dates` });
    else if (p < 55)
      alerts.push({ level: "warning",  icon: "🟡", trade: s.trade, message: `${s.scopeName} at ${p}% with limited time remaining — monitor weekly` });
  });
  // Check stalled units (0% painting in Phase A while avg > 40%)
  const paintScope = SCOPE_ASSIGNMENTS.find((s) => s.scopeName === "Painting");
  if (paintScope?.unitBreakdown) {
    const stalledInPA = paintScope.unitBreakdown.filter((u) => u.phaseId === "PA" && u.done === 0);
    if (stalledInPA.length > 0)
      alerts.push({ level: "info", icon: "🔵", trade: "Architectural & Finishes", message: `${stalledInPA.map(u=>u.unitId).join(", ")} — Painting not started, Phase A is 60% complete` });
  }
  return alerts;
}

// ─── Financial summary ────────────────────────────────────────────────────────
export function getFinancialSummary() {
  let contractValue = 0, subCost = 0;
  SCOPE_ASSIGNMENTS.forEach((s) => {
    contractValue += s.totalQty * s.clientRate;
    if (s.subRate) subCost += s.totalQty * s.subRate;
  });
  return {
    contractValue,
    subCost,
    grossMargin: contractValue - subCost,
    marginPct: Math.round(((contractValue - subCost) / contractValue) * 100),
  };
}
