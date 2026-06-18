"use client";

import { PROJECT_TYPES, getSubtypes } from "../ProjectTypeConfig";

const FIELD = ({ label, children, required }) => (
  <div>
    <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    {children}
  </div>
);

const INPUT = ({ ...props }) => (
  <input
    {...props}
    className="w-full px-3 py-2.5 bg-muted text-foreground text-[13px] rounded-xl border border-border outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/50"
  />
);

export default function Step1BasicInfo({ data, onChange }) {
  const subtypes = getSubtypes(data.type);

  function set(key, value) {
    const patch = { [key]: value };
    // Reset subtype if type changes
    if (key === "type") patch.subtype = "";
    onChange({ ...data, ...patch });
  }

  return (
    <div className="space-y-5">
      {/* Row 1: Project Name + Client */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FIELD label="Project Name" required>
          <INPUT
            type="text"
            value={data.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Al-Nakheel Villa Complex"
          />
        </FIELD>
        <FIELD label="Client" required>
          <INPUT
            type="text"
            value={data.client}
            onChange={(e) => set("client", e.target.value)}
            placeholder="e.g. Al-Rashid Group"
          />
        </FIELD>
      </div>

      {/* Row 2: Project Type + Sub-Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FIELD label="Project Type" required>
          <select
            value={data.type}
            onChange={(e) => set("type", e.target.value)}
            className="w-full px-3 py-2.5 bg-muted text-foreground text-[13px] rounded-xl border border-border outline-none focus:border-ring transition-colors cursor-pointer appearance-none"
          >
            <option value="">Select project type...</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </FIELD>

        <FIELD label="Sub-Type" required>
          <select
            value={data.subtype}
            onChange={(e) => set("subtype", e.target.value)}
            disabled={!data.type}
            className="w-full px-3 py-2.5 bg-muted text-foreground text-[13px] rounded-xl border border-border outline-none focus:border-ring transition-colors cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {data.type ? "Select sub-type..." : "Select a type first"}
            </option>
            {subtypes.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </FIELD>
      </div>

      {/* Row 3: Location + PM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FIELD label="Project Location" required>
          <INPUT
            type="text"
            value={data.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Riyadh, Al-Khobar, Jeddah..."
          />
        </FIELD>
        <FIELD label="Project Manager">
          <INPUT
            type="text"
            value={data.pm}
            onChange={(e) => set("pm", e.target.value)}
            placeholder="e.g. Ahmed Mohammed"
          />
        </FIELD>
      </div>

      {/* Row 4: Start Date + End Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FIELD label="Start Date">
          <INPUT
            type="date"
            value={data.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </FIELD>
        <FIELD label="End Date">
          <INPUT
            type="date"
            value={data.endDate}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </FIELD>
      </div>

      {/* Type preview badge */}
      {data.type && data.subtype && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
          <span className="text-lg">{PROJECT_TYPES.find((t) => t.value === data.type)?.icon}</span>
          <div>
            <p className="text-xs font-semibold text-foreground">
              {data.type} → {data.subtype}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Structure will be configured in the next step based on this selection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
