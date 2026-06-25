"use client";

import { PROJECT_TYPES, getStructureType } from "../ProjectTypeConfig";
import { MapPin, Calendar, User, FolderOpen, CheckCircle2 } from "lucide-react";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-[12.5px] font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <Icon size={13} className="text-primary" />
      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h4>
    </div>
  );
}

function StructureSummary({ type, subtype, structure }) {
  const structureType = getStructureType(type, subtype);
  if (!structureType || !structure) return <p className="text-xs text-muted-foreground">No structure configured.</p>;

  if (structureType === "villa_complex") {
    const { usePhases, phases = [], units = [], floors = [] } = structure;
    if (usePhases !== false) {
      return (
        <div className="space-y-2">
          {phases.map((p) => (
            <div key={p.id} className="text-xs bg-muted rounded-lg px-3 py-2">
              <span className="font-bold text-foreground">{p.name}</span>
              <span className="text-muted-foreground mx-2">·</span>
              <span className="text-muted-foreground">{p.units.length} units: {p.units.slice(0, 5).join(", ")}{p.units.length > 5 ? "..." : ""}</span>
              {p.floors.length > 0 && (
                <span className="ml-2 text-muted-foreground">· Floors: {p.floors.join(", ")}</span>
              )}
            </div>
          ))}
          {phases.length === 0 && <p className="text-xs text-muted-foreground">No phases added.</p>}
        </div>
      );
    }
    return (
      <div className="text-xs bg-muted rounded-lg px-3 py-2">
        <span className="font-bold text-foreground">{units.length} units</span>
        {floors.length > 0 && <span className="text-muted-foreground ml-2">· Floors: {floors.join(", ")}</span>}
      </div>
    );
  }

  if (structureType === "apartment_block" || structureType === "tower") {
    const fl = structure.floors || [];
    return (
      <div className="space-y-1.5">
        {fl.map((f) => (
          <div key={f.id} className="text-xs bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="font-bold text-foreground w-8 shrink-0">{f.label}</span>
            {f.unitType && <span className="text-muted-foreground text-[10px] bg-secondary px-1.5 py-0.5 rounded">{f.unitType}</span>}
            <span className="text-muted-foreground">{f.units.length} units: {f.units.slice(0, 4).join(", ")}{f.units.length > 4 ? "..." : ""}</span>
          </div>
        ))}
        {fl.length === 0 && <p className="text-xs text-muted-foreground">No floors added.</p>}
      </div>
    );
  }

  if (structureType === "mall") {
    const zones = structure.zones || [];
    return (
      <div className="space-y-1.5">
        {zones.map((z) => (
          <div key={z.id} className="text-xs bg-muted rounded-lg px-3 py-2">
            <span className="font-bold text-foreground">{z.name}</span>
            <span className="text-muted-foreground ml-2">{z.shops.length} shops</span>
          </div>
        ))}
      </div>
    );
  }

  if (structureType === "industrial") {
    const bays = structure.bays || [];
    return (
      <div className="space-y-1.5">
        {bays.map((b) => (
          <div key={b.id} className="text-xs bg-muted rounded-lg px-3 py-2">
            <span className="font-bold text-foreground">{b.name}</span>
            <span className="text-muted-foreground ml-2">· {b.function}</span>
            {b.area && <span className="text-muted-foreground ml-2">· {b.area} m²</span>}
          </div>
        ))}
      </div>
    );
  }

  if (structureType === "infrastructure") {
    const segs = structure.segments || [];
    return (
      <div className="space-y-1.5">
        {segs.map((s) => (
          <div key={s.id} className="text-xs bg-muted rounded-lg px-3 py-2">
            <span className="font-bold text-foreground">{s.name}</span>
            {s.length && <span className="text-muted-foreground ml-2">· {s.length}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (structureType === "single_villa") {
    const floors = structure.floors || [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {floors.map((f) => (
          <span key={f} className="text-[11px] px-2 py-0.5 bg-secondary border border-border rounded-md font-bold text-foreground">{f}</span>
        ))}
        {floors.length === 0 && <p className="text-xs text-muted-foreground">No floors defined.</p>}
      </div>
    );
  }

  if (structureType === "compound") {
    const blocks = structure.blocks || [];
    return (
      <div className="space-y-1.5">
        {blocks.map((b) => (
          <div key={b.id} className="text-xs bg-muted rounded-lg px-3 py-2">
            <span className="font-bold text-foreground">{b.name}</span>
            <span className="text-muted-foreground ml-2">{b.units.length} units</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function Step4Review({ basicInfo, structure, scopes }) {
  const typeObj = PROJECT_TYPES.find((t) => t.value === basicInfo.type);

  // Group selected scopes by trade for the review
  const scopesByTrade = scopes.reduce((acc, s) => {
    if (!acc[s.trade]) acc[s.trade] = [];
    acc[s.trade].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
        <p className="text-xs font-semibold text-foreground">
          Review your project configuration before saving.
        </p>
      </div>

      {/* Basic Info */}
      <div className="bg-card border border-border rounded-xl p-4">
        <SectionHeader icon={FolderOpen} title="Basic Information" />
        <Row label="Project Name" value={basicInfo.name} />
        <Row label="Client" value={basicInfo.client} />
        <Row label="Type" value={typeObj ? `${typeObj.icon} ${basicInfo.type} → ${basicInfo.subtype}` : ""} />
        <Row label="Location" value={basicInfo.location} />
        <Row label="Project Manager" value={basicInfo.pm} />
        <Row label="Start Date" value={basicInfo.startDate} />
        <Row label="End Date" value={basicInfo.endDate} />
      </div>

      {/* Structure */}
      <div className="bg-card border border-border rounded-xl p-4">
        <SectionHeader icon={MapPin} title="Project Structure" />
        <StructureSummary type={basicInfo.type} subtype={basicInfo.subtype} structure={structure} />
      </div>

      {/* Scopes */}
      {scopes.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader icon={CheckCircle2} title={`Work Scopes (${scopes.length} scope${scopes.length !== 1 ? "s" : ""})`} />
          <div className="space-y-3">
            {Object.entries(scopesByTrade).map(([trade, entries]) => (
              <div key={trade}>
                <p className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{trade}</p>
                <div className="space-y-1.5">
                  {entries.map((entry) => (
                    <div key={entry.scopeId} className="bg-muted rounded-lg px-3 py-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-foreground">{entry.scopeName}</span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">{entry.uom}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.assigneeName ? (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            → {entry.assigneeName} ({entry.assigneeType === "team" ? "Labour Team" : "Contractor"})
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            ⚠ No assignee
                          </span>
                        )}
                        {Number(entry.clientRate) > 0 && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            Client: {entry.clientRate}/{entry.uom}
                          </span>
                        )}
                        {Number(entry.subRate) > 0 && (
                          <span className="text-[10px] font-semibold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded">
                            Sub: {entry.subRate}/{entry.uom}
                          </span>
                        )}
                        {Number(entry.totalQty) > 0 && (
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted-foreground/10 px-1.5 py-0.5 rounded">
                            Qty: {entry.totalQty} {entry.uom}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
