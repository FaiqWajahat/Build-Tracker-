"use client";

import { useState, useEffect } from "react";
import {
  Bell, AlertTriangle, CheckCircle, Info, Trash2, Check, X, Clock, RefreshCw
} from "lucide-react";
import useNotificationStore from "@/store/useNotificationStore";
import useUserStore from "@/store/useUserStore";

const NT = {
  warning: {
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    borderClass: "border-amber-500/20 dark:border-amber-500/30",
    icon: AlertTriangle,
    iconColorClass: "text-amber-600 dark:text-amber-400"
  },
  success: {
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderClass: "border-emerald-500/20 dark:border-emerald-500/30",
    icon: CheckCircle,
    iconColorClass: "text-emerald-600 dark:text-emerald-400"
  },
  info: {
    bgClass: "bg-primary/10 dark:bg-primary/20",
    borderClass: "border-primary/20 dark:border-primary/30",
    icon: Info,
    iconColorClass: "text-primary"
  },
};

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

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    fetchNotifications,
    markAllAsRead,
    dismissNotification,
    markAsRead
  } = useNotificationStore();

  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";

  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "unread") return !n.read;
    if (activeFilter === "warning") return n.type === "warning";
    if (activeFilter === "info") return n.type === "info";
    if (activeFilter === "success") return n.type === "success";
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell size={22} className="text-primary" /> System Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with real-time progress updates, contractor payments, and asset alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchNotifications()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <Check size={15} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 border border-border/80 rounded-xl p-3 mb-6">
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "All Alerts" },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "warning", label: "Warnings" },
            { key: "info", label: "Info" },
            { key: "success", label: "Success" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === tab.key
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </span>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bell size={24} className="text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-foreground mb-1">All caught up ✓</p>
          <p className="text-xs text-muted-foreground">
            {activeFilter === "all" ? "No notifications found in database." : "No notifications match this filter."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden shadow-xs">
          {filteredNotifications.map((n) => {
            const style = NT[n.type] || NT.info;
            const Icon = style.icon;

            return (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`group flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-muted/40 relative
                  ${n.read ? "bg-transparent" : style.bgClass}`}
              >
                {/* Type Icon indicator */}
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${style.bgClass} ${style.borderClass}`}>
                  <Icon size={15} className={style.iconColorClass} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm text-foreground leading-none ${n.read ? "font-normal" : "font-bold"}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">
                    {n.description}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground/60 mt-2 flex items-center gap-1">
                    <Clock size={10} /> {formatTimeAgo(n.createdAt)}
                  </p>
                </div>

                {/* Delete/Dismiss Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(n.id);
                  }}
                  className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground/45 hover:text-destructive hover:bg-muted transition-all cursor-pointer opacity-0 group-hover:opacity-100 border-none bg-transparent"
                  title="Dismiss notification"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
