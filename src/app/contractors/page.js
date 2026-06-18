"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import useContractorStore from "@/store/useContractorStore";
import useProjectStore from "@/store/useProjectStore";
import ContractorDirectory from "@/components/contractor/ContractorDirectory";
import ContractorProjectsPanel from "@/components/contractor/ContractorProjectsPanel";
import ContractorProjectDetail from "@/components/contractor/ContractorProjectDetail";

/*
  Navigation state machine:
    view = "directory"   → Level 1: contractor cards grid
    view = "projects"    → Level 2: contractor's projects panel
    view = "detail"      → Level 3: contractor+project scope ledger
*/

export default function ContractorsPage() {
  const addContractor = useContractorStore((s) => s.addContractor);
  const projects = useProjectStore((s) => s.projects);

  const [nav, setNav] = useState({ view: "directory", contractor: null, projectGroup: null });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", trade: "Civil & Structural", status: "Active", email: "", phone: "",
  });

  const goToDirectory = () => setNav({ view: "directory", contractor: null, projectGroup: null });
  const goToContractor = (contractor) => setNav({ view: "projects", contractor, projectGroup: null });
  const goToProject = (contractor, projectGroup) => setNav({ view: "detail", contractor, projectGroup });

  const handleSaveContractor = () => {
    if (!addForm.name.trim()) return;
    addContractor(addForm);
    setAddForm({ name: "", trade: "Civil & Structural", status: "Active", email: "", phone: "" });
    setShowAddModal(false);
  };

  return (
    <>
      {nav.view === "directory" && (
        <ContractorDirectory
          onSelectContractor={goToContractor}
          onAddContractor={() => setShowAddModal(true)}
        />
      )}

      {nav.view === "projects" && nav.contractor && (
        <ContractorProjectsPanel
          contractor={nav.contractor}
          onBack={goToDirectory}
          onSelectProject={(group) => goToProject(nav.contractor, group)}
        />
      )}

      {nav.view === "detail" && nav.contractor && nav.projectGroup && (
        <ContractorProjectDetail
          contractor={nav.contractor}
          projectGroup={nav.projectGroup}
          onBack={() => setNav({ view: "projects", contractor: nav.contractor, projectGroup: null })}
          onBackToDirectory={goToDirectory}
        />
      )}

      {/* Add Contractor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Register New Contractor Partner</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Add a new subcontractor to your directory</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Contractor / Firm Name *</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Saudi Foundation Co."
                  className="block mt-1 w-full px-3 py-2.5 bg-muted text-sm text-foreground rounded-xl border border-border outline-none focus:border-ring transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Specialist Trade</label>
                  <select
                    value={addForm.trade}
                    onChange={(e) => setAddForm({ ...addForm, trade: e.target.value })}
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-xs text-foreground rounded-xl border border-border outline-none cursor-pointer"
                  >
                    <option>Civil & Structural</option>
                    <option>Mechanical & Electrical</option>
                    <option>Architectural & Finishes</option>
                    <option>Plumbing & Drainage</option>
                    <option>Structural Steel</option>
                    <option>MEP – Electrical</option>
                    <option>MEP – Plumbing</option>
                    <option>MEP – Mechanical (HVAC)</option>
                    <option>MEP – Fire Fighting</option>
                    <option>External Works</option>
                    <option>Facade & Envelope</option>
                    <option>Preliminaries</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-xs text-foreground rounded-xl border border-border outline-none cursor-pointer"
                  >
                    <option>Active</option>
                    <option>Under Review</option>
                    <option>Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="mail@firm.com"
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number</label>
                  <input
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+966 50 000 0000"
                    className="block mt-1 w-full px-3 py-2.5 bg-muted text-xs text-foreground rounded-xl border border-border outline-none focus:border-ring transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveContractor}
                disabled={!addForm.name.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <Plus size={13} /> Register Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
