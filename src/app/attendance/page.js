"use client";

import { useState, useMemo, useCallback } from "react";
import {
  CalendarDays, UserCheck, UserX, Clock, Search,
  Plus, ChevronLeft, ChevronRight, MoreHorizontal,
  Download, CheckSquare, X, Check, AlertCircle,
  Layers, BarChart3, TrendingUp, Banknote, Timer,
  Edit2, Trash2, MapPin, Sun, Sunset, Moon, Coffee,
  ArrowUpRight, Filter, Users, Building2, ChevronDown,
} from "lucide-react";
import useLabourStore from "@/store/useLabourStore";
import useProjectStore from "@/store/useProjectStore";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const SHIFT_CONFIG = {
  "full-day":  { label: "Full Day",  icon: Sun,    color: "text-amber-500",   bg: "bg-amber-500/10",   hours: 8 },
  "morning":   { label: "Morning",   icon: Sun,    color: "text-orange-500",  bg: "bg-orange-500/10",  hours: 4 },
  "afternoon": { label: "Afternoon", icon: Sunset, color: "text-purple-500",  bg: "bg-purple-500/10",  hours: 4 },
  "night":     { label: "Night",     icon: Moon,   color: "text-indigo-500",  bg: "bg-indigo-500/10",  hours: 8 },
};

const STATUS_CONFIG = {
  present:    { label: "Present",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", dot: "#10b981" },
  absent:     { label: "Absent",    color: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-500/10",    dot: "#ef4444" },
  "half-day": { label: "Half Day",  color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10",   dot: "#f59e0b" },
  leave:      { label: "On Leave",  color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/10",    dot: "#3b82f6" },
  holiday:    { label: "Holiday",   color: "text-purple-600 dark:text-purple-400",   bg: "bg-purple-500/10",  dot: "#8b5cf6" },
};

const AVATAR_COLORS = [
  ["#4f46e5","#6366f1"],["#0891b2","#06b6d4"],["#059669","#10b981"],
  ["#d97706","#f59e0b"],["#db2777","#ec4899"],["#7c3aed","#8b5cf6"],
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function fmt(n) { return Number(n || 0).toLocaleString("en-SA", { maximumFractionDigits: 1 }); }
function fmtCur(n) { return "SAR " + Number(n || 0).toLocaleString("en-SA", { maximumFractionDigits: 0 }); }
function initials(name) { return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }
function todayStr() { return new Date().toISOString().split("T")[0]; }

function parseTime(t) {
  // "HH:MM" → minutes since midnight
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function calcHours(clockIn, clockOut, breakMinutes = 0) {
  const s = parseTime(clockIn);
  const e = parseTime(clockOut);
  if (s == null || e == null) return 0;
  const net = Math.max(0, e - s - Number(breakMinutes));
  return +(net / 60).toFixed(2);
}
function overtimeHours(total, shiftKey = "full-day") {
  const std = SHIFT_CONFIG[shiftKey]?.hours ?? 8;
  return +Math.max(0, total - std).toFixed(2);
}
function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-SA", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

function Avatar({ worker, size = 36 }) {
  const idx = parseInt((worker.id || "0").replace("WRK-", ""), 10) % AVATAR_COLORS.length;
  const [f, t] = AVATAR_COLORS[idx];
  return (
    <div
      style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${f},${t})`, flexShrink: 0 }}
      className="flex items-center justify-center text-white shadow-sm"
    >
      <span style={{ fontSize: size * 0.36, fontWeight: 700 }}>{initials(worker.name)}</span>
    </div>
  );
}

/* ─── DateNav ───────────────────────────────────────────────────────────── */
function DateNav({ date, onChange }) {
  function shift(days) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().split("T")[0]);
  }
  const isToday = date === todayStr();
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => shift(-1)} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
        <ChevronLeft size={14} className="text-muted-foreground" />
      </button>
      <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl min-w-[160px] justify-center">
        <CalendarDays size={13} className="text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{fmtDate(date)}</span>
        {isToday && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Today</span>}
      </div>
      <button onClick={() => shift(1)} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors" disabled={date >= todayStr()}>
        <ChevronRight size={14} className={date >= todayStr() ? "text-muted-foreground/30" : "text-muted-foreground"} />
      </button>
      {!isToday && (
        <button onClick={() => onChange(todayStr())} className="px-3 py-2 rounded-xl bg-muted border border-border text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors">
          Today
        </button>
      )}
      <input
        type="date"
        value={date}
        max={todayStr()}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
    </div>
  );
}

/* ─── Mark Single Modal ─────────────────────────────────────────────────── */
function MarkModal({ worker, date, existing, projects, onSave, onClose }) {
  const [form, setForm] = useState({
    status: existing?.status || "present",
    shift: existing?.shift || "full-day",
    clockIn: existing?.clockIn || "07:00",
    clockOut: existing?.clockOut || "16:00",
    breakMinutes: existing?.breakMinutes ?? 60,
    projectId: existing?.projectId || projects[0]?.id || "",
    location: existing?.location || "",
    overtime: existing?.overtime || 0,
    notes: existing?.notes || "",
  });

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isDaily = worker?.payType === "daily";
  const needsTimes = form.status !== "absent" && form.status !== "holiday" && isDaily;

  const hours = (!needsTimes)
    ? 0
    : calcHours(form.clockIn, form.clockOut, form.breakMinutes);
  const ot = overtimeHours(hours, form.shift);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      workerId: worker.id,
      date,
      status: form.status,
      shift: needsTimes ? form.shift : null,
      clockIn: needsTimes ? form.clockIn : null,
      clockOut: needsTimes ? form.clockOut : null,
      breakMinutes: needsTimes ? Number(form.breakMinutes) : 0,
      hoursWorked: hours,
      overtime: needsTimes ? ot : 0,
      projectId: form.projectId,
      location: form.location,
      notes: form.notes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-foreground text-sm">Mark Attendance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{worker.name} · {fmtDate(date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={14} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">Status</label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <button key={k} type="button"
                  onClick={() => setF("status", k)}
                  className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all ${form.status === k ? `${v.bg} ${v.color} border-transparent` : "bg-muted border-border text-muted-foreground hover:border-primary/30"}`}
                >{v.label}</button>
              ))}
            </div>
          </div>

          {/* Shift (only if not absent/holiday) */}
          {needsTimes && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">Shift</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(SHIFT_CONFIG).map(([k, v]) => {
                    const Icon = v.icon;
                    return (
                      <button key={k} type="button"
                        onClick={() => setF("shift", k)}
                        className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-0.5 ${form.shift === k ? `${v.bg} ${v.color} border-transparent` : "bg-muted border-border text-muted-foreground hover:border-primary/30"}`}
                      >
                        <Icon size={13} />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Clock In</label>
                  <input type="time" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={form.clockIn} onChange={(e) => setF("clockIn", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Clock Out</label>
                  <input type="time" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={form.clockOut} onChange={(e) => setF("clockOut", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Break (min)</label>
                  <input type="number" min="0" max="120" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={form.breakMinutes} onChange={(e) => setF("breakMinutes", e.target.value)} />
                </div>
              </div>

              {/* Hours preview */}
              <div className="flex items-center gap-4 px-4 py-3 bg-muted/60 rounded-xl">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{fmt(hours)}h</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Net Hours</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className={`text-lg font-bold ${ot > 0 ? "text-amber-500" : "text-muted-foreground"}`}>{fmt(ot)}h</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Overtime</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{fmt(hours - ot)}h</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Regular</div>
                </div>
              </div>
            </>
          )}

          {/* Project & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Project</label>
              <select className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={form.projectId} onChange={(e) => setF("projectId", e.target.value)}>
                <option value="">— No Project —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Location / Area</label>
              <input className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                placeholder="e.g. Villa 801, Floor 3" value={form.location} onChange={(e) => setF("location", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Notes</label>
            <input className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="Optional remark..." value={form.notes} onChange={(e) => setF("notes", e.target.value)} />
          </div>

          </div>
          <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0 bg-card rounded-b-2xl">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Bulk Mark Modal ───────────────────────────────────────────────────── */
function BulkMarkModal({ workers, date, attendance, projects, onSave, onClose }) {
  const [globalStatus, setGlobalStatus] = useState("present");
  const [globalProject, setGlobalProject] = useState(projects[0]?.id || "");
  const [globalClockIn, setGlobalClockIn] = useState("07:00");
  const [globalClockOut, setGlobalClockOut] = useState("16:00");
  const [globalBreak, setGlobalBreak] = useState(60);
  const [globalShift, setGlobalShift] = useState("full-day");
  const [rows, setRows] = useState(
    workers
      .filter((w) => w.status === "Active")
      .map((w) => {
        const ex = attendance.find((a) => a.workerId === w.id && a.date === date);
        return {
          workerId: w.id,
          name: w.name,
          trade: w.trade,
          payType: w.payType,
          included: true,
          status: ex?.status || "present",
          clockIn: ex?.clockIn || "07:00",
          clockOut: ex?.clockOut || "16:00",
          breakMinutes: ex?.breakMinutes ?? 60,
          shift: ex?.shift || "full-day",
          projectId: ex?.projectId || (projects[0]?.id || ""),
          location: ex?.location || "",
          notes: ex?.notes || "",
        };
      })
  );

  const setRow = (id, k, v) => setRows((r) => r.map((row) => row.workerId === id ? { ...row, [k]: v } : row));
  const toggleAll = (v) => setRows((r) => r.map((row) => ({ ...row, included: v })));

  function applyGlobal() {
    setRows((r) => r.map((row) => ({
      ...row,
      status: globalStatus,
      projectId: globalProject || row.projectId,
      clockIn: globalClockIn,
      clockOut: globalClockOut,
      breakMinutes: globalBreak,
      shift: globalShift,
    })));
  }

  function handleSave() {
    const entries = rows.filter((r) => r.included).map((r) => {
      const isDaily = r.payType === "daily";
      const needsTimes = r.status !== "absent" && r.status !== "holiday" && isDaily;
      const h = needsTimes ? calcHours(r.clockIn, r.clockOut, r.breakMinutes) : 0;
      return {
        workerId: r.workerId,
        date,
        status: r.status,
        shift: needsTimes ? r.shift : null,
        clockIn: needsTimes ? r.clockIn : null,
        clockOut: needsTimes ? r.clockOut : null,
        breakMinutes: needsTimes ? r.breakMinutes : 0,
        hoursWorked: h,
        overtime: needsTimes ? overtimeHours(h, r.shift) : 0,
        projectId: r.projectId,
        location: r.location,
        notes: r.notes,
      };
    });
    onSave(entries);
  }

  const allChecked = rows.every((r) => r.included);
  const presentCount = rows.filter((r) => r.included && r.status === "present").length;
  const absentCount = rows.filter((r) => r.included && r.status === "absent").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-foreground text-base">Bulk Attendance Marking</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(date)} · {rows.filter((r) => r.included).length} workers selected</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={15} className="text-muted-foreground" /></button>
        </div>

        {/* Global controls */}
        <div className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-3">Apply to all selected workers</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Status</label>
              <div className="flex gap-1">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <button key={k} type="button"
                    onClick={() => setGlobalStatus(k)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${globalStatus === k ? `${v.bg} ${v.color} border-transparent` : "bg-card border-border text-muted-foreground"}`}
                  >{v.label}</button>
                ))}
              </div>
            </div>
            {rows.some(r => r.payType === "daily") && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Clock In</label>
                  <input type="time" className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={globalClockIn} onChange={(e) => setGlobalClockIn(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Clock Out</label>
                  <input type="time" className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={globalClockOut} onChange={(e) => setGlobalClockOut(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Break (min)</label>
                  <input type="number" min="0" max="120" className="w-20 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={globalBreak} onChange={(e) => setGlobalBreak(Number(e.target.value))} />
                </div>
              </>
            )}
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Project</label>
              <select className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={globalProject} onChange={(e) => setGlobalProject(e.target.value)}>
                <option value="">— Keep individual —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={applyGlobal}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Apply to All
            </button>
          </div>
        </div>

        {/* Worker rows */}
        <div className="flex-1 overflow-y-auto">
          {/* Table header */}
          <div className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border px-6 py-2.5 grid grid-cols-[28px_1fr_1fr_130px_80px_80px_70px_1fr] gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <button onClick={() => toggleAll(!allChecked)} className="flex items-center">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${allChecked ? "bg-primary border-primary" : "border-border"}`}>
                {allChecked && <Check size={10} className="text-primary-foreground" />}
              </div>
            </button>
            <span>Worker</span>
            <span>Status</span>
            <span>Clock In / Out</span>
            <span>Break</span>
            <span>Hours</span>
            <span>OT</span>
            <span>Project</span>
          </div>

          <div className="divide-y divide-border">
            {rows.map((row) => {
              const isDaily = row.payType === "daily";
              const needsTimes = row.status !== "absent" && row.status !== "holiday" && isDaily;
              const h = needsTimes ? calcHours(row.clockIn, row.clockOut, row.breakMinutes) : 0;
              const ot = needsTimes ? overtimeHours(h, row.shift) : 0;
              const sc = STATUS_CONFIG[row.status] || STATUS_CONFIG.present;
              const worker = { id: row.workerId, name: row.name };

              return (
                <div key={row.workerId}
                  className={`px-6 py-3 grid grid-cols-[28px_1fr_1fr_130px_80px_80px_70px_1fr] gap-3 items-center transition-colors ${row.included ? "bg-card" : "bg-muted/20 opacity-50"}`}
                >
                  <button
                    type="button"
                    onClick={() => setRow(row.workerId, "included", !row.included)}
                    className="flex items-center"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${row.included ? "bg-primary border-primary" : "border-border"}`}>
                      {row.included && <Check size={10} className="text-primary-foreground" />}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar worker={worker} size={28} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{row.name}</div>
                      <div className="text-[10px] text-muted-foreground">{row.trade}</div>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    {["present","absent","half-day","leave"].map((s) => {
                      const c = STATUS_CONFIG[s];
                      return (
                        <button key={s} type="button"
                          onClick={() => setRow(row.workerId, "status", s)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${row.status === s ? `${c.bg} ${c.color} border-transparent` : "border-border text-muted-foreground bg-muted"}`}
                        >{c.label}</button>
                      );
                    })}
                  </div>

                  {needsTimes ? (
                    <div className="flex items-center gap-1">
                      <input type="time" className="w-[65px] px-1.5 py-1 rounded-lg bg-muted border border-border text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        value={row.clockIn || ""} onChange={(e) => setRow(row.workerId, "clockIn", e.target.value)} />
                      <span className="text-[10px] text-muted-foreground">→</span>
                      <input type="time" className="w-[65px] px-1.5 py-1 rounded-lg bg-muted border border-border text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        value={row.clockOut || ""} onChange={(e) => setRow(row.workerId, "clockOut", e.target.value)} />
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{!isDaily ? "Monthly" : "—"}</span>
                  )}

                  <div>
                    {needsTimes ? (
                      <input type="number" min="0" max="120" className="w-16 px-1.5 py-1 rounded-lg bg-muted border border-border text-[11px] text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/40"
                        value={row.breakMinutes} onChange={(e) => setRow(row.workerId, "breakMinutes", Number(e.target.value))} />
                    ) : <span className="text-[11px] text-muted-foreground">—</span>}
                  </div>

                  <div className={`text-sm font-bold ${h > 0 ? "text-foreground" : "text-muted-foreground"}`}>{h > 0 ? fmt(h) + "h" : "—"}</div>
                  <div className={`text-sm font-bold ${ot > 0 ? "text-amber-500" : "text-muted-foreground"}`}>{ot > 0 ? fmt(ot) + "h" : "—"}</div>

                  <select className="px-2 py-1 rounded-lg bg-muted border border-border text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    value={row.projectId} onChange={(e) => setRow(row.workerId, "projectId", e.target.value)}>
                    <option value="">—</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4 shrink-0 bg-card">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><span className="font-bold text-emerald-600">{presentCount}</span> Present</span>
            <span><span className="font-bold text-rose-600">{absentCount}</span> Absent</span>
            <span><span className="font-bold text-foreground">{rows.filter((r) => r.included).length}</span> selected of {rows.length}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
              Save {rows.filter((r) => r.included).length} Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Daily Roll Call View ──────────────────────────────────────────────── */
function DailyView({ date, workers, attendance, projects, teams }) {
  const { addAttendance, bulkMarkAttendance, updateAttendance, deleteAttendance } = useLabourStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [markModal, setMarkModal] = useState(null); // worker object
  const [showBulk, setShowBulk] = useState(false);

  const dayRecords = useMemo(() =>
    attendance.filter((a) => a.date === date),
    [attendance, date]
  );

  const activeWorkers = workers.filter((w) => w.status === "Active");

  const enriched = useMemo(() => {
    return activeWorkers.map((w) => {
      const rec = dayRecords.find((a) => a.workerId === w.id);
      const proj = projects.find((p) => p.id === rec?.projectId);
      const team = teams.find((t) => t.memberIds.includes(w.id) || t.leaderId === w.id);
      return { worker: w, rec, proj, team };
    }).filter(({ worker, rec }) => {
      const q = search.toLowerCase();
      const match = !q || worker.name.toLowerCase().includes(q) || worker.trade.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" ||
        (statusFilter === "Unmarked" && !rec) ||
        rec?.status === statusFilter;
      const matchProject = projectFilter === "All" || rec?.projectId === projectFilter;
      return match && matchStatus && matchProject;
    });
  }, [activeWorkers, dayRecords, search, statusFilter, projectFilter, projects, teams]);

  // KPI summary for the day
  const presentCount = dayRecords.filter((r) => r.status === "present").length;
  const absentCount = dayRecords.filter((r) => r.status === "absent").length;
  const halfDayCount = dayRecords.filter((r) => r.status === "half-day").length;
  const leaveCount = dayRecords.filter((r) => r.status === "leave").length;
  const unmarkedCount = activeWorkers.length - dayRecords.length;
  const totalHours = dayRecords.reduce((s, r) => s + (r.hoursWorked || 0), 0);
  const totalOT = dayRecords.reduce((s, r) => s + (r.overtime || 0), 0);

  const kpis = [
    { label: "Present",    value: presentCount,     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: UserCheck },
    { label: "Absent",     value: absentCount,      color: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-500/10",    icon: UserX },
    { label: "Half Day",   value: halfDayCount,     color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10",   icon: Coffee },
    { label: "On Leave",   value: leaveCount,        color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/10",    icon: CalendarDays },
    { label: "Unmarked",   value: unmarkedCount,    color: "text-muted-foreground",                   bg: "bg-muted/60",       icon: AlertCircle },
    { label: "Total Hours",value: fmt(totalHours)+"h", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", icon: Clock },
    { label: "Overtime",   value: fmt(totalOT)+"h", color: "text-orange-600 dark:text-orange-400",   bg: "bg-orange-500/10",  icon: Timer },
  ];

  return (
    <div>
      {/* KPI strip */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-2xl px-3 py-3 flex flex-col gap-1 ${k.bg}`}>
            <k.icon size={14} className={k.color} />
            <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full pl-8 pr-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            placeholder="Search worker, trade..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none"
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Unmarked">Unmarked</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none"
          value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{enriched.length} workers</span>
        <button
          onClick={() => setShowBulk(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          <CheckSquare size={13} /> Bulk Mark
        </button>
      </div>

      {/* Roll call table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1.4fr_90px_90px_110px_110px_80px_80px_60px] gap-3 px-5 py-3 bg-muted/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <span>Worker</span>
          <span>Trade / Team</span>
          <span>Status</span>
          <span>Shift</span>
          <span>Clock In</span>
          <span>Clock Out</span>
          <span>Hours</span>
          <span>OT</span>
          <span>Action</span>
        </div>

        <div className="divide-y divide-border">
          {enriched.map(({ worker, rec, proj, team }) => {
            const sc = rec ? (STATUS_CONFIG[rec.status] || STATUS_CONFIG.present) : null;
            const sh = rec?.shift ? SHIFT_CONFIG[rec.shift] : null;

            return (
              <div key={worker.id}
                className={`grid grid-cols-[1fr_1.4fr_90px_90px_110px_110px_80px_80px_60px] gap-3 px-5 py-3.5 items-center hover:bg-muted/30 transition-colors group ${!rec ? "opacity-70" : ""}`}
              >
                {/* Worker */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar worker={worker} size={32} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{worker.name}</div>
                    <div className="text-[10px] text-muted-foreground">{worker.id}</div>
                  </div>
                </div>

                {/* Trade / Team */}
                <div>
                  <div className="text-xs font-medium text-foreground">{worker.trade}</div>
                  {team && <div className="text-[10px] text-muted-foreground">{team.name}</div>}
                  {proj && <div className="text-[10px] text-primary/80 truncate">{proj.name}</div>}
                </div>

                {/* Status */}
                <div>
                  {sc ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium">Not marked</span>
                  )}
                </div>

                {/* Shift */}
                <div>
                  {worker.payType === "monthly" ? (
                    <span className="text-[10px] text-muted-foreground">Monthly</span>
                  ) : sh ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sh.bg} ${sh.color}`}>{sh.label}</span>
                  ) : <span className="text-[10px] text-muted-foreground">—</span>}
                </div>

                {/* Clock In */}
                <div className="flex items-center gap-1.5 text-xs">
                  {worker.payType === "monthly" ? <span className="text-muted-foreground">—</span> : rec?.clockIn ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-mono font-semibold text-foreground">{rec.clockIn}</span>
                    </>
                  ) : <span className="text-muted-foreground">—</span>}
                </div>

                {/* Clock Out */}
                <div className="flex items-center gap-1.5 text-xs">
                  {worker.payType === "monthly" ? <span className="text-muted-foreground">—</span> : rec?.clockOut ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="font-mono font-semibold text-foreground">{rec.clockOut}</span>
                    </>
                  ) : <span className="text-muted-foreground">—</span>}
                </div>

                {/* Hours */}
                <div className={`text-sm font-bold ${(worker.payType !== "monthly" && rec?.hoursWorked > 0) ? "text-foreground" : "text-muted-foreground"}`}>
                  {(worker.payType !== "monthly" && rec?.hoursWorked > 0) ? fmt(rec.hoursWorked) + "h" : "—"}
                </div>

                {/* OT */}
                <div className={`text-sm font-bold ${(worker.payType !== "monthly" && rec?.overtime > 0) ? "text-amber-500" : "text-muted-foreground"}`}>
                  {(worker.payType !== "monthly" && rec?.overtime > 0) ? "+" + fmt(rec.overtime) + "h" : "—"}
                </div>

                {/* Action */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setMarkModal(worker)}
                    className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    title={rec ? "Edit record" : "Mark attendance"}
                  >
                    {rec ? <Edit2 size={12} className="text-primary" /> : <Plus size={12} className="text-muted-foreground" />}
                  </button>
                  {rec && (
                    <button
                      onClick={() => deleteAttendance(rec.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} className="text-rose-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {enriched.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No workers match your filters.</div>
        )}
      </div>

      {/* Mark Single Modal */}
      {markModal && (
        <MarkModal
          worker={markModal}
          date={date}
          existing={dayRecords.find((a) => a.workerId === markModal.id)}
          projects={projects}
          onClose={() => setMarkModal(null)}
          onSave={(entry) => { addAttendance(entry); setMarkModal(null); }}
        />
      )}

      {/* Bulk Modal */}
      {showBulk && (
        <BulkMarkModal
          workers={workers}
          date={date}
          attendance={attendance}
          projects={projects}
          onClose={() => setShowBulk(false)}
          onSave={(entries) => { bulkMarkAttendance(entries); setShowBulk(false); }}
        />
      )}
    </div>
  );
}

/* ─── Hourly Tracker View ───────────────────────────────────────────────── */
function HourlyView({ date, workers, attendance, projects }) {
  const [projectFilter, setProjectFilter] = useState("All");
  const [search, setSearch] = useState("");

  const dayRecords = attendance.filter((a) => a.date === date && a.clockIn && a.clockOut);

  const filtered = useMemo(() => {
    return dayRecords.map((rec) => {
      const worker = workers.find((w) => w.id === rec.workerId);
      const proj = projects.find((p) => p.id === rec.projectId);
      return { rec, worker, proj };
    }).filter(({ worker, proj, rec }) => {
      if (!worker) return false;
      const q = search.toLowerCase();
      const matchS = !q || worker.name.toLowerCase().includes(q);
      const matchP = projectFilter === "All" || rec.projectId === projectFilter;
      return matchS && matchP;
    }).sort((a, b) => (a.rec.clockIn || "").localeCompare(b.rec.clockIn || ""));
  }, [dayRecords, workers, projects, search, projectFilter]);

  // Timeline: 06:00–20:00
  const START_HOUR = 6;
  const END_HOUR = 20;
  const TOTAL_MINS = (END_HOUR - START_HOUR) * 60;

  function pct(timeStr) {
    const mins = parseTime(timeStr);
    if (mins == null) return 0;
    return Math.max(0, Math.min(100, ((mins - START_HOUR * 60) / TOTAL_MINS) * 100));
  }

  const hourLabels = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const totalHours = filtered.reduce((s, { rec }) => s + (rec.hoursWorked || 0), 0);
  const totalOT = filtered.reduce((s, { rec }) => s + (rec.overtime || 0), 0);

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Workers with Clock Records", value: filtered.length, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
          { label: "Total Hours Logged", value: fmt(totalHours) + "h", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Overtime Hours", value: fmt(totalOT) + "h", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl px-5 py-4 ${k.bg}`}>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-muted-foreground font-semibold mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full pl-8 pr-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none"
            placeholder="Search worker..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none"
          value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Gantt timeline */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Hour axis */}
        <div className="px-[200px] border-b border-border">
          <div className="relative h-8 flex items-center">
            {hourLabels.map((h) => (
              <div key={h}
                className="absolute text-[10px] text-muted-foreground font-mono"
                style={{ left: `${((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%`, transform: "translateX(-50%)" }}
              >
                {h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
              </div>
            ))}
            {/* Now indicator */}
            {date === todayStr() && (() => {
              const now = new Date();
              const nowMins = now.getHours() * 60 + now.getMinutes();
              const p = ((nowMins - START_HOUR * 60) / TOTAL_MINS) * 100;
              if (p < 0 || p > 100) return null;
              return (
                <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80 z-10" style={{ left: `${p}%` }}>
                  <div className="absolute -top-0.5 -left-1 w-2 h-2 rounded-full bg-rose-500" />
                </div>
              );
            })()}
          </div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No clock-in/out records for this date.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(({ rec, worker, proj }) => {
              const inPct = pct(rec.clockIn);
              const outPct = pct(rec.clockOut);
              const barWidth = Math.max(0.5, outPct - inPct);
              const ot = rec.overtime || 0;
              const std = SHIFT_CONFIG[rec.shift || "full-day"]?.hours || 8;

              return (
                <div key={rec.id} className="flex items-center hover:bg-muted/30 transition-colors">
                  {/* Worker info */}
                  <div className="w-[200px] px-4 py-3 flex items-center gap-2.5 shrink-0 border-r border-border">
                    <Avatar worker={worker} size={28} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{worker.name}</div>
                      <div className="text-[10px] text-muted-foreground">{worker.trade}</div>
                    </div>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 px-0 py-3 relative">
                    <div className="relative h-8 mx-2">
                      {/* Grid lines */}
                      {hourLabels.map((h) => (
                        <div key={h} className="absolute top-0 bottom-0 w-px bg-border/40"
                          style={{ left: `${((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }} />
                      ))}

                      {/* Break period (lighter shade within bar) */}
                      {rec.clockIn && rec.clockOut && (
                        <div
                          className="absolute top-1 bottom-1 rounded-xl overflow-hidden shadow-sm"
                          style={{ left: `${inPct}%`, width: `${barWidth}%` }}
                        >
                          {/* Full bar */}
                          <div className="absolute inset-0 bg-primary/20 rounded-xl" />
                          {/* Regular hours */}
                          <div
                            className="absolute top-0 bottom-0 left-0 rounded-xl"
                            style={{
                              width: ot > 0 ? `${((rec.hoursWorked - ot) / rec.hoursWorked) * 100}%` : "100%",
                              background: "linear-gradient(90deg, #8e7a63, #a08a72)",
                            }}
                          />
                          {/* OT section */}
                          {ot > 0 && (
                            <div
                              className="absolute top-0 bottom-0 right-0 rounded-xl"
                              style={{
                                width: `${(ot / rec.hoursWorked) * 100}%`,
                                background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Clock in label */}
                      <div className="absolute -top-1 text-[9px] font-mono text-primary font-bold"
                        style={{ left: `${inPct}%`, transform: "translateX(-50%)" }}>
                        {rec.clockIn}
                      </div>
                      {/* Clock out label */}
                      <div className="absolute -bottom-1 text-[9px] font-mono text-muted-foreground font-bold"
                        style={{ left: `${outPct}%`, transform: "translateX(-50%)" }}>
                        {rec.clockOut}
                      </div>
                    </div>
                  </div>

                  {/* Hours + OT */}
                  <div className="w-[140px] px-4 py-3 shrink-0 border-l border-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-foreground">{fmt(rec.hoursWorked)}h</span>
                      {ot > 0 && (
                        <span className="text-[11px] font-bold text-amber-500">+{fmt(ot)}OT</span>
                      )}
                    </div>
                    {rec.breakMinutes > 0 && (
                      <div className="text-[10px] text-muted-foreground">{rec.breakMinutes}min break</div>
                    )}
                    {proj && <div className="text-[10px] text-primary/80 truncate">{proj.name}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-2.5 rounded-full" style={{ background: "linear-gradient(90deg,#8e7a63,#a08a72)" }} />
            <span className="text-[10px] text-muted-foreground">Regular hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-muted-foreground">Overtime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 bg-rose-500" />
            <span className="text-[10px] text-muted-foreground">Current time</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Monthly Report View ───────────────────────────────────────────────── */
function ReportView({ workers, attendance, projects }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [projectFilter, setProjectFilter] = useState("All");
  const { calculatePayable, calculateHourlyPayable } = useLabourStore();

  const monthStr = String(month + 1).padStart(2, "0");
  const fromDate = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const toDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  // Build calendar days
  const daysInMonth = Array.from({ length: lastDay }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    return `${year}-${monthStr}-${d}`;
  });

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y);
  }

  const activeWorkers = workers.filter((w) => w.status === "Active");

  const report = useMemo(() => {
    return activeWorkers.map((w) => {
      const recs = attendance.filter(
        (a) => a.workerId === w.id && a.date >= fromDate && a.date <= toDate &&
          (projectFilter === "All" || a.projectId === projectFilter)
      );
      const present = recs.filter((r) => r.status === "present").length;
      const absent = recs.filter((r) => r.status === "absent").length;
      const halfDay = recs.filter((r) => r.status === "half-day").length;
      const leave = recs.filter((r) => r.status === "leave").length;
      const totalH = recs.reduce((s, r) => s + (r.hoursWorked || 0), 0);
      const totalOT = recs.reduce((s, r) => s + (r.overtime || 0), 0);
      const payable = calculatePayable(w.id, fromDate, toDate);
      const rate = present + halfDay * 0.5;
      const attRate = daysInMonth.length > 0 ? Math.round((rate / daysInMonth.length) * 100) : 0;

      return { worker: w, present, absent, halfDay, leave, totalH, totalOT, payable, attRate, recs };
    });
  }, [activeWorkers, attendance, fromDate, toDate, projectFilter]);

  const totalPayroll = report.reduce((s, r) => s + r.payable, 0);
  const avgAttRate = report.length > 0 ? Math.round(report.reduce((s, r) => s + r.attRate, 0) / report.length) : 0;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ChevronLeft size={14} className="text-muted-foreground" />
          </button>
          <div className="px-5 py-2 bg-card border border-border rounded-xl min-w-[160px] text-center">
            <span className="font-bold text-foreground text-sm">{monthNames[month]} {year}</span>
          </div>
          <button onClick={() => shiftMonth(1)} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors" disabled={year === now.getFullYear() && month >= now.getMonth()}>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none"
            value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="All">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active Workers", value: activeWorkers.length, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Avg Attendance", value: `${avgAttRate}%`, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Total Payroll", value: fmtCur(totalPayroll), color: "text-purple-600", bg: "bg-purple-500/10" },
          { label: "Work Days", value: daysInMonth.length, color: "text-amber-600", bg: "bg-amber-500/10" },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl px-5 py-4 ${k.bg}`}>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-muted-foreground font-semibold mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Worker report table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 780 }}>
            {/* Header */}
            <div className="grid grid-cols-[1.5fr_70px_70px_70px_60px_90px_80px_90px_90px] gap-3 px-5 py-3 bg-muted/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Worker</span>
              <span>Present</span>
              <span>Absent</span>
              <span>Half Day</span>
              <span>Leave</span>
              <span>Total Hours</span>
              <span>OT Hours</span>
              <span>Att. Rate</span>
              <span>Payable</span>
            </div>

            {report.map(({ worker, present, absent, halfDay, leave, totalH, totalOT, payable, attRate }) => {
              const attColor = attRate >= 90 ? "text-emerald-600" : attRate >= 75 ? "text-amber-600" : "text-rose-600";
              return (
                <div key={worker.id}
                  className="grid grid-cols-[1.5fr_70px_70px_70px_60px_90px_80px_90px_90px] gap-3 px-5 py-3.5 items-center border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar worker={worker} size={30} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{worker.name}</div>
                      <div className="text-[10px] text-muted-foreground">{worker.trade} · {worker.payType === "monthly" ? "Monthly" : "Daily"}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">{present}</div>
                  <div className="text-sm font-bold text-rose-600">{absent}</div>
                  <div className="text-sm font-bold text-amber-600">{halfDay}</div>
                  <div className="text-sm font-bold text-blue-600">{leave}</div>
                  <div className="text-sm font-bold text-foreground">{fmt(totalH)}h</div>
                  <div className={`text-sm font-bold ${totalOT > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                    {totalOT > 0 ? `+${fmt(totalOT)}h` : "—"}
                  </div>
                  <div className={`text-sm font-bold ${attColor}`}>{attRate}%</div>
                  <div className="text-sm font-bold text-foreground">{fmtCur(payable)}</div>
                </div>
              );
            })}

            {/* Footer totals */}
            <div className="grid grid-cols-[1.5fr_70px_70px_70px_60px_90px_80px_90px_90px] gap-3 px-5 py-4 bg-muted/30 border-t-2 border-border">
              <div className="text-xs font-bold text-foreground">TOTALS</div>
              <div className="text-sm font-bold text-emerald-600">{report.reduce((s, r) => s + r.present, 0)}</div>
              <div className="text-sm font-bold text-rose-600">{report.reduce((s, r) => s + r.absent, 0)}</div>
              <div className="text-sm font-bold text-amber-600">{report.reduce((s, r) => s + r.halfDay, 0)}</div>
              <div className="text-sm font-bold text-blue-600">{report.reduce((s, r) => s + r.leave, 0)}</div>
              <div className="text-sm font-bold text-foreground">{fmt(report.reduce((s, r) => s + r.totalH, 0))}h</div>
              <div className="text-sm font-bold text-amber-500">+{fmt(report.reduce((s, r) => s + r.totalOT, 0))}h</div>
              <div className="text-sm font-bold text-foreground">{avgAttRate}%</div>
              <div className="text-sm font-bold text-purple-600">{fmtCur(totalPayroll)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-worker Calendar heatmap */}
      {report.slice(0, 3).map(({ worker, recs }) => (
        <div key={worker.id} className="mt-4 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar worker={worker} size={30} />
            <div>
              <div className="text-sm font-bold text-foreground">{worker.name}</div>
              <div className="text-xs text-muted-foreground">{worker.trade} · {monthNames[month]} {year}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {daysInMonth.map((d) => {
              const rec = recs.find((r) => r.date === d);
              const day = new Date(d + "T00:00:00").getDate();
              const dow = new Date(d + "T00:00:00").getDay();
              const isWeekend = dow === 5 || dow === 6; // Fri/Sat in Saudi
              let bg = isWeekend ? "bg-muted/30 border-dashed" : "bg-muted/60";
              let title = d;
              if (rec) {
                const conf = STATUS_CONFIG[rec.status];
                bg = conf?.bg || "bg-muted";
                title = `${d}: ${conf?.label || rec.status}${rec.hoursWorked ? ` (${fmt(rec.hoursWorked)}h)` : ""}`;
              }
              return (
                <div key={d} title={title}
                  className={`w-8 h-8 rounded-lg border border-transparent flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110 cursor-default ${bg} ${rec ? (STATUS_CONFIG[rec.status]?.color || "") : "text-muted-foreground"}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            {Object.entries(STATUS_CONFIG).slice(0, 4).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${v.bg}`} />
                <span className="text-[10px] text-muted-foreground">{v.label}: {recs.filter((r) => r.status === k).length}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Attendance Page ──────────────────────────────────────────────── */
export default function AttendancePage() {
  const { workers, attendance, teams } = useLabourStore();
  const { projects } = useProjectStore();
  const [date, setDate] = useState(todayStr());
  const [view, setView] = useState("daily"); // daily | hourly | report

  const VIEWS = [
    { key: "daily",  label: "Daily Roll Call", icon: UserCheck },
    { key: "hourly", label: "Hourly Tracker",  icon: Timer },
    { key: "report", label: "Monthly Report",  icon: BarChart3 },
  ];

  const todayAtt = attendance.filter((a) => a.date === todayStr());
  const presentToday = todayAtt.filter((a) => a.status === "present").length;
  const activeCount = workers.filter((w) => w.status === "Active").length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance System</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daily roll call · Clock-in/out tracking · Hourly logging · Monthly reports
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={13} />
              <span>{presentToday} / {activeCount} Present Today</span>
            </div>
          </div>
        </div>

        {/* View tabs + Date nav (only on daily & hourly) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
            {VIEWS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setView(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${view === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          {(view === "daily" || view === "hourly") && (
            <DateNav date={date} onChange={setDate} />
          )}
        </div>

        {/* View content */}
        {view === "daily" && (
          <DailyView date={date} workers={workers} attendance={attendance} projects={projects} teams={teams} />
        )}
        {view === "hourly" && (
          <HourlyView date={date} workers={workers} attendance={attendance} projects={projects} />
        )}
        {view === "report" && (
          <ReportView workers={workers} attendance={attendance} projects={projects} />
        )}
      </div>
    </div>
  );
}
