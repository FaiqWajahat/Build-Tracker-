"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Search, HelpCircle, X,
  AlertTriangle, CheckCircle, Info,
  Sun, Moon, ChevronRight,
  LogOut, User, Shield, ChevronDown,
  FolderKanban, Users, Layers, Wrench, Loader2, Menu
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import useProjectStore from "@/store/useProjectStore";
import useUserStore from "@/store/useUserStore";
import axios from "axios";
import HelpDrawer from "./HelpDrawer";
import useSidebarStore from "@/store/useSidebarStore";
import useNotificationStore from "@/store/useNotificationStore";

function formatTimeAgo(dateInput) {
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
  "/notifications": {
    title: "System Notifications",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "System" }, { label: "Notifications", href: "/notifications" }]
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

  const [notifOpen,      setNotifOpen]      = useState(false);
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState({ workers: [], contractors: [], teams: [] });
  const [loadingSearch,  setLoadingSearch]  = useState(false);
  const [helpOpen,       setHelpOpen]       = useState(false);
  
  const {
    notifications: notifs,
    fetchNotifications,
    markAllAsRead: markAllRead,
    dismissNotification: dismiss,
    markAsRead
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [dateParts,      setDateParts]      = useState({ monthShort: "", dayNum: "", weekday: "", yearNum: "" });
  const [mobileSearch,   setMobileSearch]   = useState(false);
  const ref = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const { toggleMobile } = useSidebarStore();

  const unread = notifs.filter((n) => !n.read).length;

  const { currentUser, users, fetchUsers, logout, login } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setDateParts({
        monthShort: now.toLocaleDateString("en-US", { month: "short" }),
        dayNum: now.getDate().toString(),
        weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
        yearNum: now.getFullYear().toString()
      });
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fn = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setNotifOpen(false); 
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ workers: [], contractors: [], teams: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch meta for current route

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
    <header className="h-18 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 z-40 relative gap-2 md:gap-4">

      {/* ── Mobile search overlay ── */}
      {mobileSearch && (
        <div className="absolute inset-0 z-50 flex items-center gap-2 px-3 bg-card md:hidden">
          <div ref={searchRef} className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, workers…"
              onFocus={() => setSearchFocused(true)}
              className="pl-9 pr-3 py-2 text-[13px] bg-muted text-foreground rounded-xl outline-none w-full border border-ring ring-2 ring-ring/15"
            />
            {searchFocused && searchQuery.trim() && (
              <div className="absolute left-0 top-full mt-2 w-full bg-card rounded-xl shadow-lg border border-border overflow-hidden z-100 p-2 text-xs flex flex-col gap-3">
                {loadingSearch ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-0.5">
                    {projects.filter(p =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.client.toLowerCase().includes(searchQuery.toLowerCase())
                    ).slice(0, 5).map(p => (
                      <Link key={p.id} href={`/projects/${p.id}`}
                        onClick={() => { setSearchFocused(false); setMobileSearch(false); }}
                        className="flex flex-col px-2 py-1.5 hover:bg-muted rounded-lg transition-colors text-foreground decoration-none">
                        <span className="font-semibold text-[12px]">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{p.client} · {p.id}</span>
                      </Link>
                    ))}
                    {searchResults.workers?.map(w => (
                      <Link key={w.id} href={`/labour-teams?workerId=${w.id}`}
                        onClick={() => { setSearchFocused(false); setMobileSearch(false); }}
                        className="flex flex-col px-2 py-1.5 hover:bg-muted rounded-lg transition-colors text-foreground decoration-none">
                        <span className="font-semibold text-[12px]">{w.name}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{w.trade} · {w.id}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => { setMobileSearch(false); setSearchQuery(""); setSearchFocused(false); }}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border-none bg-transparent cursor-pointer outline-none shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hamburger — mobile only */}
      <button
        onClick={toggleMobile}
        className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border-none bg-transparent cursor-pointer outline-none shrink-0"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-2.5 shrink-0 flex-1 md:flex-none min-w-0">
        <div className="w-[3px] h-9 rounded-full bg-primary/95 shrink-0" />
        <div className="flex flex-col min-w-0">
          {/* Breadcrumbs — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground/75 leading-none mb-0.5">
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
          <h1 className="text-[13px] md:text-[15px] font-extrabold text-foreground leading-tight tracking-tight truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Date Widget — desktop only */}
        {dateParts.dayNum && (
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-xl border border-border bg-card shadow-2xs hover:shadow-xs transition-all shrink-0">
            <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg overflow-hidden border border-border bg-muted/40 shrink-0 select-none">
              <div className="w-full bg-primary text-primary-foreground text-[7.5px] font-black py-0.5 text-center leading-none uppercase">
                {dateParts.monthShort}
              </div>
              <div className="flex-1 flex items-center justify-center text-foreground font-black text-[12px] leading-none bg-card/30 w-full">
                {dateParts.dayNum}
              </div>
            </div>
            <div className="flex flex-col leading-none text-left select-none">
              <span className="text-[11.5px] font-extrabold text-foreground">{dateParts.weekday}</span>
              <span className="text-[9.5px] font-bold text-muted-foreground mt-0.5">{dateParts.yearNum}</span>
            </div>
          </div>
        )}

        {/* Search — icon on mobile, input on desktop */}
        <button
          onClick={() => setMobileSearch(true)}
          className="md:hidden w-9 h-9 rounded-lg border-none bg-transparent flex items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted transition-colors outline-none"
          aria-label="Search"
        >
          <Search size={16} />
        </button>
        <div ref={searchRef} className="relative hidden md:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, workers…"
            onFocus={() => setSearchFocused(true)}
            className={`pl-9 pr-3 py-1.5 text-[12.5px] bg-muted text-foreground rounded-lg outline-none w-[210px] transition-all border
              ${searchFocused ? 'border-ring ring-3 ring-ring/15' : 'border-border'}`}
          />

          {searchFocused && searchQuery.trim() && (
            <div className="absolute left-0 top-full mt-2 w-[340px] bg-card rounded-xl shadow-lg border border-border overflow-hidden z-100 p-2 text-xs flex flex-col gap-3">
              {loadingSearch ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto space-y-3 pr-0.5">
                  {/* Projects */}
                  {projects.filter(p =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.client.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 border-b border-border/50 pb-1">
                        <FolderKanban size={11} className="text-primary" /> Projects
                      </div>
                      <div className="flex flex-col mt-1 gap-0.5">
                        {projects.filter(p =>
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.client.toLowerCase().includes(searchQuery.toLowerCase())
                        ).slice(0, 5).map(p => (
                          <Link
                            key={p.id}
                            href={`/projects/${p.id}`}
                            onClick={() => setSearchFocused(false)}
                            className="flex flex-col px-2 py-1.5 hover:bg-muted rounded-lg transition-colors text-foreground decoration-none"
                          >
                            <span className="font-semibold text-[12px]">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{p.client} · {p.id}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Workers */}
                  {searchResults.workers?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 border-b border-border/50 pb-1">
                        <Users size={11} className="text-emerald-500" /> Workers
                      </div>
                      <div className="flex flex-col mt-1 gap-0.5">
                        {searchResults.workers.map(w => (
                          <Link
                            key={w.id}
                            href={`/labour-teams?workerId=${w.id}`}
                            onClick={() => setSearchFocused(false)}
                            className="flex flex-col px-2 py-1.5 hover:bg-muted rounded-lg transition-colors text-foreground decoration-none"
                          >
                            <span className="font-semibold text-[12px]">{w.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{w.trade} · {w.id}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contractors */}
                  {searchResults.contractors?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 border-b border-border/50 pb-1">
                        <Wrench size={11} className="text-amber-500" /> Contractors
                      </div>
                      <div className="flex flex-col mt-1 gap-0.5">
                        {searchResults.contractors.map(c => (
                          <Link
                            key={c.id}
                            href={`/contractors?contractorId=${c.id}`}
                            onClick={() => setSearchFocused(false)}
                            className="flex flex-col px-2 py-1.5 hover:bg-muted rounded-lg transition-colors text-foreground decoration-none"
                          >
                            <span className="font-semibold text-[12px]">{c.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{c.trade} · {c.id}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teams */}
                  {searchResults.teams?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 border-b border-border/50 pb-1">
                        <Layers size={11} className="text-blue-500" /> Teams
                      </div>
                      <div className="flex flex-col mt-1 gap-0.5">
                        {searchResults.teams.map(t => (
                          <Link
                            key={t.id}
                            href={`/labour-teams?teamId=${t.id}`}
                            onClick={() => setSearchFocused(false)}
                            className="flex flex-col px-2 py-1.5 hover:bg-muted rounded-lg transition-colors text-foreground decoration-none"
                          >
                            <span className="font-semibold text-[12px]">{t.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{t.trade} · {t.id}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {projects.filter(p =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.client.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 &&
                   (!searchResults.workers || searchResults.workers.length === 0) &&
                   (!searchResults.contractors || searchResults.contractors.length === 0) &&
                   (!searchResults.teams || searchResults.teams.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground text-[11.5px]">
                      No matches found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help — hidden on mobile */}
        <button
          title="Open Help Center"
          onClick={() => setHelpOpen(true)}
          className="hidden md:flex w-9 h-9 rounded-lg border-none bg-transparent items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted transition-colors outline-none"
        >
          <HelpCircle size={15} />
        </button>

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
            <div className="absolute right-0 top-full mt-2 w-[92vw] md:w-[340px] max-w-[340px] bg-card rounded-xl shadow-lg border border-border overflow-hidden z-100">
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
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={`px-4 py-3 flex items-start gap-3 border-b border-border cursor-pointer transition-colors hover:bg-muted
                        ${n.read ? 'bg-transparent' : s.bgClass}`}
                    >
                      <div className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center shrink-0 ${s.bgClass} ${s.borderClass}`}>
                        <Icon size={13} className={s.iconColorClass} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] text-foreground leading-snug ${n.read ? 'font-normal' : 'font-semibold'}`}>{n.title}</p>
                        <p className="text-[11.5px] text-muted-foreground mt-0.5">{n.description}</p>
                        <p className="text-[10.5px] text-muted-foreground/70 mt-1">{formatTimeAgo(n.createdAt)}</p>
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

              <div className="p-2.5 text-center border-t border-border bg-muted/20">
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-semibold text-primary hover:underline block w-full py-1"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Testing Switcher */}
        <div ref={userMenuRef} className="relative ml-1">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 transition-all cursor-pointer outline-none select-none"
          >
            <div className="w-6.5 h-6.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser ? currentUser.name.split(" ").map(w => w[0]).join("") : "U"}
            </div>
            <div className="flex flex-col items-start leading-none hidden md:flex">
              <span className="text-[11.5px] font-bold text-foreground truncate max-w-[100px]">{currentUser?.name || "User"}</span>
              <span className="text-[9.5px] font-bold text-muted-foreground mt-0.5">{currentUser?.role || "Role"}</span>
            </div>
            <ChevronDown size={11} className={`text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[240px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-100 p-3 flex flex-col gap-2.5">
              {/* Active Profile */}
              <div className="flex flex-col p-2 bg-muted/30 rounded-xl border border-border/40">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active Session</span>
                <span className="text-xs font-bold text-foreground mt-1">{currentUser?.name}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{currentUser?.email}</span>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase border
                    ${currentUser?.role === 'Admin' 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}>
                    {currentUser?.role}
                  </span>
                  <span className="text-[9.5px] font-bold text-muted-foreground/80">({currentUser?.role === 'Admin' ? 'Full Access' : 'Read Only'})</span>
                </div>
              </div>

              {/* Quick Switch for Testing */}
              {currentUser?.role === "Admin" && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-1">Switch Persona (Testing)</span>
                  <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1 pr-0.5">
                    {users.map((u) => {
                      const isActive = u.id === currentUser?.id;
                      return (
                        <button
                          key={u.id}
                          onClick={async () => {
                            if (isActive) return;
                            try {
                              await login(u.email, "password123");
                              setUserMenuOpen(false);
                            } catch (err) {
                              // Already handled by login
                            }
                          }}
                          disabled={isActive}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-left text-xs transition-colors flex items-center justify-between cursor-pointer border-none
                            ${isActive 
                              ? 'bg-primary/15 text-primary font-bold cursor-default' 
                              : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate">{u.name}</span>
                            <span className="text-[9.5px] opacity-75 truncate">{u.role}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => {
                  logout();
                  setUserMenuOpen(false);
                }}
                className="w-full mt-1.5 py-2 bg-destructive/10 hover:bg-destructive/15 text-destructive text-xs font-bold rounded-xl border border-destructive/25 hover:border-destructive/35 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut size={12} /> Log Out Session
              </button>
            </div>
          )}
        </div>

      </div>
      <HelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} pathname={pathname} />
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
