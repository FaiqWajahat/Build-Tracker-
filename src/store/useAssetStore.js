"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const SEED_ASSETS = [
  { id: "AST-001", name: "Tower Crane #1 (Liebherr)", category: "Heavy Crane", projectId: "PRJ-001", operatorId: "WRK-001", expectedReturnDate: "2026-12-31", status: "In Use", notes: "" },
  { id: "AST-002", name: "Excavator CAT 320", category: "Excavator", projectId: "PRJ-001", operatorId: "WRK-002", expectedReturnDate: "2026-06-15", status: "In Use", notes: "Needed urgently at another site after this date." }, // Overdue
  { id: "AST-003", name: "Mobile Lift Crane", category: "Heavy Crane", projectId: "", operatorId: "WRK-003", expectedReturnDate: "", status: "Idle", notes: "" },
  { id: "AST-004", name: "Generator Unit 100kVA", category: "Power Utility", projectId: "PRJ-002", operatorId: "", expectedReturnDate: "2026-08-20", status: "In Use", notes: "" },
  { id: "AST-005", name: "Scaffolding Set C-4", category: "Scaffolding", projectId: "PRJ-001", operatorId: "", expectedReturnDate: "2026-09-30", status: "In Use", notes: "" },
  { id: "AST-006", name: "Tipper Truck #3", category: "Vehicle", projectId: "", operatorId: "WRK-004", expectedReturnDate: "", status: "Under Maintenance", notes: "Engine overhaul" },
  { id: "AST-007", name: "Excavator Volvo 210", category: "Excavator", projectId: "", operatorId: "", expectedReturnDate: "", status: "Idle", notes: "" }
];

export const ASSET_CATEGORIES = [
  "Heavy Crane", "Excavator", "Power Utility", "Scaffolding", "Vehicle", "Tools", "Other"
];

export const ASSET_STATUSES = [
  "In Use", "Idle", "Inspection Due", "Under Maintenance"
];

const useAssetStore = create(
  persist(
    (set, get) => ({
      assets: SEED_ASSETS,

      addAsset: (assetData) => set((state) => {
        const counts = state.assets.map(a => parseInt(a.id.replace("AST-", "")) || 0);
        const maxId = counts.length > 0 ? Math.max(...counts) : 0;
        const newId = `AST-${String(maxId + 1).padStart(3, "0")}`;

        const newAsset = {
          id: newId,
          ...assetData,
          createdAt: new Date().toISOString(),
        };

        return { assets: [newAsset, ...state.assets] };
      }),

      updateAsset: (id, updates) => set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)),
      })),

      deleteAsset: (id) => set((state) => ({
        assets: state.assets.filter((a) => a.id !== id),
      })),

      getAssetsByProject: (projectId) => get().assets.filter(a => a.projectId === projectId),
    }),
    {
      name: "buildtrack-asset-storage-v2", // changed name so it resets the persist state for the new schema
    }
  )
);

export default useAssetStore;
