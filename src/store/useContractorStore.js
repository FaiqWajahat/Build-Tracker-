"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const useContractorStore = create((set, get) => ({
  contractors: [],
  deductions: [],
  payments: [],
  deductionsPagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  paymentsPagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  loading: false,
  loaded: false,

  fetchContractorData: async () => {
    if (get().loaded) return;
    set({ loading: true });
    try {
      const response = await axios.get("/api/contractors");
      const { contractors } = response.data;
      set({ contractors, deductions: [], payments: [], loaded: true });
    } catch (error) {
      console.error("fetchContractorData error:", error);
      toast.error("Failed to load contractor data");
    } finally {
      set({ loading: false });
    }
  },

  fetchDeductions: async (contractorId, page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const contractorQuery = contractorId ? `contractorId=${contractorId}&` : "";
      const response = await axios.get(`/api/contractors/deductions?${contractorQuery}page=${page}&limit=${limit}`);
      if (response.data && response.data.pagination) {
        set({
          deductions: response.data.data,
          deductionsPagination: response.data.pagination,
        });
      } else {
        set({
          deductions: response.data || [],
          deductionsPagination: { page: 1, limit: 500, total: (response.data || []).length, totalPages: 1 },
        });
      }
    } catch (error) {
      console.error("fetchDeductions error:", error);
      toast.error("Failed to load contractor deductions");
    } finally {
      set({ loading: false });
    }
  },

  fetchPayments: async (contractorId, page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const contractorQuery = contractorId ? `contractorId=${contractorId}&` : "";
      const response = await axios.get(`/api/contractors/payments?${contractorQuery}page=${page}&limit=${limit}`);
      if (response.data && response.data.pagination) {
        set({
          payments: response.data.data,
          paymentsPagination: response.data.pagination,
        });
      } else {
        set({
          payments: response.data || [],
          paymentsPagination: { page: 1, limit: 500, total: (response.data || []).length, totalPages: 1 },
        });
      }
    } catch (error) {
      console.error("fetchPayments error:", error);
      toast.error("Failed to load contractor payments");
    } finally {
      set({ loading: false });
    }
  },

  /* ── Contractors CRUD ────────────────────────────────────────── */
  addContractor: async (data) => {
    set({ loading: true });
    try {
      const response = await axios.post("/api/contractors", data);
      const newItem = response.data;
      set((state) => ({ contractors: [...state.contractors, newItem] }));
      toast.success("Contractor partner registered successfully");
      return newItem;
    } catch (error) {
      console.error("addContractor error:", error);
      const errMsg = error.response?.data?.error || "Failed to register contractor";
      toast.error(errMsg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateContractor: async (id, data) => {
    set({ loading: true });
    try {
      const response = await axios.put(`/api/contractors/${id}`, data);
      const updatedItem = response.data;
      set((state) => ({
        contractors: state.contractors.map((c) => (c.id === id ? updatedItem : c)),
      }));
      toast.success("Contractor details updated");
      return updatedItem;
    } catch (error) {
      console.error("updateContractor error:", error);
      const errMsg = error.response?.data?.error || "Failed to update contractor";
      toast.error(errMsg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteContractor: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/contractors/${id}`);
      set((state) => ({
        contractors: state.contractors.filter((c) => c.id !== id),
        deductions: state.deductions.filter((d) => d.contractorId !== id),
        // Since payments match by name, if we delete a contractor we keep payments or they are cascade deleted if mapped.
        // But since standard cascade deletes associated payments on integer DB level:
        // we can fetch fresh or filter them on client:
      }));
      // Refetch to sync any cascaded deletes in deductions/payments on DB level
      const response = await axios.get("/api/contractors");
      set({
        contractors: response.data.contractors,
        deductions: response.data.deductions,
        payments: response.data.payments,
      });
      toast.success("Contractor profile removed");
    } catch (error) {
      console.error("deleteContractor error:", error);
      toast.error("Failed to remove contractor profile");
    } finally {
      set({ loading: false });
    }
  },

  /* ── Deductions CRUD ─────────────────────────────────────────── */
  addDeduction: async (data) => {
    set({ loading: true });
    try {
      const response = await axios.post("/api/contractors/deductions", data);
      const newItem = response.data;
      set((state) => ({ deductions: [newItem, ...state.deductions] }));
      toast.success("Contractor deduction logged successfully");
      return newItem;
    } catch (error) {
      console.error("addDeduction error:", error);
      const errMsg = error.response?.data?.error || "Failed to log deduction";
      toast.error(errMsg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteDeduction: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/contractors/deductions/${id}`);
      set((state) => ({
        deductions: state.deductions.filter((d) => d.id !== id),
      }));
      toast.success("Deduction record removed");
    } catch (error) {
      console.error("deleteDeduction error:", error);
      toast.error("Failed to remove deduction record");
    } finally {
      set({ loading: false });
    }
  },

  /* ── Subcontractor Payments CRUD ─────────────────────────────── */
  addPayment: async (data) => {
    set({ loading: true });
    try {
      const response = await axios.post("/api/contractors/payments", data);
      const newItem = response.data;
      set((state) => ({ payments: [newItem, ...state.payments] }));
      toast.success("Payment request submitted");
      return newItem;
    } catch (error) {
      console.error("addPayment error:", error);
      const errMsg = error.response?.data?.error || "Failed to submit payment request";
      toast.error(errMsg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  approvePayment: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.put(`/api/contractors/payments/${id}/approve`);
      const updatedItem = response.data;
      set((state) => ({
        payments: state.payments.map((p) => (p.id === id ? updatedItem : p)),
      }));
      toast.success("Payment request approved & cleared");
    } catch (error) {
      console.error("approvePayment error:", error);
      toast.error("Failed to approve payment");
    } finally {
      set({ loading: false });
    }
  },

  rejectPayment: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.put(`/api/contractors/payments/${id}/reject`);
      const updatedItem = response.data;
      set((state) => ({
        payments: state.payments.map((p) => (p.id === id ? updatedItem : p)),
      }));
      toast.success("Payment request rejected");
    } catch (error) {
      console.error("rejectPayment error:", error);
      toast.error("Failed to reject payment");
    } finally {
      set({ loading: false });
    }
  },

  deletePayment: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/contractors/payments/${id}`);
      set((state) => ({
        payments: state.payments.filter((p) => p.id !== id),
      }));
      toast.success("Payment record deleted");
    } catch (error) {
      console.error("deletePayment error:", error);
      toast.error("Failed to delete payment record");
    } finally {
      set({ loading: false });
    }
  },
}));

export default useContractorStore;
