"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, ChevronLeft, Check, Building2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Step1BasicInfo from "./steps/Step1BasicInfo";
import Step2Structure from "./steps/Step2Structure";
import Step3Scopes from "./steps/Step3Scopes";
import Step4Review from "./steps/Step4Review";
import useProjectStore from "@/store/useProjectStore";
import useAssignmentStore from "@/store/useAssignmentStore";
import { getStructureType } from "./ProjectTypeConfig";

const STEPS = [
  { id: 1, label: "Basic Info", short: "Info" },
  { id: 2, label: "Structure", short: "Structure" },
  { id: 3, label: "Scopes", short: "Scopes" },
  { id: 4, label: "Review", short: "Review" },
];

const INITIAL_BASIC_INFO = {
  name: "",
  client: "",
  location: "",
  pm: "",
  type: "",
  subtype: "",
  startDate: "",
  endDate: "",
};

function parseStructureToDb(type, subtype, structure) {
  const structureType = getStructureType(type, subtype);
  if (!structureType || !structure) return { phases: [], units: [] };

  const phases = [];
  const units = [];
  const colorIds = ["blue", "purple", "amber", "emerald", "rose", "cyan"];

  if (structureType === "villa_complex") {
    const { usePhases, phases: sPhases = [], units: sUnits = [] } = structure;
    if (usePhases !== false) {
      sPhases.forEach((p, idx) => {
        phases.push({
          name: p.name || `Phase ${p.label}`,
          colorId: colorIds[idx % colorIds.length],
        });
        (p.units || []).forEach((uName) => {
          units.push({
            name: uName,
            phaseName: p.name || `Phase ${p.label}`,
            type: "villa",
          });
        });
      });
    } else {
      (sUnits || []).forEach((uName) => {
        units.push({
          name: uName,
          phaseName: null,
          type: "villa",
        });
      });
    }
  } else if (structureType === "apartment_block" || structureType === "tower") {
    const floors = structure.floors || [];
    floors.forEach((f, idx) => {
      phases.push({
        name: f.label,
        colorId: colorIds[idx % colorIds.length],
      });
      (f.units || []).forEach((uName) => {
        units.push({
          name: uName,
          phaseName: f.label,
          type: f.unitType || "apartment",
        });
      });
    });
  } else if (structureType === "mall") {
    const zones = structure.zones || [];
    zones.forEach((z, idx) => {
      phases.push({
        name: z.name,
        colorId: colorIds[idx % colorIds.length],
      });
      (z.shops || []).forEach((sName) => {
        units.push({
          name: sName,
          phaseName: z.name,
          type: "retail",
        });
      });
    });
  } else if (structureType === "industrial") {
    const bays = structure.bays || [];
    bays.forEach((b) => {
      units.push({
        name: b.name,
        phaseName: null,
        type: b.function || "industrial",
      });
    });
  } else if (structureType === "infrastructure") {
    const segments = structure.segments || [];
    segments.forEach((s) => {
      units.push({
        name: s.name,
        phaseName: null,
        type: "infrastructure",
      });
    });
  } else if (structureType === "single_villa") {
    const floors = structure.floors || [];
    floors.forEach((f) => {
      units.push({
        name: f,
        phaseName: null,
        type: "floor",
      });
    });
  } else if (structureType === "compound") {
    const blocks = structure.blocks || [];
    blocks.forEach((b, idx) => {
      phases.push({
        name: b.name,
        colorId: colorIds[idx % colorIds.length],
      });
      (b.units || []).forEach((uName) => {
        units.push({
          name: uName,
          phaseName: b.name,
          type: "unit",
        });
      });
    });
  }

  return { phases, units };
}

function validateStep(step, basicInfo, structure, scopes = []) {
  if (step === 1) {
    return !!(basicInfo.name.trim() && basicInfo.client.trim() && basicInfo.type && basicInfo.subtype && basicInfo.location.trim());
  }
  if (step === 3) {
    // If any scope is selected, every one must have an assignee configured
    if (scopes.length === 0) return true;   // no scopes selected → allowed to proceed
    return scopes.every((sc) => !!sc.assigneeId);
  }
  return true;
}

export default function AddProjectModal({ open, onClose }) {
  const router = useRouter();
  const addProject     = useProjectStore((s) => s.addProject);
  const addAssignment  = useAssignmentStore((s) => s.addAssignment);

  const [step, setStep]       = useState(1);
  const [dir, setDir]         = useState(1);
  const [basicInfo, setBasicInfo] = useState(INITIAL_BASIC_INFO);
  const [structure, setStructure] = useState({});
  const [scopes, setScopes]   = useState([]);
  const [saving, setSaving]   = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setDir(1);
      setBasicInfo(INITIAL_BASIC_INFO);
      setStructure({});
      setScopes([]);
      setSaving(false);
    }
  }, [open]);

  // Reset structure when type/subtype changes
  useEffect(() => {
    setStructure({});
  }, [basicInfo.type, basicInfo.subtype]);

  function goNext() {
    if (step < 4) { setDir(1); setStep((s) => s + 1); }
  }

  function goBack() {
    if (step > 1) { setDir(-1); setStep((s) => s - 1); }
  }

  function goToStep(n) {
    if (n < step) { setDir(-1); setStep(n); }
    else if (n > step && validateStep(step, basicInfo, structure)) { setDir(1); setStep(n); }
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      // 1. Resolve phases and units from the structure config
      const { phases: dbPhases, units: dbUnits } = parseStructureToDb(
        basicInfo.type,
        basicInfo.subtype,
        structure
      );

      // 2. Create the project
      const newProject = await addProject({
        ...basicInfo,
        phases: dbPhases,
        units: dbUnits,
        scopes,
      });

      if (newProject?.id && scopes.length > 0) {
        // 3. Create an assignment for each selected scope using configured values
        // Map phase/unit names to the real display_ids assigned by the DB
        await Promise.all(
          scopes.map((sc) => {
            // Build phaseBreakdown with real IDs from the created project
            const phaseBreakdown = (sc.phaseBreakdown || []).map((pb) => {
              const matched = (newProject.phases || []).find(
                (ph) => ph.name === pb.phaseName
              );
              return { phaseId: matched?.id || pb.phaseName, phaseName: pb.phaseName, qty: Number(pb.qty) || 0, done: 0 };
            });

            // Build unitBreakdown with real IDs from the created project
            const unitBreakdown = (sc.unitBreakdown || []).map((ub) => {
              const matched = (newProject.units || []).find(
                (u) => u.name === ub.unitName
              );
              return { unitId: matched?.id || ub.unitName, qty: Number(ub.qty) || 0, done: 0 };
            });

            return addAssignment({
              projectId:    newProject.id,
              scopeId:      sc.scopeId,
              scopeName:    sc.scopeName,
              trade:        sc.trade,
              tradeIcon:    getTradeIcon(sc.trade),
              uom:          sc.uom,
              level:        sc.level || "project",
              clientRate:   sc.clientRate ? Number(sc.clientRate) : 0,
              subRate:      sc.subRate    ? Number(sc.subRate)    : null,
              assigneeType: sc.assigneeType || "contractor",
              assigneeId:   sc.assigneeId   || "",
              assigneeName: sc.assigneeName  || "TBD – Assign Later",
              totalQty:     sc.level === "project" && sc.totalQty ? Number(sc.totalQty) : 0,
              phaseBreakdown,
              unitBreakdown,
              notes: "Created from project setup wizard",
            }).catch((e) => {
              console.warn("Failed to seed assignment for scope", sc.scopeName, e);
            });
          })
        );
      }

      onClose();
      if (newProject?.id) {
        router.push(`/projects/${newProject.id}`);
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
    } finally {
      setSaving(false);
    }
  }

  const canNext = validateStep(step, basicInfo, structure, scopes);
  const isLastStep = step === 4;

  // Human-readable reason why Next is blocked on step 3
  const step3BlockReason = step === 3 && !canNext
    ? `${scopes.filter((s) => !s.assigneeId).length} scope(s) need an assignee — open Configure on each.`
    : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={saving ? null : onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 size={17} className="text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">Create New Project</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Follow the steps to configure your project structure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const isActive = s.id === step;
              const isDone = s.id < step;
              const isClickable = s.id < step || (s.id === step + 1 && canNext);

              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => goToStep(s.id)}
                    disabled={!isClickable && !isDone && !isActive}
                    className={`flex items-center gap-1.5 shrink-0 transition-all ${isClickable || isActive || isDone ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all shrink-0
                        ${isActive ? "bg-primary text-primary-foreground shadow-md" :
                          isDone ? "bg-primary/20 text-primary" :
                          "bg-muted text-muted-foreground"}`}
                    >
                      {isDone ? <Check size={10} /> : s.id}
                    </span>
                    <span className={`text-[11.5px] font-semibold hidden sm:block whitespace-nowrap
                      ${isActive ? "text-foreground" : isDone ? "text-primary/70" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-2 transition-all ${s.id < step ? "bg-primary/40" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -30 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              {step === 1 && (
                <Step1BasicInfo data={basicInfo} onChange={setBasicInfo} />
              )}
              {step === 2 && (
                <Step2Structure basicInfo={basicInfo} structure={structure} onChange={setStructure} />
              )}
              {step === 3 && (
                <Step3Scopes
                  scopes={scopes}
                  onChange={setScopes}
                  phases={parseStructureToDb(basicInfo.type, basicInfo.subtype, structure).phases}
                  units={parseStructureToDb(basicInfo.type, basicInfo.subtype, structure).units}
                />
              )}
              {step === 4 && (
                <Step4Review basicInfo={basicInfo} structure={structure} scopes={scopes} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30 shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : goBack}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-transparent border border-border rounded-xl cursor-pointer hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 1 ? (
              "Cancel"
            ) : (
              <><ChevronLeft size={14} /> Back</>
            )}
          </button>

          <div className="flex items-center gap-2">
            {/* Step 3: show block reason instead of Skip */}
            {step === 3 && step3BlockReason && (
              <p className="text-[10.5px] text-amber-600 font-semibold max-w-[200px] text-right leading-tight">
                ⚠ {step3BlockReason}
              </p>
            )}

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70"
              >
                {saving ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                {saving ? "Saving..." : "Create Project"}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* Helper: map trade name → emoji icon */
function getTradeIcon(trade) {
  const map = {
    "Civil & Structural": "🏗️",
    "Architectural & Finishes": "🎨",
    "MEP – Electrical": "⚡",
    "MEP – Plumbing": "🚰",
    "MEP – Mechanical": "❄️",
    "MEP – Fire Fighting": "🔥",
    "External Works": "🌿",
    "Facade & Envelope": "🏢",
    "Structural Steel": "🔩",
    "Preliminaries": "📋",
  };
  return map[trade] || "🏗️";
}
