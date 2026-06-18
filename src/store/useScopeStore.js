"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ─── Seed data: pre-built scope library ─────────────────────────── */
const SEED_SCOPES = [
  {
    id: "SCO-001",
    trade: "Civil & Structural",
    name: "Excavation & Earthworks",
    uom: "m³",
    subScopes: [
      { id: "SS-001-1", name: "Bulk Excavation", uom: "m³" },
      { id: "SS-001-2", name: "Trench Excavation", uom: "m³" },
      { id: "SS-001-3", name: "Backfilling & Compaction", uom: "m³" },
      { id: "SS-001-4", name: "Disposal of Surplus Material", uom: "m³" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-002",
    trade: "Civil & Structural",
    name: "Concrete Works",
    uom: "m³",
    subScopes: [
      { id: "SS-002-1", name: "Foundations (Raft / Pad / Strip)", uom: "m³" },
      { id: "SS-002-2", name: "Columns", uom: "m³" },
      { id: "SS-002-3", name: "Beams & Slabs", uom: "m³" },
      { id: "SS-002-4", name: "Retaining Walls", uom: "m³" },
      { id: "SS-002-5", name: "Staircases", uom: "m³" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-003",
    trade: "Civil & Structural",
    name: "Reinforcement Steel",
    uom: "ton",
    subScopes: [
      { id: "SS-003-1", name: "Foundation Rebar", uom: "ton" },
      { id: "SS-003-2", name: "Column Rebar", uom: "ton" },
      { id: "SS-003-3", name: "Slab Rebar", uom: "ton" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-004",
    trade: "Civil & Structural",
    name: "Formwork",
    uom: "m²",
    subScopes: [
      { id: "SS-004-1", name: "Slab Formwork", uom: "m²" },
      { id: "SS-004-2", name: "Column Formwork", uom: "m²" },
      { id: "SS-004-3", name: "Beam Formwork", uom: "m²" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-005",
    trade: "Civil & Structural",
    name: "Block Work & Masonry",
    uom: "m²",
    subScopes: [
      { id: "SS-005-1", name: "External Block Walls", uom: "m²" },
      { id: "SS-005-2", name: "Internal Partition Walls", uom: "m²" },
      { id: "SS-005-3", name: "Parapet Walls", uom: "m²" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-006",
    trade: "Architectural & Finishes",
    name: "Plastering & Rendering",
    uom: "m²",
    subScopes: [
      { id: "SS-006-1", name: "Internal Plastering", uom: "m²" },
      { id: "SS-006-2", name: "External Rendering", uom: "m²" },
      { id: "SS-006-3", name: "Ceiling Plastering", uom: "m²" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-007",
    trade: "Architectural & Finishes",
    name: "Tiling & Stone Cladding",
    uom: "m²",
    subScopes: [
      { id: "SS-007-1", name: "Floor Tiling", uom: "m²" },
      { id: "SS-007-2", name: "Wall Tiling", uom: "m²" },
      { id: "SS-007-3", name: "External Stone Cladding", uom: "m²" },
      { id: "SS-007-4", name: "Marble / Granite Works", uom: "m²" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-008",
    trade: "Architectural & Finishes",
    name: "Painting & Coating",
    uom: "m²",
    subScopes: [
      { id: "SS-008-1", name: "Internal Painting", uom: "m²" },
      { id: "SS-008-2", name: "External Painting", uom: "m²" },
      { id: "SS-008-3", name: "Waterproof Coating", uom: "m²" },
      { id: "SS-008-4", name: "Anti-Carbonation Coating", uom: "m²" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-009",
    trade: "Architectural & Finishes",
    name: "Doors & Windows",
    uom: "No.",
    subScopes: [
      { id: "SS-009-1", name: "Aluminum Windows", uom: "No." },
      { id: "SS-009-2", name: "Aluminum Doors", uom: "No." },
      { id: "SS-009-3", name: "Timber Internal Doors", uom: "No." },
      { id: "SS-009-4", name: "Fire Rated Doors", uom: "No." },
      { id: "SS-009-5", name: "Roller Shutters", uom: "No." },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-010",
    trade: "MEP – Electrical",
    name: "Wiring & Cabling",
    uom: "LM",
    subScopes: [
      { id: "SS-010-1", name: "Power Cabling", uom: "LM" },
      { id: "SS-010-2", name: "Lighting Cabling", uom: "LM" },
      { id: "SS-010-3", name: "Data & Communication Cabling", uom: "LM" },
      { id: "SS-010-4", name: "Earthing & Bonding", uom: "LM" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-011",
    trade: "MEP – Electrical",
    name: "DB Installations",
    uom: "No.",
    subScopes: [
      { id: "SS-011-1", name: "Main Distribution Board (MDB)", uom: "No." },
      { id: "SS-011-2", name: "Sub Distribution Board (SDB)", uom: "No." },
      { id: "SS-011-3", name: "Final Distribution Board (FDB)", uom: "No." },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-012",
    trade: "MEP – Electrical",
    name: "Light Fittings",
    uom: "No.",
    subScopes: [
      { id: "SS-012-1", name: "Ceiling Downlights", uom: "No." },
      { id: "SS-012-2", name: "LED Strip Lighting", uom: "LM" },
      { id: "SS-012-3", name: "External Floodlights", uom: "No." },
      { id: "SS-012-4", name: "Emergency Lighting", uom: "No." },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-013",
    trade: "MEP – Plumbing",
    name: "Water Supply System",
    uom: "LM",
    subScopes: [
      { id: "SS-013-1", name: "Cold Water Piping", uom: "LM" },
      { id: "SS-013-2", name: "Hot Water Piping", uom: "LM" },
      { id: "SS-013-3", name: "Overhead Water Tank", uom: "No." },
      { id: "SS-013-4", name: "Underground Water Tank", uom: "m³" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-014",
    trade: "MEP – Plumbing",
    name: "Drainage & Sanitation",
    uom: "LM",
    subScopes: [
      { id: "SS-014-1", name: "Soil & Waste Piping", uom: "LM" },
      { id: "SS-014-2", name: "Stormwater Drainage", uom: "LM" },
      { id: "SS-014-3", name: "Manhole Construction", uom: "No." },
      { id: "SS-014-4", name: "Grease Trap", uom: "No." },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-015",
    trade: "MEP – Mechanical (HVAC)",
    name: "HVAC System",
    uom: "No.",
    subScopes: [
      { id: "SS-015-1", name: "Split AC Units", uom: "No." },
      { id: "SS-015-2", name: "Ducted HVAC", uom: "LM" },
      { id: "SS-015-3", name: "Chiller Plant", uom: "No." },
      { id: "SS-015-4", name: "AHU / FCU Installation", uom: "No." },
      { id: "SS-015-5", name: "Ductwork", uom: "m²" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-016",
    trade: "MEP – Fire Fighting",
    name: "Fire Fighting System",
    uom: "No.",
    subScopes: [
      { id: "SS-016-1", name: "Sprinkler System", uom: "No." },
      { id: "SS-016-2", name: "Fire Hose Reels", uom: "No." },
      { id: "SS-016-3", name: "Fire Extinguishers", uom: "No." },
      { id: "SS-016-4", name: "Fire Alarm System", uom: "LS" },
      { id: "SS-016-5", name: "Fire Suppression Piping", uom: "LM" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-017",
    trade: "External Works",
    name: "Roads & Paving",
    uom: "m²",
    subScopes: [
      { id: "SS-017-1", name: "Asphalt Paving", uom: "m²" },
      { id: "SS-017-2", name: "Interlocking Pavers", uom: "m²" },
      { id: "SS-017-3", name: "Kerb & Channel", uom: "LM" },
      { id: "SS-017-4", name: "Road Markings", uom: "m²" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-018",
    trade: "External Works",
    name: "Landscaping",
    uom: "m²",
    subScopes: [
      { id: "SS-018-1", name: "Soft Landscaping (Turf / Planting)", uom: "m²" },
      { id: "SS-018-2", name: "Irrigation System", uom: "LS" },
      { id: "SS-018-3", name: "Hardscape / Paving", uom: "m²" },
      { id: "SS-018-4", name: "Boundary Walls & Fencing", uom: "LM" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-019",
    trade: "Facade & Envelope",
    name: "Facade Systems",
    uom: "m²",
    subScopes: [
      { id: "SS-019-1", name: "Curtain Wall System", uom: "m²" },
      { id: "SS-019-2", name: "ACP Cladding", uom: "m²" },
      { id: "SS-019-3", name: "EIFS / Insulated Render", uom: "m²" },
      { id: "SS-019-4", name: "GRC Panels", uom: "m²" },
    ],
    createdAt: "2025-01-01",
  },
  {
    id: "SCO-020",
    trade: "Preliminaries",
    name: "Temporary Works & Mobilisation",
    uom: "LS",
    subScopes: [
      { id: "SS-020-1", name: "Site Setup & Hoarding", uom: "LS" },
      { id: "SS-020-2", name: "Scaffolding", uom: "m²" },
      { id: "SS-020-3", name: "Site Offices & Welfare", uom: "LS" },
      { id: "SS-020-4", name: "Site Clearance", uom: "LS" },
      { id: "SS-020-5", name: "Temporary Power & Water", uom: "LS" },
    ],
    createdAt: "2025-01-01",
  },
];

function generateId(scopes) {
  const nums = scopes
    .map((s) => parseInt(s.id.replace("SCO-", ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `SCO-${String(max + 1).padStart(3, "0")}`;
}

function generateSubId(subScopes) {
  if (!subScopes || subScopes.length === 0) return `SS-${Date.now()}-1`;
  return `SS-${Date.now()}-${subScopes.length + 1}`;
}

const useScopeStore = create(
  persist(
    (set, get) => ({
      scopes: SEED_SCOPES,

      addScope: (scopeData) => {
        const scopes = get().scopes;
        const id = generateId(scopes);
        const newScope = {
          ...scopeData,
          id,
          subScopes: (scopeData.subScopes || []).map((ss, i) => ({
            ...ss,
            id: `${id}-SS${i + 1}`,
          })),
          createdAt: new Date().toISOString().split("T")[0],
        };
        set({ scopes: [...scopes, newScope] });
        return newScope;
      },

      updateScope: (id, data) => {
        set((state) => ({
          scopes: state.scopes.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },

      deleteScope: (id) => {
        set((state) => ({ scopes: state.scopes.filter((s) => s.id !== id) }));
      },

      getScope: (id) => get().scopes.find((s) => s.id === id),

      getScopesByTrade: () => {
        const scopes = get().scopes;
        return scopes.reduce((acc, scope) => {
          if (!acc[scope.trade]) acc[scope.trade] = [];
          acc[scope.trade].push(scope);
          return acc;
        }, {});
      },
    }),
    {
      name: "buildtrack-scopes",
      version: 1,
    }
  )
);

export default useScopeStore;
