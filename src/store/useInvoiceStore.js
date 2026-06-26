"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const useInvoiceStore = create((set, get) => ({
  invoices: [],
  loading: false,
  loaded: false,
  error: null,

  /* ── Fetch invoices ──────────────────────────────────────── */
  fetchInvoices: async (projectId = null, force = false) => {
    if (get().loaded && !force && !projectId) return;
    set({ loading: true });
    try {
      const url = projectId
        ? `/api/invoices?projectId=${projectId}`
        : "/api/invoices";
      const res = await axios.get(url);
      set({ invoices: res.data, loaded: true, error: null });
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load invoices";
      set({ error: msg });
      toast.error(msg);
    } finally {
      set({ loading: false });
    }
  },

  /* ── Fetch single invoice ────────────────────────────────── */
  fetchInvoice: async (id) => {
    try {
      const res = await axios.get(`/api/invoices/${id}`);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load invoice";
      toast.error(msg);
      throw err;
    }
  },

  /* ── Generate invoice from project progress ──────────────── */
  generateInvoice: async (config) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/invoices", config);
      const newInvoice = res.data;
      set((state) => ({ invoices: [newInvoice, ...state.invoices] }));
      toast.success(`Invoice ${newInvoice.id} generated!`);
      return newInvoice;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to generate invoice";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Update invoice ──────────────────────────────────────── */
  updateInvoice: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/invoices/${id}`, data);
      const updated = res.data;
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? updated : inv)),
      }));
      toast.success("Invoice updated");
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update invoice";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  /* ── Delete invoice ──────────────────────────────────────── */
  deleteInvoice: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/invoices/${id}`);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }));
      toast.success("Invoice deleted");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete invoice";
      toast.error(msg);
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));

export default useInvoiceStore;
