import { create } from "zustand";
import axios from "axios";
import { toast } from "react-hot-toast";

const useUserStore = create((set, get) => ({
  users: [],
  currentUser: null,
  loading: false,
  loaded: false,
  authChecked: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/api/users");
      set({ users: response.data, loaded: true });
    } catch (error) {
      console.error("fetchUsers error:", error);
      toast.error(error.response?.data?.error || "Failed to load users");
    } finally {
      set({ loading: false });
    }
  },

  addUser: async (userData) => {
    const toastId = toast.loading("Adding new user...");
    try {
      const response = await axios.post("/api/users", userData);
      set((state) => ({ users: [...state.users, response.data] }));
      toast.success("User added successfully", { id: toastId });
      return response.data;
    } catch (error) {
      console.error("addUser error:", error);
      const errMsg = error.response?.data?.error || "Failed to add user";
      toast.error(errMsg, { id: toastId });
      throw new Error(errMsg);
    }
  },

  updateUser: async (id, userData) => {
    const toastId = toast.loading("Updating user profile...");
    try {
      const response = await axios.put(`/api/users/${id}`, userData);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? response.data : u)),
        // If the updated user is the current user, update their session profile too
        currentUser: state.currentUser?.id === id ? response.data : state.currentUser,
      }));
      toast.success("User updated successfully", { id: toastId });
      return response.data;
    } catch (error) {
      console.error("updateUser error:", error);
      const errMsg = error.response?.data?.error || "Failed to update user";
      toast.error(errMsg, { id: toastId });
      throw new Error(errMsg);
    }
  },

  deleteUser: async (id) => {
    const toastId = toast.loading("Deleting user record...");
    try {
      await axios.delete(`/api/users/${id}`);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        // If the deleted user was logged in, log them out
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
      }));
      toast.success("User deleted successfully", { id: toastId });
    } catch (error) {
      console.error("deleteUser error:", error);
      const errMsg = error.response?.data?.error || "Failed to delete user";
      toast.error(errMsg, { id: toastId });
      throw new Error(errMsg);
    }
  },

  login: async (email, password) => {
    const toastId = toast.loading("Verifying credentials...");
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      set({ currentUser: response.data.user, authChecked: true });
      toast.success(`Welcome back, ${response.data.user.name}!`, { id: toastId });
      // Fetch user list right after logging in
      get().fetchUsers();
      return response.data.user;
    } catch (error) {
      console.error("login error:", error);
      const errMsg = error.response?.data?.error || "Login failed";
      toast.error(errMsg, { id: toastId });
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    const toastId = toast.loading("Logging out...");
    try {
      await axios.post("/api/auth/logout");
      set({ currentUser: null });
      toast.success("Logged out successfully", { id: toastId });
    } catch (error) {
      console.error("logout error:", error);
      toast.error("Failed to logout", { id: toastId });
    }
  },

  checkAuth: async () => {
    try {
      const response = await axios.get("/api/auth/me");
      set({ currentUser: response.data.user, authChecked: true });
      return response.data.user;
    } catch (error) {
      // Don't show toast error for silent auth check
      set({ currentUser: null, authChecked: true });
      return null;
    }
  },
}));

export default useUserStore;
