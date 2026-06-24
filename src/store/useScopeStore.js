"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const useScopeStore = create((set, get) => ({
  scopes: [],
  loading: false,
  loaded: false,
  error: null,

  fetchScopes: async (force = false) => {
    // If already loaded and not forced, skip fetching
    if (get().loaded && !force) return;
    
    set({ loading: true });
    try {
      const res = await axios.get("/api/scopes");
      set({ scopes: res.data, loaded: true, error: null });
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to fetch scopes";
      set({ error: msg });
      toast.error(msg);
    } finally {
      set({ loading: false });
    }
  },

  addScope: async (scopeData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/scopes", scopeData);
      set((state) => ({
        scopes: [...state.scopes, res.data],
      }));
      toast.success("Scope added to library!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to add scope";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateScope: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/scopes/${id}`, data);
      set((state) => ({
        scopes: state.scopes.map((s) => (s.id === id ? res.data : s)),
      }));
      toast.success("Scope updated successfully!");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update scope";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteScope: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/scopes/${id}`);
      set((state) => ({
        scopes: state.scopes.filter((s) => s.id !== id),
      }));
      toast.success("Scope removed from library!");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete scope";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
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
}));

export default useScopeStore;
