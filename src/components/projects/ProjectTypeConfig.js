/**
 * ProjectTypeConfig.js
 * Single source of truth for project type → subtype → structure mappings.
 */

export const PROJECT_TYPES = [
  {
    value: "Residential",
    label: "Residential",
    icon: "🏠",
    subtypes: [
      { value: "Single Villa", label: "Single Villa", structureType: "single_villa" },
      { value: "Villa Complex", label: "Villa Complex", structureType: "villa_complex" },
      { value: "Apartment Block", label: "Apartment Block", structureType: "apartment_block" },
      { value: "Compound", label: "Compound", structureType: "compound" },
    ],
  },
  {
    value: "Commercial",
    label: "Commercial",
    icon: "🏢",
    subtypes: [
      { value: "Office Tower", label: "Office Tower", structureType: "tower" },
      { value: "Mixed-Use Tower", label: "Mixed-Use Tower", structureType: "tower" },
      { value: "Business Park", label: "Business Park", structureType: "compound" },
    ],
  },
  {
    value: "Retail",
    label: "Retail",
    icon: "🛍️",
    subtypes: [
      { value: "Mall", label: "Mall", structureType: "mall" },
      { value: "Strip Mall", label: "Strip Mall", structureType: "mall" },
      { value: "Showroom", label: "Showroom", structureType: "single_villa" },
    ],
  },
  {
    value: "Industrial",
    label: "Industrial",
    icon: "🏭",
    subtypes: [
      { value: "Warehouse", label: "Warehouse", structureType: "industrial" },
      { value: "Factory", label: "Factory", structureType: "industrial" },
      { value: "Logistics Hub", label: "Logistics Hub", structureType: "industrial" },
    ],
  },
  {
    value: "Hospitality",
    label: "Hospitality",
    icon: "🏨",
    subtypes: [
      { value: "Hotel", label: "Hotel", structureType: "tower" },
      { value: "Resort", label: "Resort", structureType: "compound" },
      { value: "Serviced Apartments", label: "Serviced Apartments", structureType: "apartment_block" },
    ],
  },
  {
    value: "Infrastructure",
    label: "Infrastructure",
    icon: "🛣️",
    subtypes: [
      { value: "Road", label: "Road", structureType: "infrastructure" },
      { value: "Bridge", label: "Bridge", structureType: "infrastructure" },
      { value: "Metro Station", label: "Metro Station", structureType: "infrastructure" },
      { value: "Utility Network", label: "Utility Network", structureType: "infrastructure" },
    ],
  },
];

/** Quick lookup: type string → subtypes array */
export function getSubtypes(typeValue) {
  const found = PROJECT_TYPES.find((t) => t.value === typeValue);
  return found ? found.subtypes : [];
}

/** Quick lookup: type + subtype → structureType key */
export function getStructureType(typeValue, subtypeValue) {
  const subtypes = getSubtypes(typeValue);
  const st = subtypes.find((s) => s.value === subtypeValue);
  return st ? st.structureType : null;
}

/** Common floor templates for quick selection */
export const FLOOR_TEMPLATES = [
  { label: "GF + FF + RF", floors: ["GF", "FF", "RF"] },
  { label: "B1 + GF + FF + RF", floors: ["B1", "GF", "FF", "RF"] },
  { label: "GF only", floors: ["GF"] },
  { label: "GF + 1F + 2F + RF", floors: ["GF", "1F", "2F", "RF"] },
  { label: "B2 + B1 + GF + Floors", floors: ["B2", "B1", "GF", "1F", "2F", "3F", "RF"] },
  { label: "Custom", floors: [] },
];

/** Phase color palette */
export const PHASE_COLORS = [
  { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30", dot: "bg-blue-500" },
  { bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/30", dot: "bg-purple-500" },
  { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30", dot: "bg-amber-500" },
  { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/30", dot: "bg-rose-500" },
  { bg: "bg-cyan-500/15", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/30", dot: "bg-cyan-500" },
];

/** Parse a unit input string like "V1-V10" or "101,102,104" or "A1 A2 A3" into an array of unit labels */
export function parseUnitInput(input) {
  if (!input || !input.trim()) return [];
  const str = input.trim();

  // Try range pattern: prefix+number - prefix+number  e.g. V1-V10, 101-110, A1-A5
  const rangeMatch = str.match(/^([A-Za-z]*)(\d+)\s*[-–]\s*([A-Za-z]*)(\d+)$/);
  if (rangeMatch) {
    const prefixStart = rangeMatch[1];
    const numStart = parseInt(rangeMatch[2], 10);
    const prefixEnd = rangeMatch[3] || prefixStart;
    const numEnd = parseInt(rangeMatch[4], 10);
    if (prefixStart === prefixEnd && numStart <= numEnd && numEnd - numStart <= 499) {
      return Array.from({ length: numEnd - numStart + 1 }, (_, i) => `${prefixStart}${numStart + i}`);
    }
  }

  // Try comma or space separated list
  return str
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const WORK_SCOPES = [
  { value: "civil", label: "Civil Works", icon: "🏗️" },
  { value: "mep", label: "MEP", icon: "⚡" },
  { value: "finishes", label: "Finishes", icon: "🎨" },
  { value: "structural", label: "Structural", icon: "🔩" },
  { value: "facade", label: "Facade", icon: "🪟" },
  { value: "landscaping", label: "Landscaping", icon: "🌿" },
  { value: "roads", label: "Roads & Paving", icon: "🛣️" },
  { value: "drainage", label: "Drainage", icon: "🚰" },
  { value: "ff&e", label: "FF&E", icon: "🛋️" },
  { value: "fit-out", label: "Fit-Out", icon: "🏠" },
];
