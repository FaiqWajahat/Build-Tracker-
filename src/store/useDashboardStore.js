"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const useDashboardStore = create((set, get) => ({
  totalWorkforce: 0,
  totalAssets: 0,
  pendingInvoicesCount: 0,
  pendingInvoicesAmount: 0,
  attendanceToday: { present: 118, absent: 12, leave: 12, rate: 83, date: "" },
  attendanceMarkedToday: false,
  assetOverview: [
    { label: "Crane Units", total: 4, inUse: 3, colorClass: "bg-chart-3" },
    { label: "Scaffolding Sets", total: 18, inUse: 12, colorClass: "bg-chart-2" },
    { label: "Generators", total: 6, inUse: 4, colorClass: "bg-chart-5" },
    { label: "Excavators", total: 3, inUse: 2, colorClass: "bg-chart-4" }
  ],
  monthlyRevenue: [
    { month: "Jan", revenue: 140, cost: 108 },
    { month: "Feb", revenue: 165, cost: 126 },
    { month: "Mar", revenue: 155, cost: 120 },
    { month: "Apr", revenue: 185, cost: 143 },
    { month: "May", revenue: 172, cost: 131 },
    { month: "Jun", revenue: 184, cost: 139 }
  ],
  financialStats: {
    grossRevenue: "SAR 1,001K",
    totalCost: "SAR 767K",
    netMargin: "23.4%"
  },
  resourceDensity: [
    { name: "Villa", workers: 14, assets: 5 },
    { name: "Tower", workers: 8, assets: 3 },
    { name: "Mall", workers: 6, assets: 2 }
  ],
  loading: false,
  loaded: false,

  fetchDashboardData: async (force = false) => {
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      const response = await axios.get("/api/dashboard");
      const {
        totalWorkforce,
        totalAssets,
        pendingInvoicesCount,
        pendingInvoicesAmount,
        attendanceToday,
        assetOverview,
        monthlyRevenue,
        financialStats,
        resourceDensity,
        attendanceMarkedToday
      } = response.data;

      set({
        totalWorkforce,
        totalAssets,
        pendingInvoicesCount,
        pendingInvoicesAmount,
        attendanceToday,
        assetOverview,
        monthlyRevenue,
        financialStats,
        resourceDensity,
        attendanceMarkedToday,
        loaded: true
      });
    } catch (error) {
      console.error("fetchDashboardData error:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      set({ loading: false });
    }
  }
}));

export default useDashboardStore;
