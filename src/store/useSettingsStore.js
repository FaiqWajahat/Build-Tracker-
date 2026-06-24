"use client";

import { create } from "zustand";
import { useState, useEffect } from "react";

const DEFAULT_SETTINGS = {
  companyName: "Seven Directions Construction",
  registrationNumber: "CR-1010998877",
  headquartersAddress: "Olaya District, Riyadh 12211, Saudi Arabia",
  currency: "SAR",
  vatRate: "15",
  fiscalYearStart: "1",
  notifications: {
    emailSummary: true,
    delayAlerts: true,
    invoiceOverdue: false,
    assetMaintenance: true
  },
  sessionTimeout: "30",
  biometricMatchRate: "95"
};

const useSettingsStore = create((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erp_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          set({
            settings: { ...DEFAULT_SETTINGS, ...parsed },
            loaded: true
          });
          return;
        } catch (e) {
          console.error("Failed to parse settings from localStorage:", e);
        }
      }
      set({ settings: DEFAULT_SETTINGS, loaded: true });
    }
  },

  saveSettings: (newSettings) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("erp_settings", JSON.stringify(newSettings));
      set({ settings: newSettings });
    }
  },

  formatCurrency: (amount, options = {}) => {
    const symbol = options.currency || get().settings.currency || "SAR";
    const num = Number(amount || 0);
    return `${symbol} ${num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    })}`;
  }
}));

export default useSettingsStore;

// SSR & Hydration safe hooks
export function useCurrency() {
  const [mounted, setMounted] = useState(false);
  const currency = useSettingsStore((s) => s.settings.currency);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? currency : "SAR";
}

export function useCompanyName() {
  const [mounted, setMounted] = useState(false);
  const companyName = useSettingsStore((s) => s.settings.companyName);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? companyName : "Seven Directions Construction";
}
