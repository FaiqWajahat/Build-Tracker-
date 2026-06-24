"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Users, HardHat, ClipboardCheck,
  TrendingUp, Package, FileText, CreditCard, Minus,
  Settings, UserCog, ChevronLeft, ChevronRight, LogOut, BookOpen,
} from "lucide-react";
import useUserStore from "@/store/useUserStore";
import useDashboardStore from "@/store/useDashboardStore";
import { useCompanyName } from "@/store/useSettingsStore";

export default function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const companyName = useCompanyName();

  const { currentUser, logout } = useUserStore();
  const {
    attendanceMarkedToday,
    fetchDashboardData
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "U";

  const navGroups = [
    {
      label: "OVERVIEW",
      items: [
        { icon: LayoutDashboard, label: "Dashboard",     href: "/" },
      ],
    },
    {
      label: "PROJECTS",
      items: [
        { icon: FolderOpen, label: "All Projects",   href: "/projects" },
        { icon: BookOpen,   label: "Scope Library",  href: "/scopes" },
      ],
    },
    {
      label: "WORKFORCE",
      items: [
        { icon: Users,          label: "Labour",       href: "/labour-teams" },
        { icon: HardHat,        label: "Contractors",  href: "/contractors" },
        { icon: ClipboardCheck, label: "Attendance",   href: "/attendance",
          badge: attendanceMarkedToday ? "Marked" : "Pending", badgeType: attendanceMarkedToday ? "today" : "pending" },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        { icon: TrendingUp, label: "Daily Progress", href: "/daily-progress" },
        { icon: Package,    label: "Assets",          href: "/assets" },
      ],
    },
    {
      label: "FINANCE",
      items: [
        { icon: FileText,   label: "Invoices",     href: "/invoices" },
        { icon: CreditCard, label: "Sub Payments", href: "/sub-payments" },
        { icon: Minus,      label: "Deductions",   href: "/deductions" },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        { icon: Settings, label: "Settings",      href: "/settings" },
        { icon: UserCog,  label: "Users & Roles", href: "/users" },
      ],
    },
  ];

  return (
    <aside
      className="bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0 relative transition-all duration-300 ease-in-out select-none"
      style={{
        width: collapsed ? "64px" : "220px",
      }}
    >
      {/* Logo Area */}
      <div className="h-18 shrink-0 border-b border-sidebar-border overflow-hidden bg-sidebar flex items-center">
        {collapsed ? (
          <div className="w-full flex items-center justify-center">
            <BrandMark size={32} />
          </div>
        ) : (
          <div className="flex items-center px-[18px]">
            <img
              src="/logo.png"
              alt={companyName}
              className="h-9 w-full max-w-[160px] object-contain block"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {navGroups.map((group, gi) => (
          <div key={group.label} className="mb-2">
            {!collapsed ? (
              <p className="px-[18px] py-1.5 text-[9px] font-bold tracking-wider uppercase text-sidebar-foreground/40">
                {group.label}
              </p>
            ) : gi > 0 ? (
              <div className="my-2 mx-3.5 h-px bg-sidebar-border" />
            ) : null}

            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center gap-2.5 mx-2 my-0.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative whitespace-nowrap overflow-hidden
                    ${collapsed ? 'justify-center p-2 mx-2.5' : 'px-3 py-2'}
                    ${active
                      ? 'bg-sidebar-primary/10 text-sidebar-primary font-semibold border-l-2 border-sidebar-primary'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                >
                  <Icon
                    size={15}
                    className={`shrink-0 transition-colors duration-150
                      ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground'}`}
                  />

                  {!collapsed && (
                    <>
                      <span className="flex-1 overflow-hidden text-ellipsis">
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge type={item.badgeType}>{item.badge}</Badge>
                      )}
                    </>
                  )}

                  {collapsed && item.badge && (
                    <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full border border-sidebar
                      ${item.badgeType === "today" ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-2 bg-sidebar">
        {!collapsed ? (
          <div className="w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors hover:bg-sidebar-accent group">
            <Avatar initials={initials} />
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-accent-foreground text-[12.5px] font-semibold truncate">
                {currentUser?.name || "User"}
              </p>
              <p className="text-sidebar-foreground/55 text-[10.5px] truncate">
                {currentUser?.role || "Role"}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); logout(); }}
              title="Log Out Session"
              className="p-1 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground/45 hover:text-destructive shrink-0 transition-colors border-none bg-transparent cursor-pointer outline-none flex items-center justify-center"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Avatar initials={initials} />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-[71px] -right-[11px] w-[22px] h-[22px] rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center cursor-pointer z-50 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-primary hover:border-sidebar-primary/30 transition-all shadow-xs"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}

/* Internal components */
function Avatar({ initials }) {
  return (
    <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 tracking-wider shadow-xs">
      {initials}
    </div>
  );
}

function Badge({ type, children }) {
  const isToday = type === "today";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0
      ${isToday
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}
    >
      {children}
    </span>
  );
}

function BrandMark({ size = 36 }) {
  const radius = Math.round(size * 0.26);
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${radius}px`,
        background: "linear-gradient(145deg, var(--sidebar-primary), oklch(from var(--sidebar-primary) calc(l - 0.08) c h))",
        boxShadow: "0 0 0 1px oklch(from var(--sidebar-primary) l c h / 15%), 0 3px 8px oklch(from var(--sidebar-primary) l c h / 20%)",
      }}
      className="flex-shrink-0 relative flex items-center justify-center select-none"
    >
      <span className="text-white text-sm font-extrabold leading-none tracking-tighter drop-shadow-md">
        7
      </span>
      <span className="text-white/75 text-[8px] font-bold leading-none align-top self-start mt-2">
        D
      </span>
    </div>
  );
}
