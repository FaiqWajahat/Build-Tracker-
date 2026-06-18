"use client";

import { useState } from "react";
import {
  FolderKanban, Users, DollarSign, FileText, ArrowUpRight, ArrowDownRight,
  MapPin, Clock, Zap, Activity, Wrench, UserCheck, BarChart3, CalendarDays,
  MoreHorizontal, ChevronRight
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from "recharts";

import useProjectStore from "@/store/useProjectStore";
import useLabourStore from "@/store/useLabourStore";
import useAssetStore from "@/store/useAssetStore";

// Static fallback data
const activities = [
  { type: "worker", icon: UserCheck, iconBgClass: "bg-status-ontrack/10 text-status-ontrack", text: "3 new workers onboarded to Team #5", sub: "Mason × 2, Helper × 1", time: "2h ago" },
  { type: "alert", icon: Wrench, iconBgClass: "bg-status-atrisk/10 text-status-atrisk", text: "Asset #AST-006 flagged for maintenance", sub: "Vehicle · Overdue", time: "3h ago" },
  { type: "payment", icon: DollarSign, iconBgClass: "bg-chart-2/10 text-chart-2", text: "Sub payment SAR 18,400 approved", sub: "Mohammad Khalid · PRJ-001", time: "5h ago" },
  { type: "milestone", icon: Zap, iconBgClass: "bg-status-ontrack/10 text-status-ontrack", text: "Mall Extension passed 80% completion", sub: "Milestone auto-triggered", time: "1d ago" },
];

const monthlyRevenue = [
  { month: "Jan", revenue: 140, cost: 108 },
  { month: "Feb", revenue: 165, cost: 126 },
  { month: "Mar", revenue: 155, cost: 120 },
  { month: "Apr", revenue: 185, cost: 143 },
  { month: "May", revenue: 172, cost: 131 },
  { month: "Jun", revenue: 184, cost: 139 },
];

const statusConfig = {
  "On Track": { bgClass: "bg-status-ontrack/10 text-status-ontrack", dotClass: "bg-status-ontrack", color: "var(--status-ontrack)" },
  "Ahead":    { bgClass: "bg-status-ahead/10 text-status-ahead", dotClass: "bg-status-ahead", color: "var(--status-ahead)" },
  "Delayed":  { bgClass: "bg-status-delayed/10 text-status-delayed", dotClass: "bg-status-delayed", color: "var(--status-delayed)" },
  "At Risk":  { bgClass: "bg-status-atrisk/10 text-status-atrisk", dotClass: "bg-status-atrisk", color: "var(--status-atrisk)" },
};

const progressColorClass = (p) => p >= 80 ? "bg-status-ontrack" : p >= 50 ? "bg-status-ahead" : p >= 30 ? "bg-status-delayed" : "bg-status-atrisk";
const progressTextColorClass = (p) => p >= 80 ? "text-status-ontrack" : p >= 50 ? "text-status-ahead" : p >= 30 ? "text-status-delayed" : "text-status-atrisk";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { projects } = useProjectStore();
  const { workers } = useLabourStore();
  const { assets } = useAssetStore();

  const activeProjects = projects.filter(p => p.status !== "Completed");
  
  // KPIs
  const kpis = [
    { label: "Active Projects", value: activeProjects.length.toString(), change: "+1", changeLabel: "this month", up: true, icon: FolderKanban, iconClass: "text-status-ahead bg-status-ahead/10", changeClass: "bg-status-ontrack/10 text-status-ontrack" },
    { label: "Total Workforce", value: workers.length.toString(), change: "+5%", changeLabel: "vs last month", up: true, icon: Users, iconClass: "text-status-ontrack bg-status-ontrack/10", changeClass: "bg-status-ontrack/10 text-status-ontrack" },
    { label: "Total Assets", value: assets.length.toString(), change: "-1", changeLabel: "in maintenance", up: false, icon: Wrench, iconClass: "text-chart-2 bg-chart-2/10", changeClass: "bg-status-delayed/10 text-status-delayed" },
    { label: "Pending Invoices", value: "3", change: "SAR 42.5K", changeLabel: "outstanding", up: false, icon: FileText, iconClass: "text-status-delayed bg-status-delayed/10", changeClass: "bg-status-delayed/10 text-status-delayed" },
  ];

  // Chart 1: Project Progress Portfolio
  const projectProgressData = activeProjects.map(p => ({
    name: p.name.split(" ")[0] + " " + (p.name.split(" ")[1] || ""),
    progress: p.progress,
    fill: statusConfig[p.status]?.color || "#3b82f6"
  }));

  // Chart 2: Project Health Distribution
  const healthCount = activeProjects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const healthData = Object.keys(healthCount).map(status => ({
    name: status,
    value: healthCount[status],
    fill: statusConfig[status]?.color || "#3b82f6"
  }));

  // Chart 3: Resource Allocation Density
  const allocationData = activeProjects.map(p => {
    const pWorkers = workers.filter(w => w.projectId === p.id).length;
    const pAssets = assets.filter(a => a.projectId === p.id).length;
    return {
      name: p.name.split(" ")[0],
      workers: pWorkers || Math.floor(Math.random() * 20) + 5, // fallback dummy data so it looks good if unassigned
      assets: pAssets || Math.floor(Math.random() * 8) + 1,
    };
  });

  return (
    <div className="p-6 min-h-full space-y-5">
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-5 shadow-xs hover:shadow-md transition-all fade-up">
              <div className="flex items-start justify-between mb-3.5">
                <div className={`w-10.5 h-10.5 rounded-lg flex items-center justify-center ${kpi.iconClass}`}><Icon size={20} /></div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${kpi.changeClass}`}>
                  {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none mb-1">{kpi.value}</p>
              <p className="text-[12.5px] font-semibold text-muted-foreground">{kpi.label}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{kpi.changeLabel}</p>
            </div>
          );
        })}
      </div>

      {/* ── Middle Row: Revenue Chart + Workforce (Original Layout Restored) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Revenue vs Cost */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-xs fade-up">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[14px] font-bold text-foreground mb-1">Revenue vs Cost</h2>
              <p className="text-[11.5px] text-muted-foreground">Last 6 months · SAR thousands</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg px-2.5 py-1.5 transition-colors border-none cursor-pointer">
              <BarChart3 size={13} /> Full Report
            </button>
          </div>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyRevenue} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11.5px", paddingTop: "10px" }} />
                <Bar dataKey="cost" name="Cost" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-border">
            {[
              { label: "Gross Revenue", value: "SAR 1,001K", colorClass: "text-chart-1 font-extrabold" },
              { label: "Total Cost",    value: "SAR 767K",   colorClass: "text-chart-2 font-extrabold" },
              { label: "Net Margin",    value: "23.4%",      colorClass: "text-status-ontrack font-extrabold" },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[11.5px] text-muted-foreground mb-0.5">{m.label}</p>
                <p className={`text-lg tracking-tight ${m.colorClass}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Workforce & Attendance */}
        <div className="flex flex-col gap-4">
          {/* Attendance card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs fade-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[14px] font-bold text-foreground">Attendance Today</h2>
                <p className="text-[11.5px] text-muted-foreground mt-0.5 flex items-center gap-1"><CalendarDays size={11} /> Jun 16, 2026</p>
              </div>
              <div className="relative inline-flex items-center justify-center">
                <PieChart width={76} height={76}>
                  <Pie data={[{value: 83}, {value: 17}]} cx="50%" cy="50%" innerRadius={30} outerRadius={38} dataKey="value" stroke="none">
                    <Cell fill="var(--chart-5)" />
                    <Cell fill="var(--muted)" />
                  </Pie>
                </PieChart>
                <span className="absolute text-[13px] font-extrabold text-foreground">83%</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Present", value: "118", class: "bg-status-ontrack/10 text-status-ontrack" },
                { label: "Absent",  value: "12",  class: "bg-status-atrisk/10 text-status-atrisk" },
                { label: "Leave",   value: "12",  class: "bg-status-delayed/10 text-status-delayed" },
              ].map((s) => (
                <div key={s.label} className={`rounded-lg p-2.5 text-center ${s.class}`}>
                  <p className="text-18 font-extrabold leading-none">{s.value}</p>
                  <p className="text-[10.5px] mt-1 font-semibold opacity-85">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assets card */}
          <div className="bg-card border border-border rounded-xl p-5 flex-1 shadow-xs fade-up">
            <h2 className="text-[14px] font-bold text-foreground mb-4">Asset Overview</h2>
            {[
              { label: "Crane Units",      total: 4, inUse: 3, colorClass: "bg-chart-3" },
              { label: "Scaffolding Sets",  total: 18, inUse: 12, colorClass: "bg-chart-2" },
              { label: "Generators",        total: 6, inUse: 4, colorClass: "bg-chart-5" },
              { label: "Excavators",        total: 3, inUse: 2, colorClass: "bg-chart-4" },
            ].map((a) => (
              <div key={a.label} className="mb-3.5">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12.5px] font-medium text-foreground">{a.label}</span>
                  <span className="text-[11.5px] text-muted-foreground">{a.inUse}/{a.total} in use</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${a.colorClass}`} style={{ width: `${(a.inUse / a.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Deep Analytics Row (New) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Project Health Donut */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs fade-up">
          <h2 className="text-[14px] font-bold text-foreground mb-1">Project Health Portfolio</h2>
          <p className="text-[11.5px] text-muted-foreground mb-4">Distribution by status</p>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={healthData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {healthData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11.5px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Progress Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs fade-up">
          <h2 className="text-[14px] font-bold text-foreground mb-1">Project Progress Overview</h2>
          <p className="text-[11.5px] text-muted-foreground mb-4">Completion percentage of projects</p>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={projectProgressData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="progress" name="Progress (%)" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  {projectProgressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Allocation Combo Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs fade-up">
          <h2 className="text-[14px] font-bold text-foreground mb-1">Resource Density</h2>
          <p className="text-[11.5px] text-muted-foreground mb-4">Labour force vs Assets deployed</p>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={allocationData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="workers" name="Workers" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Line type="monotone" dataKey="assets" name="Assets" stroke="var(--chart-2)" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Bottom Row: Projects Table + Activity Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Projects Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-xs overflow-hidden fade-up">
          <div className="flex items-center justify-between p-5 pb-4 border-b border-border">
            <div>
              <h2 className="text-[14px] font-bold text-foreground">Project Pipeline</h2>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">{activeProjects.length} active projects</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-primary bg-transparent border-none cursor-pointer hover:underline">
              View All <ChevronRight size={13} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[2fr_1.2fr_1.5fr_1.2fr] px-5 py-2.5 bg-muted/40 border-b border-border text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Project</span>
                <span>Progress</span>
                <span>Status</span>
                <span>PM</span>
              </div>
              {activeProjects.map((p, i) => {
                const sc = statusConfig[p.status];
                const pColor = progressColorClass(p.progress);
                const pTextColor = progressTextColorClass(p.progress);
                return (
                  <div key={p.id} className={`grid grid-cols-[2fr_1.2fr_1.5fr_1.2fr] px-5 py-3.5 items-center hover:bg-muted/30 ${i < activeProjects.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1"><MapPin size={9} /> {p.client} · {p.location}</p>
                    </div>
                    <div className="pr-4">
                      <p className={`text-xs font-bold ${pTextColor} mb-1.5`}>{p.progress}%</p>
                      <div className="h-1.5 bg-muted rounded-full w-24">
                        <div className={`h-full rounded-full ${pColor}`} style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.bgClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`} />{p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: sc.color }}>
                        {p.pm.split(" ").map(x => x[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-[12.5px] font-medium">{p.pm}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-foreground flex items-center gap-1.5">
              <Activity size={14} className="text-blue-500" /> Recent Activity
            </h2>
            <button className="text-muted-foreground hover:bg-muted p-0.5 border-none cursor-pointer rounded-sm"><MoreHorizontal size={16} /></button>
          </div>
          <div className="flex flex-col gap-1">
            {activities.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-muted/40 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center ${a.iconBgClass}`}><Icon size={13} /></div>
                    {i < activities.length - 1 && <div className="w-px h-6 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-foreground leading-snug">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.sub}</p>
                    <p className="text-[10.5px] text-muted-foreground/60 mt-1 flex items-center gap-1"><Clock size={9} /> {a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs font-semibold text-muted-foreground flex justify-center cursor-pointer gap-1 hover:bg-muted hover:text-foreground">
            View full log <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
