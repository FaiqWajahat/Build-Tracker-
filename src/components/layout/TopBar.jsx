"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Search, HelpCircle, X,
  AlertTriangle, CheckCircle, Info,
  Sun, Moon, ChevronRight,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import useProjectStore from "@/store/useProjectStore";

const notifications = [
  { id: 1, title: "Invoice #INV-0034 overdue",      desc: "Al-Rashid Co. · SAR 14,200 · 5 days past due",   time: "2h ago", type: "warning", read: false },
  { id: 2, title: "Tower Block A reached 68%",       desc: "Daily progress submitted by Hassan Usman",         time: "4h ago", type: "success", read: false },
  { id: 3, title: "Asset #AST-012 maintenance due",  desc: "Scaffolding unit requires inspection by Jun 20",  time: "1d ago", type: "info",    read: false },
];

const NT = {
  warning: {
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    borderClass: "border-amber-500/25 dark:border-amber-500/35",
    dotClass: "bg-amber-500",
    icon: AlertTriangle,
    iconColorClass: "text-amber-600 dark:text-amber-400"
  },
  success: {
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderClass: "border-emerald-500/25 dark:border-emerald-500/35",
    dotClass: "bg-emerald-500",
    icon: CheckCircle,
    iconColorClass: "text-emerald-600 dark:text-emerald-400"
  },
  info: {
    bgClass: "bg-primary/10 dark:bg-primary/20",
    borderClass: "border-primary/25 dark:border-primary/35",
    dotClass: "bg-primary",
    icon: Info,
    iconColorClass: "text-primary"
  },
};

const routeMetadata = {
  "/": {
    title: "Dashboard Overview",
    breadcrumbs: [{ label: "Home", href: "/" }]
  },
  "/projects": {
    title: "All Projects",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Projects", href: "/projects" }]
  },
  "/scopes": {
    title: "Scope Library",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Projects" }, { label: "Scope Library", href: "/scopes" }]
  },
  "/labour-teams": {
    title: "Labour Teams",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Workforce" }, { label: "Labour Teams", href: "/labour-teams" }]
  },
  "/contractors": {
    title: "Contractors Directory",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Workforce" }, { label: "Contractors", href: "/contractors" }]
  },
  "/attendance": {
    title: "Daily Attendance",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Workforce" }, { label: "Attendance", href: "/attendance" }]
  },
  "/daily-progress": {
    title: "Daily Progress Logs",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Operations" }, { label: "Daily Progress", href: "/daily-progress" }]
  },
  "/assets": {
    title: "Asset Management",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Operations" }, { label: "Assets", href: "/assets" }]
  },
  "/invoices": {
    title: "Invoices Ledger",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Finance" }, { label: "Invoices", href: "/invoices" }]
  },
  "/sub-payments": {
    title: "Subcontractor Payments",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Finance" }, { label: "Sub Payments", href: "/sub-payments" }]
  },
  "/deductions": {
    title: "Deductions Ledger",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Finance" }, { label: "Deductions", href: "/deductions" }]
  },
  "/settings": {
    title: "System Settings",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "System" }, { label: "Settings", href: "/settings" }]
  },
  "/users": {
    title: "Users & Roles",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "System" }, { label: "Users & Roles", href: "/users" }]
  }
};

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const pathname = usePathname();

  const [notifOpen,     setNotifOpen]     = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifs,        setNotifs]        = useState(notifications);
  const ref = useRef(null);

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const markAllRead = () => setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  const dismiss     = (id) => setNotifs((n) => n.filter((x) => x.id !== id));

  const projects = useProjectStore((s) => s.projects);

  // Fetch meta for current route
  let meta = routeMetadata[pathname];
  if (!meta && pathname.startsWith("/projects/")) {
    const projId = pathname.split("/").pop();
    const proj = projects.find((p) => p.id === projId);
    meta = {
      title: proj ? proj.name : "Project Details",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: proj ? proj.name : "Details" }
      ]
    };
  }
  if (!meta) {
    meta = {
      title: "Dashboard Overview",
      breadcrumbs: [{ label: "Home", href: "/" }]
    };
  }

  return (
    <header className="h-18 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-40 relative gap-4">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-[3px] h-9 rounded-full bg-primary/95" />
        <div className="flex flex-col">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-[11px] text-muted-foreground/75 leading-none mb-0.5">
            {meta.breadcrumbs.map((crumb, idx) => {
              const isLast = idx === meta.breadcrumbs.length - 1;
              if (crumb.href && !isLast) {
                return (
                  <div key={crumb.label} className="flex items-center gap-1">
                    <Link href={crumb.href} className="hover:text-primary transition-colors hover:underline">
                      {crumb.label}
                    </Link>
                    <ChevronRight size={10} className="opacity-30" />
                  </div>
                );
              }
              return (
                <div key={crumb.label} className="flex items-center gap-1">
                  <span className={isLast ? "text-foreground font-semibold" : "opacity-80"}>{crumb.label}</span>
                  {!isLast && <ChevronRight size={10} className="opacity-30" />}
                </div>
              );
            })}
          </nav>
          {/* Page Title */}
          <h1 className="text-[14px] sm:text-[15px] font-extrabold text-foreground leading-tight tracking-tight">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, workers…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`pl-9 pr-3 py-1.5 text-[12.5px] bg-muted text-foreground rounded-lg outline-none w-[210px] transition-all border
              ${searchFocused ? 'border-ring ring-3 ring-ring/15' : 'border-border'}`}
          />
        </div>

        {/* Help */}
        <TopBtn title="Help"><HelpCircle size={15} /></TopBtn>

        {/* Theme Toggle */}
        <button
          onClick={toggle}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center cursor-pointer text-muted-foreground hover:bg-accent hover:border-ring hover:text-primary transition-all shrink-0"
        >
          {isDark
            ? <Sun  size={16} strokeWidth={1.8} />
            : <Moon size={16} strokeWidth={1.8} />}
        </button>

        {/* Notifications */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className={`relative w-9 h-9 rounded-lg border-none flex items-center justify-center cursor-pointer text-muted-foreground transition-colors
              ${notifOpen ? 'bg-accent' : 'bg-transparent hover:bg-muted'}`}
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-destructive border border-card" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[340px] bg-card rounded-xl shadow-lg border border-border overflow-hidden z-100">
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[13.5px] text-foreground">Notifications</p>
                  {unread > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-primary">
                      {unread} new
                    </span>
                  )}
                </div>
                <button onClick={markAllRead} className="text-[11.5px] font-semibold text-primary bg-transparent border-none cursor-pointer hover:underline">
                  Mark all read
                </button>
              </div>

              {/* List */}
              <div className="max-h-[300px] overflow-y-auto">
                {notifs.map((n) => {
                  const s = NT[n.type];
                  const Icon = s.icon;
                  return (
                    <div key={n.id}
                      className={`px-4 py-3 flex items-start gap-3 border-b border-border cursor-pointer transition-colors hover:bg-muted
                        ${n.read ? 'bg-transparent' : s.bgClass}`}
                    >
                      <div className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center shrink-0 ${s.bgClass} ${s.borderClass}`}>
                        <Icon size={13} className={s.iconColorClass} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] text-foreground leading-snug ${n.read ? 'font-normal' : 'font-semibold'}`}>{n.title}</p>
                        <p className="text-[11.5px] text-muted-foreground mt-0.5">{n.desc}</p>
                        <p className="text-[10.5px] text-muted-foreground/70 mt-1">{n.time}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                        className="bg-transparent border-none cursor-pointer text-muted-foreground p-0.5 rounded-sm shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}

                {notifs.length === 0 && (
                  <div className="py-7 px-4 text-center text-muted-foreground text-[13px]">
                    All caught up ✓
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 text-center border-t border-border bg-muted/20">
                <button className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer hover:underline">
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

function TopBarIcon({ children, title }) {
  return (
    <button title={title} className="w-9 h-9 rounded-lg border-none bg-transparent flex items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted transition-colors">
      {children}
    </button>
  );
}

function TopBtn({ children, title }) {
  return (
    <button title={title} className="w-9 h-9 rounded-lg border-none bg-transparent flex items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted transition-colors">
      {children}
    </button>
  );
}
