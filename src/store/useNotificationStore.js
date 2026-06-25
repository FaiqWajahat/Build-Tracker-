"use client";

import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,
  loaded: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/api/notifications");
      set({ notifications: response.data, loaded: true });
    } catch (error) {
      console.error("fetchNotifications error:", error);
    } finally {
      set({ loading: false });
    }
  },

  addNotification: async (notificationData) => {
    try {
      const response = await axios.post("/api/notifications", notificationData);
      const newItem = response.data;
      set((state) => ({ notifications: [newItem, ...state.notifications] }));
      return newItem;
    } catch (error) {
      console.error("addNotification error:", error);
    }
  },

  markAllAsRead: async () => {
    // Optimistically mark all as read in UI state
    const previousNotifs = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    try {
      await axios.put("/api/notifications/mark-read");
    } catch (error) {
      console.error("markAllAsRead error:", error);
      // Revert in case of failure
      set({ notifications: previousNotifs });
      toast.error("Failed to mark notifications as read");
    }
  },

  markAsRead: async (id) => {
    const previousNotifs = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    try {
      await axios.put(`/api/notifications/${id}`, { read: true });
    } catch (error) {
      console.error("markAsRead error:", error);
      set({ notifications: previousNotifs });
    }
  },

  dismissNotification: async (id) => {
    const previousNotifs = get().notifications;
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
    try {
      await axios.delete(`/api/notifications/${id}`);
    } catch (error) {
      console.error("dismissNotification error:", error);
      set({ notifications: previousNotifs });
      toast.error("Failed to dismiss notification");
    }
  },
}));

export default useNotificationStore;
