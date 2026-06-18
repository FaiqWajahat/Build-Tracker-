/**
 * ScopeConfig.js — Central config for trades, UOM list, and scope helpers
 */

export const TRADES = [
  { value: "Civil & Structural",       icon: "🏗️", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25" },
  { value: "Architectural & Finishes", icon: "🎨", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25" },
  { value: "MEP – Electrical",         icon: "⚡", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25" },
  { value: "MEP – Plumbing",           icon: "🚰", color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25" },
  { value: "MEP – Mechanical (HVAC)",  icon: "❄️", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25" },
  { value: "MEP – Fire Fighting",      icon: "🧯", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25" },
  { value: "Facade & Envelope",        icon: "🪟", color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25" },
  { value: "External Works",           icon: "🌿", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" },
  { value: "Specialist Works",         icon: "🔩", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25" },
  { value: "Infrastructure",           icon: "🛣️", color: "bg-stone-500/15 text-stone-600 dark:text-stone-400 border-stone-500/25" },
  { value: "Preliminaries",            icon: "📋", color: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25" },
  { value: "Interior Design",          icon: "🛋️", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/25" },
];

export const UOM_LIST = [
  // ── Area ──────────────────────────────────────────────────────────
  { value: "m²",    label: "m² — Square Meter",         group: "Area" },
  { value: "ft²",   label: "ft² — Square Foot",         group: "Area" },
  { value: "cm²",   label: "cm² — Square Centimeter",   group: "Area" },
  { value: "km²",   label: "km² — Square Kilometer",    group: "Area" },
  { value: "acre",  label: "acre — Acre",                group: "Area" },
  { value: "ha",    label: "ha — Hectare",               group: "Area" },
  // ── Length ────────────────────────────────────────────────────────
  { value: "LM",    label: "LM — Linear Meter",         group: "Length" },
  { value: "LF",    label: "LF — Linear Foot",          group: "Length" },
  { value: "m",     label: "m — Meter",                 group: "Length" },
  { value: "mm",    label: "mm — Millimeter",           group: "Length" },
  { value: "cm",    label: "cm — Centimeter",           group: "Length" },
  { value: "km",    label: "km — Kilometer",            group: "Length" },
  { value: "inch",  label: "inch — Inch",               group: "Length" },
  { value: "ft",    label: "ft — Foot",                 group: "Length" },
  // ── Volume ────────────────────────────────────────────────────────
  { value: "m³",    label: "m³ — Cubic Meter",          group: "Volume" },
  { value: "ft³",   label: "ft³ — Cubic Foot",          group: "Volume" },
  { value: "yd³",   label: "yd³ — Cubic Yard",          group: "Volume" },
  { value: "L",     label: "L — Liter",                 group: "Volume" },
  { value: "mL",    label: "mL — Milliliter",           group: "Volume" },
  { value: "gal",   label: "gal — Gallon",              group: "Volume" },
  // ── Weight / Mass ─────────────────────────────────────────────────
  { value: "ton",   label: "ton — Metric Ton",          group: "Weight" },
  { value: "kg",    label: "kg — Kilogram",             group: "Weight" },
  { value: "g",     label: "g — Gram",                  group: "Weight" },
  { value: "lb",    label: "lb — Pound",                group: "Weight" },
  { value: "MT",    label: "MT — Metric Ton (alt)",     group: "Weight" },
  // ── Quantity / Count ──────────────────────────────────────────────
  { value: "No.",   label: "No. — Number / Each",       group: "Quantity" },
  { value: "pcs",   label: "pcs — Pieces",              group: "Quantity" },
  { value: "set",   label: "set — Set",                 group: "Quantity" },
  { value: "lot",   label: "lot — Lot",                 group: "Quantity" },
  { value: "pair",  label: "pair — Pair",               group: "Quantity" },
  { value: "roll",  label: "roll — Roll",               group: "Quantity" },
  { value: "box",   label: "box — Box",                 group: "Quantity" },
  { value: "bag",   label: "bag — Bag",                 group: "Quantity" },
  { value: "drum",  label: "drum — Drum",               group: "Quantity" },
  { value: "sheet", label: "sheet — Sheet",             group: "Quantity" },
  { value: "panel", label: "panel — Panel",             group: "Quantity" },
  { value: "point", label: "point — Point",             group: "Quantity" },
  { value: "run",   label: "run — Run",                 group: "Quantity" },
  { value: "span",  label: "span — Span",               group: "Quantity" },
  { value: "bay",   label: "bay — Bay",                 group: "Quantity" },
  { value: "unit",  label: "unit — Unit",               group: "Quantity" },
  { value: "floor", label: "floor — Floor Level",       group: "Quantity" },
  { value: "room",  label: "room — Room",               group: "Quantity" },
  { value: "apt",   label: "apt — Apartment",           group: "Quantity" },
  { value: "villa", label: "villa — Villa",             group: "Quantity" },
  // ── Lump Sum / Job ────────────────────────────────────────────────
  { value: "LS",    label: "LS — Lump Sum",             group: "Lump Sum" },
  { value: "job",   label: "job — Job",                 group: "Lump Sum" },
  { value: "allow", label: "allow — Allowance",         group: "Lump Sum" },
  // ── Time ──────────────────────────────────────────────────────────
  { value: "hr",    label: "hr — Hour",                 group: "Time" },
  { value: "day",   label: "day — Day",                 group: "Time" },
  { value: "week",  label: "week — Week",               group: "Time" },
  { value: "month", label: "month — Month",             group: "Time" },
  { value: "yr",    label: "yr — Year",                 group: "Time" },
  // ── Electrical ────────────────────────────────────────────────────
  { value: "circuit",   label: "circuit — Circuit",     group: "Electrical" },
  { value: "outlet",    label: "outlet — Outlet",       group: "Electrical" },
  { value: "fixture",   label: "fixture — Fixture",     group: "Electrical" },
  { value: "breaker",   label: "breaker — Breaker",     group: "Electrical" },
  { value: "kVA",       label: "kVA — KiloVolt-Amp",   group: "Electrical" },
  { value: "kW",        label: "kW — Kilowatt",         group: "Electrical" },
  // ── Structural ────────────────────────────────────────────────────
  { value: "element",   label: "element — Element",     group: "Structural" },
  { value: "column",    label: "column — Column",       group: "Structural" },
  { value: "beam",      label: "beam — Beam",           group: "Structural" },
  { value: "pile",      label: "pile — Pile",           group: "Structural" },
  { value: "joint",     label: "joint — Joint",         group: "Structural" },
  // ── HVAC / Mechanical ─────────────────────────────────────────────
  { value: "TR",        label: "TR — Ton of Refrigeration", group: "HVAC" },
  { value: "kW(cool)",  label: "kW(cool) — Cooling kW",    group: "HVAC" },
  { value: "CFM",       label: "CFM — Cubic Feet/Min",     group: "HVAC" },
  { value: "m³/hr",     label: "m³/hr — Cubic Meter/Hour", group: "HVAC" },
];

/** Group UOM list by group key */
export function getUomGroups() {
  return UOM_LIST.reduce((acc, u) => {
    if (!acc[u.group]) acc[u.group] = [];
    acc[u.group].push(u);
    return acc;
  }, {});
}

export function getTradeConfig(tradeValue) {
  return TRADES.find((t) => t.value === tradeValue);
}
