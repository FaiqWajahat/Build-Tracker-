"use client";

import { useState, useEffect } from "react";
import {
  Settings, Building, DollarSign, Bell, ShieldCheck,
  Save, ToggleLeft, ToggleRight, CheckCircle2
} from "lucide-react";
import useUserStore from "@/store/useUserStore";
import useSettingsStore from "@/store/useSettingsStore";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const isReadOnly = currentUser?.role === "User";
  const [activeTab, setActiveTab] = useState("company");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { settings, saveSettings } = useSettingsStore();

  // Controlled States
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [registrationNumber, setRegistrationNumber] = useState(settings.registrationNumber);
  const [headquartersAddress, setHeadquartersAddress] = useState(settings.headquartersAddress);
  
  const [currency, setCurrency] = useState(settings.currency);
  const [retentionRate, setRetentionRate] = useState(settings.retentionRate || "5");
  const [fiscalYearStart, setFiscalYearStart] = useState(settings.fiscalYearStart);

  const [notifications, setNotifications] = useState(settings.notifications);

  const [sessionTimeout, setSessionTimeout] = useState(settings.sessionTimeout);
  const [biometricMatchRate, setBiometricMatchRate] = useState(settings.biometricMatchRate);

  // Sync state if store settings change
  useEffect(() => {
    const timer = setTimeout(() => {
      setCompanyName(settings.companyName);
      setRegistrationNumber(settings.registrationNumber);
      setHeadquartersAddress(settings.headquartersAddress);
      setCurrency(settings.currency);
      setRetentionRate(settings.retentionRate || "5");
      setFiscalYearStart(settings.fiscalYearStart);
      setNotifications(settings.notifications);
      setSessionTimeout(settings.sessionTimeout);
      setBiometricMatchRate(settings.biometricMatchRate);
    }, 0);
    return () => clearTimeout(timer);
  }, [settings]);

  const handleSave = () => {
    if (isReadOnly) {
      toast.error("Access Denied: Read-only privilege.");
      return;
    }

    if (!companyName.trim()) {
      toast.error("Enterprise Name cannot be empty.");
      return;
    }

    if (!registrationNumber.trim()) {
      toast.error("Registration Number cannot be empty.");
      return;
    }

    const config = {
      companyName,
      registrationNumber,
      headquartersAddress,
      currency,
      vatRate: "0",
      retentionRate,
      fiscalYearStart,
      notifications,
      sessionTimeout,
      biometricMatchRate
    };

    saveSettings(config);
    
    setSaveSuccess(true);
    toast.success("ERP configurations saved successfully");
    setTimeout(() => {
      setSaveSuccess(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="p-6 min-h-full">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        
        {/* Settings Navigation */}
        <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border">
          {[
            { id: "company", label: "Company Profile", icon: Building },
            { id: "financial", label: "Financial Settings", icon: DollarSign },
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
                    <input 
                      disabled={isReadOnly} 
                      type="text" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Registration Number</label>
                    <input 
                      disabled={isReadOnly} 
                      type="text" 
                      value={registrationNumber} 
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Headquarters Address</label>
                    <input 
                      disabled={isReadOnly} 
                      type="text" 
                      value={headquartersAddress} 
                      onChange={(e) => setHeadquartersAddress(e.target.value)}
                      className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" 
                    />
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
                    <select 
                      disabled={isReadOnly} 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none cursor-pointer focus:border-ring"
                    >
                      <option value="SAR">SAR - Saudi Riyal</option>
                      <option value="AED">AED - UAE Dirham</option>
                      <option value="USD">USD - US Dollar</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Default Retention Rate (%)</label>
                    <input 
                      disabled={isReadOnly} 
                      type="number" 
                      value={retentionRate} 
                      onChange={(e) => setRetentionRate(e.target.value)}
                      className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none focus:border-ring" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Fiscal Year Start</label>
                    <select 
                      disabled={isReadOnly} 
                      value={fiscalYearStart}
                      onChange={(e) => setFiscalYearStart(e.target.value)}
                      className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none cursor-pointer focus:border-ring"
                    >
                      <option value="1">January 1st</option>
                      <option value="4">April 1st</option>
                    </select>
                  </div>
                </div>
              </div>
            )}


            {/* Tab: Security */}
            {activeTab === "security" && (
              <div className="space-y-4 fade-up">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">Access & Security Settings</h3>
                  <p className="text-xs text-muted-foreground">Configure session timeouts for active user sessions.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Session Timeout</label>
                    <select 
                      disabled={isReadOnly} 
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="px-3 py-2 bg-muted text-foreground text-xs rounded-lg border border-border outline-none cursor-pointer focus:border-ring"
                    >
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="120">2 Hours</option>
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

            {!isReadOnly && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer w-full sm:w-auto justify-center"
              >
                <Save size={14} /> Save Configurations
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
