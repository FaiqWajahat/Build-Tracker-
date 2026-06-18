"use client";

import { getStructureType, PROJECT_TYPES } from "../ProjectTypeConfig";
import VillaComplexConfig from "../structure/VillaComplexConfig";
import ApartmentBlockConfig from "../structure/ApartmentBlockConfig";
import TowerConfig from "../structure/TowerConfig";
import MallConfig from "../structure/MallConfig";
import IndustrialConfig from "../structure/IndustrialConfig";
import InfrastructureConfig from "../structure/InfrastructureConfig";
import SingleVillaConfig from "../structure/SingleVillaConfig";
import CompoundConfig from "../structure/CompoundConfig";

const STRUCTURE_MAP = {
  villa_complex: VillaComplexConfig,
  apartment_block: ApartmentBlockConfig,
  tower: TowerConfig,
  mall: MallConfig,
  industrial: IndustrialConfig,
  infrastructure: InfrastructureConfig,
  single_villa: SingleVillaConfig,
  compound: CompoundConfig,
};

const STRUCTURE_LABELS = {
  villa_complex: { title: "Villa Complex Structure", desc: "Configure phases, villa unit numbers, and floor levels per phase." },
  apartment_block: { title: "Apartment Block Structure", desc: "Define floors and add unit numbers manually for each floor." },
  tower: { title: "Tower / High-Rise Structure", desc: "Add floors, assign unit types and unit numbers per floor." },
  mall: { title: "Mall / Retail Structure", desc: "Create zones or wings, then add shop numbers per zone." },
  industrial: { title: "Industrial Facility Structure", desc: "Define bays or zones with their function and area." },
  infrastructure: { title: "Infrastructure Structure", desc: "Break the project into segments, stations, or sections." },
  single_villa: { title: "Building Floor Structure", desc: "Define the floor levels for this building." },
  compound: { title: "Compound / Campus Structure", desc: "Add blocks or buildings, each with their own unit numbers." },
};

export default function Step2Structure({ basicInfo, structure, onChange }) {
  const { type, subtype } = basicInfo;
  const structureType = getStructureType(type, subtype);
  const typeIcon = PROJECT_TYPES.find((t) => t.value === type)?.icon;

  if (!structureType) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-4xl mb-3">🏗️</span>
        <p className="text-sm font-semibold text-foreground">No structure defined</p>
        <p className="text-xs text-muted-foreground mt-1">
          Go back and select a project type and sub-type to configure structure.
        </p>
      </div>
    );
  }

  const ConfigComponent = STRUCTURE_MAP[structureType];
  const meta = STRUCTURE_LABELS[structureType];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/15">
        <span className="text-2xl leading-none mt-0.5">{typeIcon}</span>
        <div>
          <p className="text-sm font-bold text-foreground">{meta?.title}</p>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">{meta?.desc}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              {type}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold border border-border">
              {subtype}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Config Component */}
      <ConfigComponent
        structure={structure}
        onChange={onChange}
        subtype={subtype}
        type={type}
      />
    </div>
  );
}
