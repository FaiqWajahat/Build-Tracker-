"use client";

import { useState } from "react";
import {
  Users, UserCheck, Shield, Clock,
  Search, Filter, Plus, Edit, Ban,
  Trash2, Mail, Calendar, Key, MapPin
} from "lucide-react";

const initialUsers = [
  { id: "USR-001", name: "Ahmed Malik", email: "ahmed.malik@7d.sa", role: "Project Manager", activeSite: "Tower Block A, Villa Complex B", status: "Active", lastLogin: "10m ago" },
  { id: "USR-002", name: "Sara Khan", email: "sara.khan@7d.sa", role: "Project Manager", activeSite: "Villa Complex B, Office Tower E", status: "Active", lastLogin: "2h ago" },
  { id: "USR-003", name: "Hassan Usman", email: "hassan.u@7d.sa", role: "Supervisor", activeSite: "Tower Block A", status: "Active", lastLogin: "30m ago" },
  { id: "USR-004", name: "Omar Tareq", email: "omar.t@7d.sa", role: "Supervisor", activeSite: "Warehouse D", status: "Active", lastLogin: "1d ago" },
  { id: "USR-005", name: "Faisal Ghamdi", email: "faisal.g@7d.sa", role: "Auditor", activeSite: "All Sites", status: "Active", lastLogin: "3d ago" },
  { id: "USR-006", name: "Khalid Al-Ahmadi", email: "khalid@7d.sa", role: "Admin", activeSite: "All Portfolios", status: "Active", lastLogin: "5m ago" },
  { id: "USR-007", name: "Yasir Arafat", email: "yasir.a@7d.sa", role: "Supervisor", activeSite: "Standby", status: "Suspended", lastLogin: "15d ago" },
];

const statusStyles = {
  "Active":    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  "Suspended": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  "Invited":   "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const filteredUsers = initialUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.activeSite.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pmCount = initialUsers.filter(u => u.role === "Project Manager").length;
  const supCount = initialUsers.filter(u => u.role === "Supervisor").length;

  return (
    <div className="p-6 min-h-full">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total ERP Users", value: `${initialUsers.length} Accounts`, icon: Users, colorClass: "text-blue-600 bg-blue-500/10" },
          { label: "Project Managers", value: `${pmCount} Managers`, icon: UserCheck, colorClass: "text-emerald-600 bg-emerald-500/10" },
          { label: "Site Supervisors", value: `${supCount} Supervisors`, icon: Shield, colorClass: "text-purple-600 bg-purple-500/10" },
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
            <option value="Project Manager">Project Manager</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Auditor">Auditor</option>
          </select>

          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer">
            <Plus size={14} /> Invite User
          </button>
        </div>
      </div>

      {/* Users Register Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1.8fr_1.2fr_1.8fr_1fr_1fr_1fr] px-6 py-3 bg-muted/40 border-b border-border text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>User Name / Email</span>
              <span>ERP Access Role</span>
              <span>Permissions</span>
              <span>Assigned Scope</span>
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
                  className={`grid grid-cols-[2fr_1.8fr_1.2fr_1.8fr_1fr_1fr_1fr] px-6 py-3.5 items-center cursor-pointer transition-colors hover:bg-muted/30
                    ${idx < filteredUsers.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  {/* Name and Email */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {u.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail size={11} className="opacity-75" />
                        {u.email}
                      </p>
                    </div>
                  </div>

                  {/* Role */}
                  <span className="text-[12.5px] font-semibold text-foreground">{u.role}</span>

                  {/* Level key */}
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-muted text-muted-foreground">
                      <Key size={10} />
                      {u.role === "Admin" ? "Full Access" : u.role === "Auditor" ? "Read Only" : "Site Edit"}
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
                  <div className="flex items-center justify-end gap-1.5">
                    <button title="Edit Role" className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer border-none transition-colors">
                      <Edit size={12} />
                    </button>
                    {u.status === "Active" ? (
                      <button title="Suspend User" className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 cursor-pointer border-none transition-colors">
                        <Ban size={12} />
                      </button>
                    ) : (
                      <button title="Delete Record" className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer border-none transition-colors">
                        <Trash2 size={12} />
                      </button>
                    )}
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
    </div>
  );
}
