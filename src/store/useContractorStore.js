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

const SEED_CONTRACTORS = [
  { id: "CON-001", name: "Gulf Build Co.", trade: "Civil & Structural", rating: 4.8, status: "Active", email: "info@gulfbuild.sa", phone: "+966 50 123 4567" },
  { id: "CON-002", name: "Al-Farsi Electric", trade: "Mechanical & Electrical", rating: 4.6, status: "Active", email: "contact@alfarsi.sa", phone: "+966 54 987 6543" },
  { id: "CON-003", name: "Al-Nour Finishes", trade: "Architectural & Finishes", rating: 4.5, status: "Active", email: "sales@alnour.com", phone: "+966 56 321 0987" },
  { id: "CON-004", name: "Gulf Plumbing Co.", trade: "Plumbing & Drainage", rating: 4.2, status: "Under Review", email: "plumbing@gulf.co", phone: "+966 53 789 0123" },
  { id: "CON-005", name: "Najd Steel & Metalworks", trade: "Structural Steel", rating: 4.9, status: "Active", email: "steel@najd.sa", phone: "+966 55 555 4321" },
];

const SEED_DEDUCTIONS = [
  { id: "DED-001", contractorId: "CON-001", contractorName: "Gulf Build Co.", site: "ABO YARA Villa Project", amount: 4500, category: "Material Damage", date: "2026-06-12", approvedBy: "Ahmed Malik", description: "Damage to high-grade porcelain tiles due to transport negligence." },
  { id: "DED-002", contractorId: "CON-002", contractorName: "Al-Farsi Electric", site: "ABO YARA Villa Project", amount: 1200, category: "Safety Fine", date: "2026-06-10", approvedBy: "Ahmed Malik", description: "Failure to comply with safety harness rules on Floor 3 facade." },
  { id: "DED-003", contractorId: "CON-004", contractorName: "Gulf Plumbing Co.", site: "ABO YARA Villa Project", amount: 1500, category: "Cash Advance", date: "2026-06-05", approvedBy: "Hassan Usman", description: "Salary advance repayment - installment 1 of 3." },
];

const SEED_PAYMENTS = [
  { id: "PAY-001", subcontractor: "Gulf Build Co.", project: "ABO YARA Villa Project", amount: 84000, date: "2026-06-14", channel: "Bank Transfer", status: "Cleared" },
  { id: "PAY-002", subcontractor: "Al-Farsi Electric", project: "ABO YARA Villa Project", amount: 35000, date: "2026-06-12", channel: "Corporate Check", status: "Cleared" },
  { id: "PAY-003", subcontractor: "Najd Steel & Metalworks", project: "Tower Block A", amount: 110000, date: "2026-06-10", channel: "Bank Transfer", status: "Pending Approval" },
  { id: "PAY-004", subcontractor: "Al-Nour Finishes", project: "ABO YARA Villa Project", amount: 18400, date: "2026-06-08", channel: "Bank Transfer", status: "Cleared" },
  { id: "PAY-005", subcontractor: "Gulf Plumbing Co.", project: "ABO YARA Villa Project", amount: 12000, date: "2026-06-05", channel: "Cash Account", status: "Cleared" },
];

const useContractorStore = create(
  persist(
    (set, get) => ({
      contractors: SEED_CONTRACTORS,
      deductions: SEED_DEDUCTIONS,
      payments: SEED_PAYMENTS,

      /* ── Contractors CRUD ────────────────────────────────────────── */
      addContractor: (data) => {
        const list = get().contractors;
        const id = genId("CON", list);
        const newItem = {
          ...data,
          id,
          rating: data.rating || 5.0,
          status: data.status || "Active",
        };
        set({ contractors: [...list, newItem] });
        return newItem;
      },

      updateContractor: (id, data) => {
        set((state) => ({
          contractors: state.contractors.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        }));
      },

      deleteContractor: (id) => {
        set((state) => ({
          contractors: state.contractors.filter((c) => c.id !== id),
        }));
      },

      /* ── Deductions CRUD ─────────────────────────────────────────── */
      addDeduction: (data) => {
        const list = get().deductions;
        const id = genId("DED", list);
        const newItem = {
          ...data,
          id,
          amount: Number(data.amount),
        };
        set({ deductions: [newItem, ...list] });
        return newItem;
      },

      deleteDeduction: (id) => {
        set((state) => ({
          deductions: state.deductions.filter((d) => d.id !== id),
        }));
      },

      /* ── Subcontractor Payments CRUD ─────────────────────────────── */
      addPayment: (data) => {
        const list = get().payments;
        const id = genId("PAY", list);
        const newItem = {
          ...data,
          id,
          amount: Number(data.amount),
          status: data.status || "Pending Approval",
        };
        set({ payments: [newItem, ...list] });
        return newItem;
      },

      approvePayment: (id) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id ? { ...p, status: "Cleared" } : p
          ),
        }));
      },

      rejectPayment: (id) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id ? { ...p, status: "Rejected" } : p
          ),
        }));
      },

      deletePayment: (id) => {
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
        }));
      },
    }),
    {
      name: "buildtrack-contractor-store-v1",
      version: 1,
    }
  )
);

export default useContractorStore;
