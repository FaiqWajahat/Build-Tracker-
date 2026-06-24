"use client";

import { useState, useEffect } from "react";
import {
  Users, UserCheck, Shield, Clock,
  Search, Filter, Plus, Edit, Ban,
  Trash2, Mail, Calendar, Key, MapPin,
  X, Check, Lock, ShieldAlert
} from "lucide-react";
import useUserStore from "@/store/useUserStore";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import Loader from "@/components/ui/Loader";

const statusStyles = {
  "Active":    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  "Suspended": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  "Invited":   "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
};

export default function UsersPage() {
  const { users, fetchUsers, addUser, updateUser, deleteUser, currentUser, loading } = useUserStore();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("User");
  const [formSite, setFormSite] = useState("All Sites");
  const [formPassword, setFormPassword] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open add modal
  const openAdd = () => {
    setFormName("");
    setFormEmail("");
    setFormRole("User");
    setFormSite("All Sites");
    setFormPassword("");
    setFormStatus("Active");
    setFormError("");
    setShowAddModal(true);
  };

  // Open edit modal
  const openEdit = (user) => {
    setEditTarget(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormSite(user.activeSite);
    setFormPassword("");
    setFormStatus(user.status);
    setFormError("");
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      setFormError("Name and Email are required fields.");
      return;
    }
    setFormError("");

    try {
      await addUser({
        name: formName,
        email: formEmail,
        role: formRole,
        activeSite: formSite,
        password: formPassword || "password123",
        status: "Active"
      });
      setShowAddModal(false);
    } catch (err) {
      setFormError(err.message || "Failed to add user.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      setFormError("Name and Email are required fields.");
      return;
    }
    setFormError("");

    try {
      await updateUser(editTarget.id, {
        name: formName,
        email: formEmail,
        role: formRole,
        activeSite: formSite,
        status: formStatus,
        password: formPassword || undefined
      });
      setEditTarget(null);
    } catch (err) {
      setFormError(err.message || "Failed to update user.");
    }
  };

  const toggleSuspendUser = async (user) => {
    const newStatus = user.status === "Active" ? "Suspended" : "Active";
    try {
      await updateUser(user.id, {
        ...user,
        activeSite: user.activeSite,
        status: newStatus
      });
    } catch (err) {
      // Handled by store toasts
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteUser(deleteTarget.id);
        setDeleteTarget(null);
      } catch (err) {
        // Handled by store toasts
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.activeSite.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pmCount = users.filter(u => u.role === "User" && u.activeSite !== "All Sites").length;
  const adminCount = users.filter(u => u.role === "Admin").length;

  const isReadOnly = currentUser?.role === "User";

  return (
    <div className="p-6 min-h-full relative">
      {loading && <Loader message="Updating user directory..." />}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total ERP Accounts", value: `${users.length} Users`, icon: Users, colorClass: "text-blue-600 bg-blue-500/10" },
          { label: "Administrators", value: `${adminCount} Admins`, icon: Shield, colorClass: "text-purple-600 bg-purple-500/10" },
          { label: "Site Users", value: `${pmCount} Site Users`, icon: UserCheck, colorClass: "text-emerald-600 bg-emerald-500/10" },
          { label: "Active Sessions Today", value: "4 Online", icon: Clock, colorClass: "text-amber-600 bg-amber-500/10" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-card border border-border rounded-xl p-5 hover:shadow-xs transition-all duration-200 fade-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12.5px] font-semibold text-muted-foreground">{stat.label}</span>
                <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center ${stat.colorClass}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-xl font-extrabold text-foreground leading-none">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter and Invite Header */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search team member name, email, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs outline-none cursor-pointer focus:border-ring"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>

          <button
            onClick={openAdd}
            disabled={isReadOnly}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
          >
            <Plus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Users Register Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.8fr_1fr_1fr_1fr] px-6 py-3 bg-muted/40 border-b border-border text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>User Name / Email</span>
              <span>ERP Access Role</span>
              <span>Permissions</span>
              <span>Assigned Site / Scope</span>
              <span>Status</span>
              <span>Last Active</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table Rows */}
            {filteredUsers.map((u, idx) => {
              const statusClass = statusStyles[u.status] || "bg-muted text-muted-foreground";
              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-[2fr_1.5fr_1.5fr_1.8fr_1fr_1fr_1fr] px-6 py-3.5 items-center cursor-pointer transition-colors hover:bg-muted/30
                    ${idx < filteredUsers.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  {/* Name and Email */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {u.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <Mail size={11} className="opacity-75 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Role */}
                  <span className="text-[12.5px] font-semibold text-foreground">{u.role}</span>

                  {/* Level key */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border
                      ${u.role === "Admin"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"}`}>
                      <Key size={10} />
                      {u.role === "Admin" ? "Full Access" : "Read Only"}
                    </span>
                  </div>

                  {/* Scope */}
                  <span className="text-[12.5px] text-foreground font-medium flex items-center gap-1 truncate max-w-[170px]">
                    <MapPin size={11} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{u.activeSite}</span>
                  </span>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${statusClass}`}>
                      {u.status}
                    </span>
                  </div>

                  {/* Last Active */}
                  <span className="text-[12px] text-muted-foreground">{u.lastLogin}</span>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      title="Edit Role"
                      disabled={isReadOnly}
                      onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer border-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      title={u.status === "Active" ? "Suspend User" : "Activate User"}
                      disabled={isReadOnly}
                      onClick={() => toggleSuspendUser(u)}
                      className={`p-1.5 rounded-lg border-none transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                        ${u.status === "Active" 
                          ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20" 
                          : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"}`}
                    >
                      {u.status === "Active" ? <Ban size={12} /> : <Check size={12} />}
                    </button>
                    <button
                      title="Delete Record"
                      disabled={isReadOnly}
                      onClick={() => setDeleteTarget(u)}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer border-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No users found matching the criteria.
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col fade-up">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg"><Plus size={16} /></div>
                <h3 className="text-sm font-bold text-foreground">Add New ERP User</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col">
              <div className="p-6 flex flex-col gap-4">
                {formError && (
                  <div className="p-3 text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-1.5">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Faisal Ghamdi"
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. faisal.g@7d.sa"
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ERP Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none cursor-pointer focus:border-primary transition-colors"
                    >
                      <option value="Admin">Admin (Full Write)</option>
                      <option value="User">User (Read Only)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Default Password</label>
                    <div className="relative">
                      <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="password123"
                        className="w-full pl-8 pr-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Scope / Site</label>
                  <input
                    type="text"
                    value={formSite}
                    onChange={(e) => setFormSite(e.target.value)}
                    placeholder="e.g. All Sites, Tower Block A"
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-border bg-transparent text-muted-foreground text-xs font-semibold rounded-xl cursor-pointer hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-sm border-none cursor-pointer hover:bg-primary/95 transition-colors">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col fade-up">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg"><Edit size={16} /></div>
                <h3 className="text-sm font-bold text-foreground">Edit User Profile</h3>
              </div>
              <button onClick={() => setEditTarget(null)} className="bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer"><X size={16} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col">
              <div className="p-6 flex flex-col gap-4">
                {formError && (
                  <div className="p-3 text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-1.5">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ERP Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none cursor-pointer focus:border-primary transition-colors"
                    >
                      <option value="Admin">Admin (Full Write)</option>
                      <option value="User">User (Read Only)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none cursor-pointer focus:border-primary transition-colors"
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Scope / Site</label>
                  <input
                    type="text"
                    value={formSite}
                    onChange={(e) => setFormSite(e.target.value)}
                    className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reset Password (Leave blank to keep current)</label>
                  <div className="relative">
                    <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Enter new password..."
                      className="w-full pl-8 pr-3 py-2 bg-muted text-foreground border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 border border-border bg-transparent text-muted-foreground text-xs font-semibold rounded-xl cursor-pointer hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-sm border-none cursor-pointer hover:bg-primary/95 transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete User Account"
        description="Are you sure you want to permanently delete this user account? The user will immediately lose access to the portal."
        itemName={deleteTarget?.name}
      />
    </div>
  );
}
