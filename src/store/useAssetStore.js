"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

export const ASSET_CATEGORIES = [
  "Heavy Crane", "Excavator", "Power Utility", "Scaffolding", "Vehicle", "Tools", "Other"
];

export const ASSET_STATUSES = [
  "In Use", "Idle", "Inspection Due", "Under Maintenance"
];

const useAssetStore = create((set, get) => ({
  assets: [],
  loading: false,
  loaded: false,

  fetchAssetData: async () => {
    if (get().loaded) return;
    set({ loading: true });
    try {
      const response = await axios.get("/api/assets");
      set({ assets: response.data, loaded: true });
    } catch (error) {
      console.error("fetchAssetData error:", error);
      toast.error("Failed to load asset registry");
    } finally {
      set({ loading: false });
    }
  },

  addAsset: async (assetData) => {
    set({ loading: true });
    try {
      const response = await axios.post("/api/assets", assetData);
      const newItem = response.data;
      set((state) => ({ assets: [newItem, ...state.assets] }));
      toast.success("Asset registered successfully");
      return newItem;
    } catch (error) {
      console.error("addAsset error:", error);
      const errMsg = error.response?.data?.error || "Failed to register asset";
      toast.error(errMsg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateAsset: async (id, updates) => {
    set({ loading: true });
    try {
      const response = await axios.put(`/api/assets/${id}`, updates);
      const updatedItem = response.data;
      set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? updatedItem : a)),
      }));
      toast.success("Asset details updated");
      return updatedItem;
    } catch (error) {
      console.error("updateAsset error:", error);
      const errMsg = error.response?.data?.error || "Failed to update asset";
      toast.error(errMsg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteAsset: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/assets/${id}`);
      set((state) => ({
        assets: state.assets.filter((a) => a.id !== id),
      }));
      toast.success("Asset removed from registry");
    } catch (error) {
      console.error("deleteAsset error:", error);
      toast.error("Failed to delete asset");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getAssetsByProject: (projectId) => {
    return get().assets.filter((a) => a.projectId === projectId);
  },
}));

export default useAssetStore;
