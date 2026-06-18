"use client";

import { useState } from "react";
import {
  Settings, Building, DollarSign, Bell, ShieldCheck,
  Save, ToggleLeft, ToggleRight, CheckCircle2
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mocks of switches
  const [notifications, setNotifications] = useState({
    emailSummary: true,
    delayAlerts: true,
    invoiceOverdue: false,
    assetMaintenance: true
  });

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-6 min-h-full">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        
        {/* Settings Navigation */}
        <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border">
          {[
            { id: "company", label: "Company Profile", icon: Building },
            { id: "financial", label: "Financial Settings", icon: DollarSign },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "security", label: "Access & Security", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left whitespace-nowrap cursor-pointer border-none
                  ${active
                    ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
                    : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon size={14} className={active ? "text-primary" : "text-muted-foreground/60"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Settings Form panel */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between min-h-[400px]">
          
          <div>
            {/* Tab: Company Profile */}
            {activeTab === "company" && (
              <div className="space-y-4 fade-up">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">Company Profile</h3>
                  <p className="text-xs text-muted-foreground">General administrative parameters for your ERP corporate registry.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Enterprise Name</label>
                    <input type="text" defaultValue="Seven Directions Construction" className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Registration Number</label>
                    <input type="text" defaultValue="CR-1010998877" className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Headquarters Address</label>
                    <input type="text" defaultValue="Olaya District, Riyadh 12211, Saudi Arabia" className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Financial Settings */}
            {activeTab === "financial" && (
              <div className="space-y-4 fade-up">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">Financial Rules</h3>
                  <p className="text-xs text-muted-foreground">Configure currency rates, tax reporting, and baseline budgets.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Default ERP Currency</label>
                    <select className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none cursor-pointer focus:border-ring">
                      <option value="SAR">SAR - Saudi Riyal</option>
                      <option value="AED">AED - UAE Dirham</option>
                      <option value="USD">USD - US Dollar</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">VAT Tax Rate (%)</label>
                    <input type="number" defaultValue="15" className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Fiscal Year Start</label>
                    <select className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none cursor-pointer focus:border-ring">
                      <option value="1">January 1st</option>
                      <option value="4">April 1st</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-4 fade-up">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">Alerts & Notifications</h3>
                  <p className="text-xs text-muted-foreground">Configure automated SMS and email summaries for site PMs.</p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { key: "emailSummary", title: "Daily Labour Summary", desc: "Receive email summaries of daily attendance logs." },
                    { key: "delayAlerts", title: "Site Delay Notifications", desc: "Trigger SMS warning alerts when progress logs flag delays." },
                    { key: "invoiceOverdue", title: "Invoice Reminders", desc: "Auto-email contractors when billing payment is overdue." },
                    { key: "assetMaintenance", title: "Asset Maintenance Warnings", desc: "Alert fleet manager when a machine passes its service date." }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className="bg-transparent border-none cursor-pointer text-primary transition-transform"
                      >
                        {notifications[item.key] ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-muted-foreground/60" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Security */}
            {activeTab === "security" && (
              <div className="space-y-4 fade-up">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">Access & Security Settings</h3>
                  <p className="text-xs text-muted-foreground">Configure session timeouts and biometric verification thresholds.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Session Timeout</label>
                    <select className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none cursor-pointer focus:border-ring">
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Biometric Match Rate</label>
                    <select className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none cursor-pointer focus:border-ring">
                      <option value="98">98% Match (High Security)</option>
                      <option value="95">95% Match (Standard)</option>
                      <option value="90">90% Match (Fast Verification)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 mt-6 border-t border-border flex flex-col sm:flex-row items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold min-h-6">
              {saveSuccess && (
                <>
                  <CheckCircle2 size={14} className="animate-bounce" />
                  ERP configurations saved successfully ✓
                </>
              )}
            </div>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer w-full sm:w-auto justify-center"
            >
              <Save size={14} /> Save Configurations
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
