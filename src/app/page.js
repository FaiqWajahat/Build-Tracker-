"use client";

import { useState, useEffect } from "react";
import {
  FolderKanban, Users, DollarSign, FileText, ArrowUpRight, ArrowDownRight,
  MapPin, Clock, Zap, Activity, Wrench, UserCheck, BarChart3, CalendarDays,
  MoreHorizontal, ChevronRight, X, FileDown
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from "recharts";

import useProjectStore from "@/store/useProjectStore";
import useDashboardStore from "@/store/useDashboardStore";
import Loader from "@/components/ui/Loader";
import { useCurrency } from "@/store/useSettingsStore";
import Link from "next/link";
import { computeProjectStatus, PROJECT_STATUS_CONFIG } from "@/lib/projectStatus";

// Static fallback data
export function formatTimeAgo(dateInput) {
  if (!dateInput) return "just now";
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 0) return "just now";
  
  const intervals = {
    yr: 31536000,
    mo: 2592000,
    wk: 604800,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1
  };
  
  for (const [key, value] of Object.entries(intervals)) {
    const count = Math.floor(seconds / value);
    if (count >= 1) {
      return `${count}${key} ago`;
    }
  }
  return "just now";
}

const activityConfig = {
  worker: { icon: UserCheck, iconBgClass: "bg-status-ontrack/10 text-status-ontrack" },
  alert: { icon: Wrench, iconBgClass: "bg-status-atrisk/10 text-status-atrisk" },
  payment: { icon: DollarSign, iconBgClass: "bg-chart-2/10 text-chart-2" },
  progress: { icon: Activity, iconBgClass: "bg-status-ahead/10 text-status-ahead" },
  milestone: { icon: Zap, iconBgClass: "bg-status-ontrack/10 text-status-ontrack" }
};

// Re-export for local use — colors keyed by auto-computed status
const statusConfig = {
  "On Track":  { bgClass: "bg-status-ontrack/10 text-status-ontrack",  dotClass: "bg-status-ontrack",  color: "var(--status-ontrack)"  },
  "Ahead":     { bgClass: "bg-status-ahead/10 text-status-ahead",      dotClass: "bg-status-ahead",    color: "var(--status-ahead)"    },
  "Delayed":   { bgClass: "bg-status-delayed/10 text-status-delayed",  dotClass: "bg-status-delayed",  color: "var(--status-delayed)"  },
  "At Risk":   { bgClass: "bg-status-atrisk/10 text-status-atrisk",    dotClass: "bg-status-atrisk",   color: "var(--status-atrisk)"   },
  "Completed": { bgClass: "bg-emerald-500/10 text-emerald-600",         dotClass: "bg-emerald-500",     color: "#10b981"                },
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
  const currency = useCurrency();
  const { projects, fetchProjects } = useProjectStore();
  const [showFinancialsModal, setShowFinancialsModal] = useState(false);
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
    recentActivities,
    fetchDashboardData,
    loading
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
    fetchProjects();
  }, [fetchDashboardData, fetchProjects]);

  // Auto-compute status from dates + progress for every project
  const projectsWithStatus = projects.map(p => ({
    ...p,
    computedStatus: computeProjectStatus(p)
  }));

  const activeProjects = projectsWithStatus.filter(p => p.computedStatus !== "Completed");

  // KPIs
  const kpis = [
    { label: "Active Projects", value: activeProjects.length.toString(), change: "+1", changeLabel: "this month", up: true, icon: FolderKanban, iconClass: "text-status-ahead bg-status-ahead/10", changeClass: "bg-status-ontrack/10 text-status-ontrack" },
    { label: "Total Workforce", value: totalWorkforce.toString(), change: "+5%", changeLabel: "vs last month", up: true, icon: Users, iconClass: "text-status-ontrack bg-status-ontrack/10", changeClass: "bg-status-ontrack/10 text-status-ontrack" },
    { label: "Total Assets", value: totalAssets.toString(), change: "-1", changeLabel: "in maintenance", up: false, icon: Wrench, iconClass: "text-chart-2 bg-chart-2/10", changeClass: "bg-status-delayed/10 text-status-delayed" },
    { label: "Pending Invoices", value: pendingInvoicesCount.toString(), change: `${currency} ${(pendingInvoicesAmount / 1000).toFixed(1)}K`, changeLabel: "outstanding", up: false, icon: FileText, iconClass: "text-status-delayed bg-status-delayed/10", changeClass: "bg-status-delayed/10 text-status-delayed" },
  ];

  // Chart 1: Project Progress Portfolio (color by auto-computed status)
  const projectProgressData = activeProjects.map(p => ({
    name: (p.name || "").split(" ")[0] + " " + ((p.name || "").split(" ")[1] || ""),
    progress: p.progress,
    fill: statusConfig[p.computedStatus]?.color || "#3b82f6"
  }));

  // Chart 2: Project Health Distribution (driven by auto-computed status)
  const healthCount = activeProjects.reduce((acc, p) => {
    acc[p.computedStatus] = (acc[p.computedStatus] || 0) + 1;
    return acc;
  }, {});
  const healthData = Object.keys(healthCount).map(status => ({
    name: status,
    value: healthCount[status],
    fill: statusConfig[status]?.color || "#3b82f6"
  }));

  // Dynamic Financial Data from Projects Module
  const projectFinancialData = activeProjects.map(p => ({
    name: (p.name || "").split(" ").slice(0, 2).join(" "),
    revenue: Number(((p.totalEarned || 0) / 1000).toFixed(2)),
    cost: Number(((p.totalCost || 0) / 1000).toFixed(2))
  }));

  const totalRevK = activeProjects.reduce((sum, p) => sum + ((p.totalEarned || 0) / 1000), 0);
  const totalCostK = activeProjects.reduce((sum, p) => sum + ((p.totalCost || 0) / 1000), 0);
  const netMarginVal = totalRevK > 0 ? ((totalRevK - totalCostK) / totalRevK * 100).toFixed(1) : "0.0";

  if (loading && !totalWorkforce) {
    return <Loader />;
  }

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
              <p className="text-[11.5px] text-muted-foreground">By Project · {currency} thousands</p>
            </div>
            <button 
              onClick={() => setShowFinancialsModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg px-2.5 py-1.5 transition-colors border-none cursor-pointer"
            >
              <BarChart3 size={13} /> Full Report
            </button>
          </div>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectFinancialData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
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
              { label: "Gross Revenue", value: `${currency} ${totalRevK.toFixed(2)}K`, colorClass: "text-chart-1 font-extrabold" },
              { label: "Total Cost",    value: `${currency} ${totalCostK.toFixed(2)}K`, colorClass: "text-chart-2 font-extrabold" },
              { label: "Net Margin",    value: `${netMarginVal}%`, colorClass: "text-status-ontrack font-extrabold" },
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
                <p className="text-[11.5px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <CalendarDays size={11} /> {attendanceToday.date ? new Date(attendanceToday.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="relative inline-flex items-center justify-center">
                <PieChart width={76} height={76}>
                  <Pie data={[{value: attendanceToday.rate}, {value: 100 - attendanceToday.rate}]} cx="50%" cy="50%" innerRadius={30} outerRadius={38} dataKey="value" stroke="none">
                    <Cell fill="var(--chart-5)" />
                    <Cell fill="var(--muted)" />
                  </Pie>
                </PieChart>
                <span className="absolute text-[13px] font-extrabold text-foreground">{attendanceToday.rate}%</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Present", value: attendanceToday.present.toString(), class: "bg-status-ontrack/10 text-status-ontrack" },
                { label: "Absent",  value: attendanceToday.absent.toString(),  class: "bg-status-atrisk/10 text-status-atrisk" },
                { label: "Leave",   value: attendanceToday.leave.toString(),   class: "bg-status-delayed/10 text-status-delayed" },
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
            {assetOverview.map((a) => (
              <div key={a.label} className="mb-3.5">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12.5px] font-medium text-foreground">{a.label}</span>
                  <span className="text-[11.5px] text-muted-foreground">{a.inUse}/{a.total} in use</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${a.colorClass}`} style={{ width: `${a.total > 0 ? (a.inUse / a.total) * 100 : 0}%` }} />
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
              <ComposedChart data={resourceDensity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
            <Link 
              href="/projects" 
              className="flex items-center gap-1 text-xs font-semibold text-primary bg-transparent border-none cursor-pointer hover:underline"
            >
              View All <ChevronRight size={13} />
            </Link>
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
                      <Link href={`/projects/${p.id}`} className="hover:underline">
                        <p className="text-[13.5px] font-semibold text-foreground hover:text-primary transition-colors">{p.name}</p>
                      </Link>
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
                        {p.pm ? p.pm.split(" ").map(x => x[0]).join("").slice(0, 2) : "??"}
                      </div>
                      <span className="text-[12.5px] font-medium">{p.pm || "No PM"}</span>
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
            {(recentActivities || []).map((a, i, arr) => {
              const cfg = activityConfig[a.type] || activityConfig.worker;
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-muted/40 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center ${cfg.iconBgClass}`}><Icon size={13} /></div>
                    {i < arr.length - 1 && <div className="w-px h-6 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-foreground leading-snug">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.sub}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1"><Clock size={9} /> {formatTimeAgo(a.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/daily-progress"
            className="w-full mt-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs font-semibold text-muted-foreground flex justify-center items-center cursor-pointer gap-1 hover:bg-muted hover:text-foreground transition-colors"
          >
            View full log <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Financial Portfolio Report Modal ── */}
      {showFinancialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFinancialsModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col z-10 animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-xs border-b border-border px-6 py-4 flex items-center justify-between z-20">
              <div>
                <h2 className="font-bold text-foreground text-base">Project Financial Portfolio</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Comprehensive revenue, cost, and margin summary by project</p>
              </div>
              <button 
                onClick={() => setShowFinancialsModal(false)} 
                className="p-2 rounded-lg hover:bg-muted transition-colors border-none bg-transparent cursor-pointer outline-none"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Portfolio Revenue", value: `${currency} ${(totalRevK * 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-status-ontrack bg-status-ontrack/10" },
                  { label: "Portfolio Cost", value: `${currency} ${(totalCostK * 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-chart-2 bg-chart-2/10" },
                  { label: "Net Margin", value: `${currency} ${((totalRevK - totalCostK) * 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-primary bg-primary/10" },
                  { label: "Avg Margin %", value: `${netMarginVal}%`, color: "text-status-ahead bg-status-ahead/10" },
                ].map((s, idx) => (
                  <div key={idx} className="bg-muted/40 border border-border rounded-xl p-4 shadow-2xs">
                    <p className="text-[11px] font-bold text-muted-foreground/85 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-xl font-black text-foreground tracking-tight">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-card shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                        <th className="px-4 py-3.5">Project Name</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Gross Revenue</th>
                        <th className="px-4 py-3.5 text-right">Total Cost</th>
                        <th className="px-4 py-3.5 text-right">Net Profit</th>
                        <th className="px-4 py-3.5 text-right">Margin (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeProjects.map((p) => {
                        const rev = p.totalEarned || 0;
                        const cost = p.totalCost || 0;
                        const profit = rev - cost;
                        const margin = rev > 0 ? (profit / rev * 100).toFixed(1) : "0.0";
                        const sc = statusConfig[p.status] || { bgClass: "bg-muted text-muted-foreground", dotClass: "bg-muted-foreground" };
                        return (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${sc.bgClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`} />{p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-medium text-foreground">{currency} {rev.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                            <td className="px-4 py-3 text-right font-mono font-medium text-chart-2">{currency} {cost.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${profit >= 0 ? "text-status-ontrack" : "text-status-atrisk"}`}>
                              {profit < 0 ? "-" : ""}{currency} {Math.abs(profit).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${profit >= 0 ? "text-status-ontrack" : "text-status-atrisk"}`}>
                              {margin}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-between z-20">
              <button
                onClick={() => {
                  const headers = ["Project Name", "Status", "Gross Revenue (SAR)", "Total Cost (SAR)", "Net Profit (SAR)", "Margin (%)"];
                  const rows = activeProjects.map((p) => {
                    const rev = p.totalEarned || 0;
                    const cost = p.totalCost || 0;
                    const profit = rev - cost;
                    const margin = rev > 0 ? (profit / rev * 100).toFixed(1) : "0.0";
                    return [p.name, p.status, rev, cost, profit, `${margin}%`];
                  });
                  const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `Project_Financial_Report_${new Date().toISOString().split("T")[0]}.csv`);
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-all border border-border cursor-pointer"
              >
                <FileDown size={14} /> Export CSV
              </button>
              <button
                onClick={() => setShowFinancialsModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer border-none"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
