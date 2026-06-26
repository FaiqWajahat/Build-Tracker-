"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users, Plus, Search, Filter, ChevronRight, MoreHorizontal,
  UserCheck, UserX, Clock, TrendingUp, DollarSign, IdCard,
  Phone, MapPin, Calendar, Briefcase, AlertTriangle, Star,
  Edit2, Trash2, Eye, X, Check, ChevronDown, Award,
  Building2, ArrowUpRight, CalendarDays, Banknote, Activity,
  UserPlus, FileText, Layers,
} from "lucide-react";
import useLabourStore from "@/store/useLabourStore";
import useProjectStore from "@/store/useProjectStore";
import useUserStore from "@/store/useUserStore";
import useAssignmentStore from "@/store/useAssignmentStore";
import useProgressStore from "@/store/useProgressStore";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import useSettingsStore from "@/store/useSettingsStore";
import { Pagination } from "@/components/ui/Pagination";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const TRADES = [
  "Mason", "Carpenter", "Steel Fixer", "Electrician", "Plumber",
  "Painter", "Welder", "Helper", "Tile Fixer", "Plasterer",
  "Foreman", "Supervisor", "Driver", "Crane Operator",
];

const NATIONALITIES = [
  "Pakistani", "Indian", "Bangladeshi", "Nepali", "Filipino",
  "Ethiopian", "Yemeni", "Egyptian", "Sudanese", "Saudi",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const STATUS_CONFIG = {
  present: { label: "Present", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  absent: { label: "Absent", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  "half-day": { label: "Half Day", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  leave: { label: "On Leave", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function initials(name) {
  return name?.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
}

function fmtCurrency(n) {
  const currency = useSettingsStore.getState().settings.currency || "SAR";
  return currency + " " + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

/* ─── Avatar ────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  ["#4f46e5", "#6366f1"], ["#0891b2", "#06b6d4"], ["#059669", "#10b981"],
  ["#d97706", "#f59e0b"], ["#db2777", "#ec4899"], ["#7c3aed", "#8b5cf6"],
];

function WorkerAvatar({ worker, size = 40 }) {
  const idx = parseInt(worker.id.replace("WRK-", ""), 10) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className="text-white shadow-sm"
    >
      <span style={{ fontSize: size * 0.36, fontWeight: 700 }}>
        {initials(worker.name)}
      </span>
    </div>
  );
}

/* ─── AddWorker Modal ───────────────────────────────────────────────────── */
function AddWorkerModal({ onClose, onSave, editWorker }) {
  const [form, setForm] = useState(
    editWorker || {
      name: "", iqamaNumber: "", nationality: "Pakistani", trade: "Mason",
      payType: "monthly", rate: "", phone: "", emergencyContact: "",
      joinDate: new Date().toISOString().split("T")[0], status: "Active",
      bloodGroup: "B+", iqamaExpiry: "", notes: "",
    }
  );

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.iqamaNumber || !form.rate) return;
    onSave({ ...form, rate: Number(form.rate) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="font-bold text-foreground text-base">
              {editWorker ? "Edit Labour Member" : "Add Labour Member"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the worker&apos;s details and pay information
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Personal Info */}
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-3">
              Personal Information
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name *</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. Mohammad Al-Hussain"
                  value={form.name}
                  onChange={(e) => setF("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Iqama Number *</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="10-digit Iqama No."
                  value={form.iqamaNumber}
                  onChange={(e) => setF("iqamaNumber", e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Iqama Expiry</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.iqamaExpiry}
                  onChange={(e) => setF("iqamaExpiry", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Nationality</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.nationality}
                  onChange={(e) => setF("nationality", e.target.value)}
                >
                  {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Blood Group</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.bloodGroup}
                  onChange={(e) => setF("bloodGroup", e.target.value)}
                >
                  {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="+966 50 000 0000"
                  value={form.phone}
                  onChange={(e) => setF("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Emergency Contact</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Emergency phone"
                  value={form.emergencyContact}
                  onChange={(e) => setF("emergencyContact", e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Trade & Pay */}
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-3">
              Trade & Pay Structure
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Trade / Skill *</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.trade}
                  onChange={(e) => setF("trade", e.target.value)}
                >
                  {TRADES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Pay Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {["monthly", "daily"].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setF("payType", pt)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        form.payType === pt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {pt === "monthly" ? "Monthly Salary" : "Daily Wage"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Rate ({useSettingsStore.getState().settings.currency || "SAR"} / {form.payType === "monthly" ? "month" : "day"}) *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder={form.payType === "monthly" ? "e.g. 2800" : "e.g. 120"}
                  value={form.rate}
                  onChange={(e) => setF("rate", e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Join Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.joinDate}
                  onChange={(e) => setF("joinDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Status</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.status}
                  onChange={(e) => setF("status", e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Notes</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  rows={2}
                  placeholder="Any special notes about this worker..."
                  value={form.notes}
                  onChange={(e) => setF("notes", e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              {editWorker ? "Save Changes" : "Add Worker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Worker Card ───────────────────────────────────────────────────────── */
function WorkerCard({ worker, onEdit, onDelete, onClick, isReadOnly }) {
  const { attendance, advances } = useLabourStore();
  const [showMenu, setShowMenu] = useState(false);

  const from = new Date(); from.setDate(from.getDate() - 30);
  const fromStr = from.toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

  const workerAtt = attendance.filter(
    (a) => a.workerId === worker.id && a.date >= fromStr && a.date <= todayStr
  );
  const presentDays = workerAtt.filter((a) => a.status === "present").length;
  const absentDays = workerAtt.filter((a) => a.status === "absent").length;
  const todayAtt = attendance.find((a) => a.workerId === worker.id && a.date === todayStr);

  const pendingAdvances = advances
    .filter((a) => a.workerId === worker.id && a.status === "pending")
    .reduce((s, a) => s + a.amount, 0);

  const iqamaExpiry = daysUntilExpiry(worker.iqamaExpiry);
  const iqamaWarning = iqamaExpiry !== null && iqamaExpiry <= 60;

  const statusColor = worker.status === "Active"
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : worker.status === "On Leave"
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "bg-rose-500/10 text-rose-600 dark:text-rose-400";

  const todayDot = todayAtt
    ? todayAtt.status === "present" ? "#10b981"
    : todayAtt.status === "absent" ? "#ef4444"
    : todayAtt.status === "half-day" ? "#f59e0b"
    : "#3b82f6"
    : null;

  return (
    <div
      className="group bg-card border border-border rounded-2xl p-4 hover:shadow-lg hover:border-primary/25 transition-all duration-200 cursor-pointer relative"
      onClick={() => onClick(worker)}
    >
      {!isReadOnly && (
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={14} className="text-muted-foreground" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-7 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[130px] z-20">
              <button
                onClick={() => { setShowMenu(false); onEdit(worker); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground transition-colors"
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={() => { setShowMenu(false); onClick(worker); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground transition-colors"
              >
                <Eye size={12} /> View Profile
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { setShowMenu(false); onDelete(worker.id); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-rose-500/10 text-rose-600 transition-colors"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <WorkerAvatar worker={worker} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground text-sm truncate">{worker.name}</span>
            {iqamaWarning && (
              <AlertTriangle size={11} className="text-amber-500 shrink-0" title={`Iqama expires in ${iqamaExpiry} days`} />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{worker.trade} · {worker.nationality}</p>
          <span className={`mt-1.5 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
            {worker.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-muted/50 rounded-lg">
        <IdCard size={11} className="text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground">
          Iqama: <span className="font-mono text-foreground font-medium">{worker.iqamaNumber || "—"}</span>
        </span>
        {iqamaExpiry !== null && (
          <span className={`ml-auto text-[10px] font-semibold ${iqamaExpiry <= 30 ? "text-rose-500" : iqamaExpiry <= 60 ? "text-amber-500" : "text-muted-foreground"}`}>
            {iqamaExpiry > 0 ? `${iqamaExpiry}d left` : "EXPIRED"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted-foreground">Pay Rate</div>
        <div className="text-xs font-bold text-foreground">
          {fmtCurrency(worker.rate)}
          <span className="font-normal text-muted-foreground">/{worker.payType === "monthly" ? "mo" : "day"}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-xl px-2.5 py-1.5 text-center" style={{ background: "rgba(16,185,129,0.08)" }}>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{presentDays}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Present</div>
        </div>
        <div className="flex-1 rounded-xl px-2.5 py-1.5 text-center" style={{ background: "rgba(239,68,68,0.08)" }}>
          <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{absentDays}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Absent</div>
        </div>
        <div className="flex-1 bg-muted/60 rounded-xl px-2.5 py-1.5 text-center">
          {todayDot ? (
            <div className="flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: todayDot }} />
            </div>
          ) : (
            <div className="text-sm font-bold text-foreground">—</div>
          )}
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">Today</div>
        </div>
      </div>

      {pendingAdvances > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          <DollarSign size={10} />
          Pending advance: {fmtCurrency(pendingAdvances)}
        </div>
      )}
    </div>
  );
}

/* ─── Summary KPI Row ───────────────────────────────────────────────────── */
function SummaryRow({ workers, attendance }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const active = workers.filter((w) => w.status === "Active").length;
  const todayPresent = attendance.filter((a) => a.date === todayStr && a.status === "present").length;
  const expiringIqama = workers.filter((w) => {
    const d = daysUntilExpiry(w.iqamaExpiry);
    return d !== null && d <= 60 && d >= 0;
  }).length;

  const monthly = workers.filter((w) => w.payType === "monthly").reduce((s, w) => s + w.rate, 0);
  const daily = workers.filter((w) => w.payType === "daily");
  const approxDaily = daily.reduce((s, w) => s + w.rate * 26, 0);

  const kpis = [
    { label: "Total Labour", value: workers.length, sub: `${active} active`, icon: Users, color: "blue" },
    { label: "Present Today", value: todayPresent, sub: `of ${active} active`, icon: UserCheck, color: "emerald" },
    { label: "Monthly Payroll Est.", value: fmtCurrency(monthly + approxDaily), sub: "All workers", icon: Banknote, color: "purple" },
    { label: "Iqama Expiring", value: expiringIqama, sub: "Within 60 days", icon: AlertTriangle, color: "amber" },
  ];

  const colorMap = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {kpis.map((k) => (
        <div key={k.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[k.color]}`}>
            <k.icon size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground leading-tight">{k.value}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{k.label}</div>
            <div className="text-[10px] text-muted-foreground">{k.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function LabourPage() {
  const {
    workers, attendance, advances, teams,
    addWorker, updateWorker, deleteWorker, fetchLabourData,
    loading, loaded
  } = useLabourStore();
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";
  const currency = useSettingsStore((s) => s.settings.currency);

  const fetchAssignments = useAssignmentStore((s) => s.fetchAssignments);
  const fetchLogs = useProgressStore((s) => s.fetchLogs);
  const allAssignments = useAssignmentStore((s) => s.assignments);
  const allLogs = useProgressStore((s) => s.logs);

  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [payFilter, setPayFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [activeTab, setActiveTab] = useState("workers");
  const [deleteWorkerTarget, setDeleteWorkerTarget] = useState(null);

  useEffect(() => {
    fetchLabourData();
    fetchAssignments();
    fetchProjects();
    fetchLogs();
  }, [fetchLabourData, fetchAssignments, fetchProjects, fetchLogs]);

  useEffect(() => {
    if (typeof window !== "undefined" && workers.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const workerId = params.get("workerId");
      if (workerId) {
        const found = workers.find(w => w.id === workerId || w.display_id === workerId);
        if (found) {
          const timer = setTimeout(() => {
            setSelectedWorker(found);
          }, 0);
          return () => clearTimeout(timer);
        }
      }
      const teamId = params.get("teamId");
      if (teamId) {
        const timer = setTimeout(() => {
          setActiveTab("teams");
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [workers]);

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const q = search.toLowerCase();
      const matchSearch = !q || w.name.toLowerCase().includes(q) ||
        w.iqamaNumber?.includes(q) || w.trade.toLowerCase().includes(q) ||
        w.nationality.toLowerCase().includes(q);
      const matchTrade = tradeFilter === "All" || w.trade === tradeFilter;
      const matchStatus = statusFilter === "All" || w.status === statusFilter;
      const matchPay = payFilter === "All" || w.payType === payFilter;
      return matchSearch && matchTrade && matchStatus && matchPay;
    });
  }, [workers, search, tradeFilter, statusFilter, payFilter]);

  function handleSave(data) {
    if (editWorker) {
      updateWorker(editWorker.id, data);
      setEditWorker(null);
    } else {
      addWorker(data);
    }
    setShowAddModal(false);
  }

  if (selectedWorker) {
    return (
      <WorkerProfile
        worker={workers.find((w) => w.id === selectedWorker.id) || selectedWorker}
        workers={workers}
        attendance={attendance}
        advances={advances}
        teams={teams}
        projects={projects}
        onBack={() => setSelectedWorker(null)}
        onEdit={() => { setEditWorker(selectedWorker); setSelectedWorker(null); setShowAddModal(true); }}
      />
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-background relative">
      {loading && (
        <Loader 
          message={!loaded ? "Loading workforce data..." : "Saving..."} 
        />
      )}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Labour Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your workforce — profiles, attendance, payroll &amp; team assignments
            </p>
          </div>
        </div>

        <SummaryRow workers={workers} attendance={attendance} />

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-5 w-fit">
          {[
            { key: "workers", label: "Workers", icon: Users },
            { key: "teams", label: "Teams", icon: Layers },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {activeTab === "workers" ? (
          <>
            <div className="flex flex-wrap gap-2 mb-5 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Search by name, Iqama, trade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
              >
                <option value="All">All Trades</option>
                {TRADES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select
                className="px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option>Active</option>
                <option>Inactive</option>
                <option>On Leave</option>
              </select>
              <select
                className="px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={payFilter}
                onChange={(e) => setPayFilter(e.target.value)}
              >
                <option value="All">All Pay Types</option>
                <option value="monthly">Monthly Salary</option>
                <option value="daily">Daily Wage</option>
              </select>
              {(search || tradeFilter !== "All" || statusFilter !== "All" || payFilter !== "All") && (
                <button
                  onClick={() => { setSearch(""); setTradeFilter("All"); setStatusFilter("All"); setPayFilter("All"); }}
                  className="px-3 py-2.5 rounded-xl bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
              {!isReadOnly && (
                <button
                  onClick={() => { setEditWorker(null); setShowAddModal(true); }}
                  className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                >
                  <UserPlus size={15} /> Add Worker
                </button>
              )}
              <span className="text-xs text-muted-foreground">
                {filtered.length} worker{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                  <Users size={24} className="text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-foreground mb-1">No workers found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {workers.length === 0 ? "Add your first labour member to get started" : "Try adjusting your filters"}
                </p>
                {!isReadOnly && workers.length === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Add First Worker
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((w) => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    onEdit={(w) => { setEditWorker(w); setShowAddModal(true); }}
                    onDelete={(id) => setDeleteWorkerTarget(workers.find((x) => x.id === id))}
                    onClick={setSelectedWorker}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <TeamsTab
            teams={teams}
            workers={workers}
            projects={projects}
            isReadOnly={isReadOnly}
            allAssignments={allAssignments}
            allLogs={allLogs}
            currency={currency}
          />
        )}
      </div>

      {showAddModal && (
        <AddWorkerModal
          onClose={() => { setShowAddModal(false); setEditWorker(null); }}
          onSave={handleSave}
          editWorker={editWorker}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteWorkerTarget}
        onClose={() => setDeleteWorkerTarget(null)}
        onConfirm={() => deleteWorker(deleteWorkerTarget.id)}
        title="Delete Worker Profile"
        description="Are you sure you want to delete this worker profile? This will also permanently delete all attendance logs and advance/expense records associated with them."
        itemName={deleteWorkerTarget?.name}
      />
    </div>
  );
}

/* ─── Teams Tab ─────────────────────────────────────────────────────────── */
function TeamsTab({ teams, workers, projects, isReadOnly, allAssignments, allLogs, currency }) {
  const { addTeam, updateTeam, deleteTeam } = useLabourStore();
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-muted-foreground">{teams.length} team{teams.length !== 1 ? "s" : ""} configured</p>
        {!isReadOnly && (
          <button
            onClick={() => { setEditTeam(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={15} /> New Team
          </button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <Layers size={24} className="text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground mb-1">No teams created yet</p>
          <p className="text-sm text-muted-foreground">Create a team and assign workers to a project</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              workers={workers}
              assignments={allAssignments}
              logs={allLogs}
              currency={currency}
              onEdit={(t) => { setEditTeam(t); setShowModal(true); }}
              onDelete={(id) => setDeleteTeamTarget(teams.find((x) => x.id === id))}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TeamModal
          editTeam={editTeam}
          workers={workers}
          projects={projects}
          onClose={() => { setShowModal(false); setEditTeam(null); }}
          onSave={(data) => {
            if (editTeam) updateTeam(editTeam.id, data);
            else addTeam(data);
            setShowModal(false);
            setEditTeam(null);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTeamTarget}
        onClose={() => setDeleteTeamTarget(null)}
        onConfirm={() => deleteTeam(deleteTeamTarget.id)}
        title="Delete Team"
        description="Are you sure you want to delete this team? Workers will be unassigned from this team."
        itemName={deleteTeamTarget?.name}
      />
    </div>
  );
}

/* ─── Team Card ─────────────────────────────────────────────────────────── */
function TeamCard({ team, workers, assignments = [], logs = [], currency = "SAR", onEdit, onDelete, isReadOnly }) {
  const members = team.memberIds.map((id) => workers.find((w) => w.id === id)).filter(Boolean);
  const leader = workers.find((w) => w.id === team.leaderId);

  const statusColor = team.status === "Active"
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : team.status === "Completed"
    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    : "bg-rose-500/10 text-rose-600 dark:text-rose-400";

  // Filter assignments for this specific team (by id or name matching)
  const teamAssignments = assignments.filter(
    (a) => a.assigneeType === "team" && (a.assigneeId === team.id || a.assigneeName?.toLowerCase() === team.name?.toLowerCase())
  );

  let totalContractVal = 0;
  let totalEarnedVal = 0;
  teamAssignments.forEach((a) => {
    const logsFiltered = logs.filter((l) => l.assignmentId === a.id);
    const totalQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (Number(u.qty) || 0), 0)
      : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (Number(p.qty) || 0), 0)
      : Number(a.totalQty) || 0;
    const doneQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (Number(u.done) || 0), 0)
      : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (Number(p.done) || 0), 0)
      : logsFiltered.reduce((s, l) => s + (Number(l.qtyCompleted) || 0), 0);
    totalContractVal += totalQty * (Number(a.subRate) || 0);
    totalEarnedVal += doneQty * (Number(a.subRate) || 0);
  });
  const progressPct = totalContractVal > 0 ? Math.round((totalEarnedVal / totalContractVal) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all group flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-foreground text-sm">{team.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                {team.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 size={11} />
              <span>{team.projectName || "No project assigned"}</span>
            </div>
          </div>
          {!isReadOnly && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(team)} className="p-1.5 rounded-lg hover:bg-muted">
                <Edit2 size={12} className="text-muted-foreground" />
              </button>
              <button onClick={() => onDelete(team.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10">
                <Trash2 size={12} className="text-rose-500" />
              </button>
            </div>
          )}
        </div>

        {leader && (
          <div className="flex items-center gap-2 mb-3 bg-primary/5 rounded-xl px-3 py-2">
            <WorkerAvatar worker={leader} size={28} />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Team Leader</div>
              <div className="text-xs font-semibold text-foreground">{leader.name}</div>
            </div>
            <Award size={14} className="ml-auto text-primary" />
          </div>
        )}

        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">
            Members ({members.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {members.slice(0, 8).map((w) => {
              const idx = parseInt(w.id.replace("WRK-", ""), 10) % AVATAR_COLORS.length;
              return (
                <div key={w.id} title={w.name} className="flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${AVATAR_COLORS[idx][0]}, ${AVATAR_COLORS[idx][1]})`,
                      fontSize: 7, fontWeight: 700,
                    }}
                  >
                    {initials(w.name)}
                  </div>
                  <span className="text-[10px] text-foreground font-medium">{w.name.split(" ")[0]}</span>
                </div>
              );
            })}
            {members.length > 8 && (
              <span className="text-[10px] text-muted-foreground self-center">+{members.length - 8} more</span>
            )}
          </div>
        </div>

        {/* Assigned Scopes Summary */}
        <div className="mb-4 bg-muted/30 border border-border/40 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Layers size={11} className="text-primary" /> Assigned Scopes ({teamAssignments.length})
            </span>
            {teamAssignments.length > 0 && (
              <span className="text-[11px] font-bold text-primary">{progressPct}%</span>
            )}
          </div>
          {teamAssignments.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic">No project scopes assigned yet</p>
          ) : (
            <div className="space-y-2">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted-foreground">Labour Value:</span>
                <span className="font-extrabold text-foreground">
                  {currency} {totalEarnedVal.toLocaleString()} <span className="text-muted-foreground font-normal text-[9.5px]">of {currency} {totalContractVal.toLocaleString()}</span>
                </span>
              </div>
              {/* List first 2 scopes */}
              <div className="space-y-1 pt-1.5 border-t border-border/30">
                {teamAssignments.slice(0, 2).map((a) => {
                  const aLogs = logs.filter((l) => l.assignmentId === a.id);
                  const totalQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (Number(u.qty) || 0), 0)
                    : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (Number(p.qty) || 0), 0)
                    : Number(a.totalQty) || 0;
                  const doneQty = a.level === "unit" ? (a.unitBreakdown || []).reduce((s, u) => s + (Number(u.done) || 0), 0)
                    : a.level === "phase" ? (a.phaseBreakdown || []).reduce((s, p) => s + (Number(p.done) || 0), 0)
                    : aLogs.reduce((s, l) => s + (Number(l.qtyCompleted) || 0), 0);
                  const aPct = totalQty > 0 ? Math.round((doneQty / totalQty) * 100) : 0;
                  return (
                    <div key={a.id} className="flex justify-between items-center text-[10px]">
                      <span className="text-foreground/80 truncate max-w-[155px] font-medium">{a.tradeIcon || "🏗️"} {a.scopeName}</span>
                      <span className="text-muted-foreground font-mono">{aPct}% ({doneQty}/{totalQty} {a.uom})</span>
                    </div>
                  );
                })}
                {teamAssignments.length > 2 && (
                  <p className="text-[9px] text-muted-foreground text-right font-semibold">+ {teamAssignments.length - 2} more assignments</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border pt-3">
        <span className="flex items-center gap-1"><Briefcase size={10} /> {team.trade || "General"}</span>
        <span className="flex items-center gap-1"><Calendar size={10} /> {team.startDate} → {team.endDate || "Ongoing"}</span>
        {team.location && <span className="flex items-center gap-1"><MapPin size={10} /> {team.location}</span>}
      </div>
    </div>
  );
}

/* ─── Team Modal ─────────────────────────────────────────────────────────── */
function TeamModal({ editTeam, workers, projects, onClose, onSave }) {
  const [form, setForm] = useState(
    editTeam || {
      name: "", projectId: "", projectName: "", leaderId: "",
      leaderName: "", memberIds: [], trade: "Civil Works",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "", status: "Active", location: "", notes: "",
    }
  );

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter((m) => m !== id)
        : [...f.memberIds, id],
    }));
  };

  function handleSubmit(e) {
    e.preventDefault();
    const leader = workers.find((w) => w.id === form.leaderId);
    const project = projects.find((p) => p.id === form.projectId);
    const memberIds = form.leaderId && !form.memberIds.includes(form.leaderId)
      ? [form.leaderId, ...form.memberIds]
      : form.memberIds;
    onSave({
      ...form,
      leaderName: leader?.name || "",
      projectName: project?.name || "",
      memberIds,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="font-bold text-foreground text-base">
              {editTeam ? "Edit Team" : "Create New Team"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assign workers to a project and define team structure
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-3">Team Info</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Team Name *</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. Civil Alpha Team"
                  value={form.name}
                  onChange={(e) => setF("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Project *</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.projectId}
                  onChange={(e) => setF("projectId", e.target.value)}
                  required
                >
                  <option value="">— Select Project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Trade / Specialization</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.trade}
                  onChange={(e) => setF("trade", e.target.value)}
                >
                  {["Civil Works", "Mechanical & Electrical", "Finishing", "Steel Fixing", "Plumbing", "Painting", "General Labour"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Team Leader</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.leaderId}
                  onChange={(e) => setF("leaderId", e.target.value)}
                >
                  <option value="">— No Leader —</option>
                  {workers.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.trade})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Location / Area</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. Phase A, Floor 3"
                  value={form.location}
                  onChange={(e) => setF("location", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.startDate}
                  onChange={(e) => setF("startDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.endDate}
                  onChange={(e) => setF("endDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Status</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.status}
                  onChange={(e) => setF("status", e.target.value)}
                >
                  <option>Active</option>
                  <option>Completed</option>
                  <option>On Hold</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-3">
              Team Members ({form.memberIds.length} selected)
            </legend>
            <div className="max-h-52 overflow-y-auto space-y-1 border border-border rounded-xl p-2">
              {workers.map((w) => {
                const selected = form.memberIds.includes(w.id);
                const isLeader = form.leaderId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleMember(w.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                      selected
                        ? "bg-primary/8 border border-primary/20"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {selected && <Check size={10} className="text-primary-foreground" />}
                    </div>
                    <WorkerAvatar worker={w} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {w.name}
                        {isLeader && <span className="ml-1.5 text-[10px] text-primary font-bold">(Leader)</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{w.trade} · {w.nationality}</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                      w.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                    }`}>
                      {w.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Notes</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              rows={2}
              placeholder="Team instructions, scope of work..."
              value={form.notes}
              onChange={(e) => setF("notes", e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              {editTeam ? "Save Team" : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Worker Profile ─────────────────────────────────────────────────────── */
function WorkerProfile({ worker, workers, attendance, advances, teams, projects, onBack, onEdit }) {
  const {
    workerAttendance,
    workerAdvances: storeWorkerAdvances,
    fetchWorkerAttendance,
    fetchWorkerAdvances,
    addAttendance, deleteAttendance,
    addAdvance, updateAdvance, deleteAdvance,
    calculatePayable,
    loading, loaded
  } = useLabourStore();

  const [profileTab, setProfileTab] = useState("overview");
  const [showAttModal, setShowAttModal] = useState(false);
  const [showAdvModal, setShowAdvModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [payPeriod, setPayPeriod] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const end = now.toISOString().split("T")[0];
    return { start, end };
  });
  const [attForm, setAttForm] = useState({
    date: new Date().toISOString().split("T")[0],
    projectId: projects[0]?.id || "",
    status: "present",
    hoursWorked: 8,
    overtime: 0,
    notes: "",
  });
  const [advForm, setAdvForm] = useState({
    type: "advance",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    status: "pending",
  });

  const [attPage, setAttPage] = useState(1);
  const [advPage, setAdvPage] = useState(1);

  useEffect(() => {
    fetchWorkerAttendance(worker.id);
    fetchWorkerAdvances(worker.id);
  }, [worker.id, fetchWorkerAttendance, fetchWorkerAdvances]);

  const workerAtt = workerAttendance
    .filter((a) => a.workerId === worker.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const workerAdvances = storeWorkerAdvances
    .filter((a) => a.workerId === worker.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const attLimit = 10;
  const totalAttPages = Math.ceil(workerAtt.length / attLimit);
  const paginatedAtt = workerAtt.slice((attPage - 1) * attLimit, attPage * attLimit);

  const advLimit = 10;
  const totalAdvPages = Math.ceil(workerAdvances.length / advLimit);
  const paginatedAdvances = workerAdvances.slice((advPage - 1) * advLimit, advPage * advLimit);

  const workerTeams = teams.filter(
    (t) => t.memberIds.includes(worker.id) || t.leaderId === worker.id
  );

  const monthlyPayable = calculatePayable(worker.id, payPeriod.start, payPeriod.end);

  const rangeAdvances = workerAdvances.filter((a) => a.date >= payPeriod.start && a.date <= payPeriod.end);

  const totalAdvanceDeducted = rangeAdvances
    .filter((a) => a.type === "advance" && a.status === "deducted")
    .reduce((s, a) => s + a.amount, 0);
  const totalPendingAdvance = rangeAdvances
    .filter((a) => a.type === "advance" && a.status === "pending")
    .reduce((s, a) => s + a.amount, 0);
  const totalBonus = rangeAdvances
    .filter((a) => a.type === "bonus")
    .reduce((s, a) => s + a.amount, 0);
  const netPayable = monthlyPayable - totalPendingAdvance + totalBonus;

  const presentCount = workerAtt.filter((a) => a.status === "present").length;
  const absentCount = workerAtt.filter((a) => a.status === "absent").length;
  const halfDayCount = workerAtt.filter((a) => a.status === "half-day").length;
  const totalDays = workerAtt.length;
  const attendanceRate = totalDays > 0
    ? Math.round(((presentCount + halfDayCount * 0.5) / totalDays) * 100)
    : 0;

  const iqamaExpiry = daysUntilExpiry(worker.iqamaExpiry);
  const activeProjectIds = [...new Set(workerAtt.map((a) => a.projectId))];
  const activeProjects = activeProjectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean);

  const statusColor = worker.status === "Active"
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : "bg-rose-500/10 text-rose-600 dark:text-rose-400";

  const PROFILE_TABS = [
    { key: "overview", label: "Overview" },
    { key: "attendance", label: `Attendance (${workerAtt.length})` },
    { key: "payroll", label: "Payroll" },
    { key: "expenses", label: `Advances (${workerAdvances.length})` },
    { key: "teams", label: `Teams (${workerTeams.length})` },
  ];

  function handleAddAtt(e) {
    e.preventDefault();
    addAttendance({ ...attForm, workerId: worker.id, hoursWorked: Number(attForm.hoursWorked), overtime: Number(attForm.overtime) });
    setShowAttModal(false);
  }

  function handleAddAdv(e) {
    e.preventDefault();
    addAdvance({ ...advForm, workerId: worker.id, amount: Number(advForm.amount) });
    setShowAdvModal(false);
    setAdvForm({ type: "advance", amount: "", date: new Date().toISOString().split("T")[0], description: "", status: "pending" });
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-background relative">
      {loading && (
        <Loader 
          message={!loaded ? "Loading profile data..." : "Saving..."} 
        />
      )}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ChevronRight size={14} className="rotate-180" /> Back to Labour
        </button>

        {/* Profile Header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-5 flex-wrap">
            <WorkerAvatar worker={worker} size={72} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground">{worker.name}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{worker.trade} · {worker.nationality}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>{worker.status}</span>
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2.5 py-1 rounded-full">{worker.id}</span>
                    {iqamaExpiry !== null && iqamaExpiry <= 60 && (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">
                        <AlertTriangle size={11} />
                        Iqama: {iqamaExpiry > 0 ? `${iqamaExpiry}d left` : "EXPIRED"}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <Edit2 size={13} /> Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
            <InfoCell icon={IdCard} label="Iqama No." value={worker.iqamaNumber || "—"} mono />
            <InfoCell icon={Phone} label="Phone" value={worker.phone || "—"} />
            <InfoCell icon={Calendar} label="Join Date" value={worker.joinDate || "—"} />
            <InfoCell icon={Banknote} label="Pay Rate" value={`${fmtCurrency(worker.rate)}/${worker.payType === "monthly" ? "mo" : "day"}`} />
          </div>

          {(worker.bloodGroup || worker.iqamaExpiry) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {worker.bloodGroup && <InfoCell icon={Activity} label="Blood Group" value={worker.bloodGroup} />}
              {worker.iqamaExpiry && <InfoCell icon={CalendarDays} label="Iqama Expiry" value={worker.iqamaExpiry} />}
              {worker.emergencyContact && <InfoCell icon={Phone} label="Emergency Contact" value={worker.emergencyContact} />}
            </div>
          )}
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Attendance Rate", value: `${attendanceRate}%`, color: attendanceRate >= 80 ? "emerald" : "amber" },
            { label: "Month Payable", value: fmtCurrency(monthlyPayable), color: "purple" },
            { label: "Pending Advance", value: fmtCurrency(totalPendingAdvance), color: totalPendingAdvance > 0 ? "amber" : "muted" },
            { label: "Net Payable", value: fmtCurrency(netPayable), color: "blue" },
          ].map((k) => {
            const cMap = { emerald: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", purple: "text-purple-600 dark:text-purple-400", blue: "text-blue-600 dark:text-blue-400", muted: "text-muted-foreground" };
            return (
              <div key={k.label} className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className={`text-lg font-bold ${cMap[k.color]}`}>{k.value}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mt-0.5">{k.label}</div>
              </div>
            );
          })}
        </div>

        {/* Profile Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-5 overflow-x-auto w-fit max-w-full">
          {PROFILE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setProfileTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                profileTab === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {profileTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-primary" /> Active Projects
              </h3>
              {activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No project activity recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {activeProjects.map((p) => {
                    const daysOnProject = workerAtt.filter((a) => a.projectId === p.id).length;
                    return (
                      <div key={p.id} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.client} · {p.location}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">{daysOnProject}d</div>
                          <div className="text-[10px] text-muted-foreground">logged</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {workerTeams.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <Layers size={15} className="text-primary" /> Team Assignments
                </h3>
                <div className="space-y-2">
                  {workerTeams.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.projectName} · {t.trade}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.leaderId === worker.id && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            <Award size={10} /> Leader
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {worker.notes && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                  <FileText size={15} className="text-primary" /> Notes
                </h3>
                <p className="text-sm text-muted-foreground">{worker.notes}</p>
              </div>
            )}
          </div>
        )}

        {profileTab === "attendance" && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">Attendance History</h3>
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-600">{presentCount} Present</span>
                  <span className="text-xs font-semibold text-rose-600">{absentCount} Absent</span>
                  <span className="text-xs font-semibold text-amber-600">{halfDayCount} Half Day</span>
                </div>
              </div>
              <button
                onClick={() => setShowAttModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={12} /> Add Record
              </button>
            </div>
            {workerAtt.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet.</p>
            ) : (
              <>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {paginatedAtt.map((rec) => {
                    const proj = projects.find((p) => p.id === rec.projectId);
                    const sc = STATUS_CONFIG[rec.status] || STATUS_CONFIG.present;
                    const dotColor = rec.status === "present" ? "#10b981" : rec.status === "absent" ? "#ef4444" : rec.status === "half-day" ? "#f59e0b" : "#3b82f6";
                    return (
                      <div key={rec.id} className="flex items-center gap-3 bg-muted/40 hover:bg-muted/60 rounded-xl px-4 py-3 transition-colors group">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">{rec.date}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                            {proj && <span className="text-[10px] text-muted-foreground">{proj.name}</span>}
                          </div>
                          {rec.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{rec.notes}</p>}
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          {rec.hoursWorked}h
                          {rec.overtime > 0 && <span className="text-amber-500"> +{rec.overtime}OT</span>}
                        </div>
                        <button
                          onClick={() => setDeleteTarget({ type: 'attendance', id: rec.id, name: `Attendance on ${rec.date} (${rec.status})` })}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 size={11} className="text-rose-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Pagination
                  page={attPage}
                  totalPages={totalAttPages}
                  onPageChange={setAttPage}
                  loading={loading}
                />
              </>
            )}
          </div>
        )}

        {profileTab === "payroll" && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-foreground text-sm">Payroll Period Summary</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Calculated based on attendance & transactions</p>
              </div>
              
              {/* Date Period Selector */}
              <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-xl border border-border/60">
                <input 
                  type="date" 
                  value={payPeriod.start} 
                  onChange={(e) => setPayPeriod(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent text-xs text-foreground font-semibold px-2 py-1 outline-none border-none cursor-pointer dark:[color-scheme:dark]"
                />
                <span className="text-[10px] text-muted-foreground font-bold font-mono">TO</span>
                <input 
                  type="date" 
                  value={payPeriod.end} 
                  onChange={(e) => setPayPeriod(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent text-xs text-foreground font-semibold px-2 py-1 outline-none border-none cursor-pointer dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <PayrollRow label="Base Rate" value={fmtCurrency(worker.rate)} sub={`per ${worker.payType === "monthly" ? "month" : "day"}`} />
              <PayrollRow label="Present Days (in range)" value={workerAtt.filter((a) => a.date >= payPeriod.start && a.date <= payPeriod.end && a.status === "present").length + " days"} />
              <PayrollRow label="Half Days (in range)" value={workerAtt.filter((a) => a.date >= payPeriod.start && a.date <= payPeriod.end && a.status === "half-day").length + " days"} />
              <div className="h-px bg-border my-2" />
              <PayrollRow label="Calculated Payable" value={fmtCurrency(monthlyPayable)} highlight />
              <PayrollRow label="Bonuses" value={`+ ${fmtCurrency(totalBonus)}`} positive />
              <PayrollRow label="Advances Deducted" value={`− ${fmtCurrency(totalAdvanceDeducted)}`} negative />
              <PayrollRow label="Pending Advance" value={`− ${fmtCurrency(totalPendingAdvance)}`} negative />
              <div className="h-px bg-border my-2" />
              <PayrollRow label="Net Payable" value={fmtCurrency(netPayable)} bold />
            </div>
          </div>
        )}

        {profileTab === "expenses" && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-bold text-foreground text-sm">Advances &amp; Expenses</h3>
              <button
                onClick={() => setShowAdvModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={12} /> Add Entry
              </button>
            </div>
            {workerAdvances.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No advances or expenses recorded.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedAdvances.map((adv) => {
                    const typeConfig = {
                      advance: { label: "Advance", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
                      expense: { label: "Expense", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
                      bonus: { label: "Bonus", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
                    }[adv.type] || { label: adv.type, color: "text-muted-foreground", bg: "bg-muted" };

                    const statusConf = {
                      pending: "bg-amber-500/10 text-amber-600",
                      paid: "bg-emerald-500/10 text-emerald-600",
                      deducted: "bg-blue-500/10 text-blue-600",
                    }[adv.status] || "bg-muted text-muted-foreground";

                    return (
                      <div key={adv.id} className="flex items-start gap-3 bg-muted/40 hover:bg-muted/60 rounded-xl px-4 py-3 transition-colors group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.color}`}>{typeConfig.label}</span>
                            <span className="text-xs font-bold text-foreground">{fmtCurrency(adv.amount)}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusConf}`}>{adv.status}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{adv.description}</p>
                          <p className="text-[10px] text-muted-foreground">{adv.date}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {adv.status === "pending" && (
                            <button onClick={() => updateAdvance(adv.id, { status: "deducted" })} className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors whitespace-nowrap">
                              Mark Deducted
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget({ type: 'advance', id: adv.id, name: `${adv.type} - ${useSettingsStore.getState().settings.currency || "SAR"} ${adv.amount} (${adv.description || 'No description'})` })} className="p-1 rounded hover:bg-rose-500/10">
                            <Trash2 size={11} className="text-rose-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination
                  page={advPage}
                  totalPages={totalAdvPages}
                  onPageChange={setAdvPage}
                  loading={loading}
                />
              </>
            )}
          </div>
        )}

        {profileTab === "teams" && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground text-sm mb-4">Team Assignments</h3>
            {workerTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Not assigned to any team.</p>
            ) : (
              <div className="space-y-3">
                {workerTeams.map((t) => (
                  <div key={t.id} className="bg-muted/40 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                      <div>
                        <div className="font-semibold text-foreground text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.projectName}</div>
                      </div>
                      {t.leaderId === worker.id && (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                          <Award size={11} /> Team Leader
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Briefcase size={10} />{t.trade}</span>
                      <span className="flex items-center gap-1"><MapPin size={10} />{t.location || "—"}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} />{t.startDate} → {t.endDate || "Ongoing"}</span>
                      <span className="flex items-center gap-1"><Users size={10} />{t.memberIds.length} members</span>
                    </div>
                    {t.notes && <p className="mt-2 text-xs text-muted-foreground italic">{t.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAttModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">Add Attendance Record</h3>
              <button onClick={() => setShowAttModal(false)} className="p-1.5 rounded-lg hover:bg-muted"><X size={14} className="text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAddAtt} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Date *</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={attForm.date} onChange={(e) => setAttForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Project</label>
                  <select className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={attForm.projectId} onChange={(e) => setAttForm((f) => ({ ...f, projectId: e.target.value }))}>
                    <option value="">— Select —</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Status *</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <button key={k} type="button"
                        onClick={() => setAttForm((f) => ({ ...f, status: k }))}
                        className={`py-2 rounded-xl text-[11px] font-semibold border transition-all ${attForm.status === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/40"}`}
                      >{v.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Hours Worked</label>
                  <input type="number" min="0" max="24" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={attForm.hoursWorked} onChange={(e) => setAttForm((f) => ({ ...f, hoursWorked: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Overtime Hours</label>
                  <input type="number" min="0" max="12" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={attForm.overtime} onChange={(e) => setAttForm((f) => ({ ...f, overtime: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Notes</label>
                  <input className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder="Optional note..." value={attForm.notes} onChange={(e) => setAttForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAttModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {showAdvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdvModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">Add Advance / Expense</h3>
              <button onClick={() => setShowAdvModal(false)} className="p-1.5 rounded-lg hover:bg-muted"><X size={14} className="text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAddAdv} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ key: "advance", label: "Advance" }, { key: "expense", label: "Expense" }, { key: "bonus", label: "Bonus" }].map((t) => (
                    <button key={t.key} type="button"
                      onClick={() => setAdvForm((f) => ({ ...f, type: t.key }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${advForm.type === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/40"}`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Amount ({useSettingsStore.getState().settings.currency || "SAR"}) *</label>
                  <input type="number" min="0" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder="0" value={advForm.amount} onChange={(e) => setAdvForm((f) => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Date</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={advForm.date} onChange={(e) => setAdvForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Description *</label>
                <input className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="Reason for advance/expense..." value={advForm.description}
                  onChange={(e) => setAdvForm((f) => ({ ...f, description: e.target.value }))} required />
              </div>
              {advForm.type !== "bonus" && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Status</label>
                  <select className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={advForm.status} onChange={(e) => setAdvForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="deducted">Deducted</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdvModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget.type === 'attendance') {
            deleteAttendance(deleteTarget.id);
          } else if (deleteTarget.type === 'advance') {
            deleteAdvance(deleteTarget.id);
          }
        }}
        title={deleteTarget?.type === 'attendance' ? "Delete Attendance Record" : "Delete Transaction"}
        description="Are you sure you want to delete this record? This action cannot be undone."
        itemName={deleteTarget?.name}
      />
    </div>
  );
}

/* ─── Helper Components ─────────────────────────────────────────────────── */
function InfoCell({ icon: Icon, label, value, mono }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={11} className="text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{label}</span>
      </div>
      <span className={`text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function PayrollRow({ label, value, highlight, positive, negative, bold, sub }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-sm ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <div className="text-right">
        <span className={`text-sm font-bold ${
          highlight ? "text-purple-600 dark:text-purple-400"
          : positive ? "text-emerald-600 dark:text-emerald-400"
          : negative ? "text-rose-600 dark:text-rose-400"
          : "text-foreground"
        }`}>{value}</span>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
