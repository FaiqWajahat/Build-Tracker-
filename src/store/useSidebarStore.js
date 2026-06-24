import { create } from "zustand";

const useSidebarStore = create((set) => ({
  mobileOpen: false,
  openMobile:  () => set({ mobileOpen: true }),
  closeMobile: () => set({ mobileOpen: false }),
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
}));

export default useSidebarStore;
