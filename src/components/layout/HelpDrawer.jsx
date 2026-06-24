"use client";

import React, { useState, useEffect } from "react";
import { X, HelpCircle, BookOpen, MessageSquare, ChevronDown, Wrench, Shield, FileText } from "lucide-react";

// Page-specific documentation database
const HELP_DATABASE = {
  "/": {
    title: "Dashboard Overview Help",
    icon: BookOpen,
    desc: "Welcome to the BuildTrack ERP Dashboard. This page provides real-time financial, workforce, and operational summaries.",
    sections: [
      {
        heading: "KPI Metrics & Calculations",
        text: "• Active Projects: Total projects currently in development.\n• Total Workforce: Count of Active workers registered in the database.\n• Total Assets: Registered machinery and equipment count.\n• Pending Invoices: Count and total sum of subcontractor payments awaiting Admin approval."
      },
      {
        heading: "Revenue vs Cost Analysis Chart",
        text: "Calculates the last 6 months of costs (cleared contractor payments + advances + attendance wages) versus generated revenue (derived from a 30% gross profit margin on costs)."
      },
      {
        heading: "Resource Density Chart",
        text: "Displays the allocation of labor (active team members) and heavy assets across projects (Villa, Tower, Mall) to balance site density."
      }
    ]
  },
  "/labour-teams": {
    title: "Workforce & Teams Help",
    icon: Wrench,
    desc: "Manage site labor profiles, pay scales, and group teams.",
    sections: [
      {
        heading: "Worker Profiles & Pay Types",
        text: "• Monthly: Earns a fixed base salary (e.g. 2,800 SAR/month) divided by 30 for daily wage calculation.\n• Daily: Earns wages strictly based on daily shifts worked (e.g. 120 SAR/day)."
      },
      {
        heading: "Iqama & Identity Tracking",
        text: "Tracks worker Iqama numbers and calculates expiration countdowns. Alerts are flagged for entries expiring soon."
      },
      {
        heading: "Labour Teams & Leaders",
        text: "Teams organize workers under a foreman (Leader) assigned to a project site. Updating a team's project updates assignments in real time."
      }
    ]
  },
  "/attendance": {
    title: "Attendance Registry Help",
    icon: BookOpen,
    desc: "Monitor daily attendance shifts, check-in timestamps, and overtime rates.",
    sections: [
      {
        heading: "Attendance States",
        text: "• Present: Registers full daily rate calculation.\n• Half Day: Registers 50% of the worker's rate.\n• Absent / On Leave: Registers 0% daily rate."
      },
      {
        heading: "Bulk Upload Utility",
        text: "Allows Admins to upload multiple attendance sheets simultaneously, checking for date conflicts before upserting into the database."
      }
    ]
  },
  "/contractors": {
    title: "Subcontractor Ledger Help",
    icon: FileText,
    desc: "Track external subcontractor partners, contract values, progress claims, and balances.",
    sections: [
      {
        heading: "Reconciliation Ledger Formula",
        text: "The Net Outstanding Balance is computed dynamically as follows:\n\nNet Balance = Cumulative Progress Value - Fines/Deductions - Approved Payments\n\n• Cumulative Progress: Earned value calculated as (Quantity Completed × Unit Rate).\n• Deductions: Material damage fines or safety penalties.\n• Approved Payments: Cleared disbursements."
      },
      {
        heading: "Direct Payouts",
        text: "Payments recorded through the 'Disburse Payment' modal are automatically cleared by default. This ensures they immediately deduct from the Net Outstanding Balance, matching instant bank or cash transfers."
      }
    ]
  },
  "/assets": {
    title: "Asset Registry Help",
    icon: Wrench,
    desc: "Manage heavy machinery, vehicle statuses, and operators.",
    sections: [
      {
        heading: "Asset Operators",
        text: "Assets can refer to an active Worker profile in the database as the designated Operator. Removing a worker will safely clear the operator link (ON DELETE SET NULL)."
      },
      {
        heading: "Statuses",
        text: "• In Use: Equipment deployed on site.\n• Idle: Deployed but not operating.\n• Under Maintenance / Inspection Due: Restricts deployment."
      }
    ]
  },
  "/users": {
    title: "Users & Roles Help",
    icon: Shield,
    desc: "Manage ERP login access, roles, and session suspensions.",
    sections: [
      {
        heading: "Role-Based Access Control (RBAC)",
        text: "• Admin: Has full privileges to create, edit, approve/reject, delete, and modify settings.\n• User: Has read-only permissions across all modules, and cannot mutate any records or switch personas."
      },
      {
        heading: "Suspensions & Invites",
        text: "Passwords are encrypted using bcryptjs. Admins can suspend accounts, which blocks them from signing in or generating session tokens."
      }
    ]
  },
  "/settings": {
    title: "System Settings Help",
    icon: Shield,
    desc: "Configure global ERP settings, theme styling, and backup databases.",
    sections: [
      {
        heading: "Active Dark / Light Theme",
        text: "The dark/light preference is stored in Local Storage to persist the setting across browser refreshes."
      },
      {
        heading: "ERP Configurations",
        text: "Save global operational values. Access is restricted to Admin roles."
      }
    ]
  }
};

const DEFAULT_HELP = {
  title: "BuildTrack Help Center",
  icon: HelpCircle,
  desc: "Access help sheets, calculation definitions, FAQs, and support links.",
  sections: [
    {
      heading: "Navigating BuildTrack ERP",
      text: "Use the sidebar to navigate between Scopes, Workforce, Attendance, Subcontractors, Assets, and Users. Your role limits write actions if you are not an Admin."
    },
    {
      heading: "Financial Balances",
      text: "All finance ledger computations for contractor payouts, deductions, worker advances, and wages are computed in real time from database entries."
    }
  ]
};

const FAQS = [
  {
    q: "How do I switch active personas?",
    a: "Click your profile dropdown in the Top Bar. If your active account is an Admin, a 'Switch Persona (Testing)' section is displayed. Non-admin users are restricted from switching personas."
  },
  {
    q: "Why is a button hidden or disabled?",
    a: "If your user account role is 'User', the ERP enforcer puts your session in Read-Only mode. All adding, editing, deleting, and settings actions are hidden or disabled."
  },
  {
    q: "How are worker daily wages calculated?",
    a: "For daily rate workers, the system multiplies the worker's rate by the number of present attendance days. Half-days add 50% rate. Absences add 0%."
  }
];

export default function HelpDrawer({ isOpen, onClose, pathname }) {
  const [activeFaq, setActiveFaq] = useState(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve active help document based on pathname
  let helpContent = DEFAULT_HELP;
  if (pathname) {
    // Exact match or prefix match
    const matchKey = Object.keys(HELP_DATABASE).find(
      (key) => pathname === key || (key !== "/" && pathname.startsWith(key))
    );
    if (matchKey) {
      helpContent = HELP_DATABASE[matchKey];
    }
  }

  const Icon = helpContent.icon;

  return (
    <div className="fixed inset-0 z-150 flex justify-end">
      {/* Blurred backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-[400px] bg-card border-l border-border h-full flex flex-col shadow-2xl z-10 transition-transform duration-300 animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{helpContent.title}</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">ERP Quick Reference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-colors border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Introduction */}
          <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
            <p className="text-[12.5px] leading-relaxed text-muted-foreground font-medium">
              {helpContent.desc}
            </p>
          </div>

          {/* Page-Specific Sections */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={12} /> Page Reference
            </h3>
            {helpContent.sections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <h4 className="text-[13px] font-bold text-foreground">{section.heading}</h4>
                <p className="text-[12px] leading-relaxed text-muted-foreground whitespace-pre-line bg-muted/10 p-2.5 rounded-lg border border-border/30">
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} /> FAQs &amp; Help
            </h3>
            <div className="space-y-1.5">
              {FAQS.map((faq, idx) => {
                const isActive = activeFaq === idx;
                return (
                  <div key={idx} className="border border-border/60 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setActiveFaq(isActive ? null : idx)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/40 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <span className="text-[12px] font-bold text-foreground">{faq.q}</span>
                      <ChevronDown
                        size={13}
                        className={`text-muted-foreground transition-transform duration-200 ${
                          isActive ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isActive && (
                      <div className="p-3 pt-0 text-[11.5px] text-muted-foreground leading-relaxed border-t border-border/20 bg-muted/10">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support Information */}
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex flex-col items-center text-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <HelpCircle size={15} />
            </div>
            <h4 className="text-[12.5px] font-bold text-foreground">Need Technical Support?</h4>
            <p className="text-[10.5px] text-muted-foreground leading-relaxed">
              If you run into issues or need permission changes, contact your IT Systems Admin at:
            </p>
            <a
              href="mailto:support@buildtrack-erp.com"
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              faiqwajahatofficial@gmail.com
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 text-center text-[10px] text-muted-foreground font-semibold">
          BuildTrack ERP v1.4.0 · Secured Session
        </div>
      </div>
    </div>
  );
}
