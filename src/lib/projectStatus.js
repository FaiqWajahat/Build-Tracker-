/**
 * Automatically computes a project's health status based on:
 *   - progress   : actual completion percentage (0–100)
 *   - startDate  : project start date string
 *   - endDate    : project expected end date string
 *
 * Logic:
 *   expectedProgress = (daysSinceStart / totalDuration) × 100
 *   diff = actualProgress − expectedProgress
 *
 *   diff >= 10   → "Ahead"
 *   diff >= -10  → "On Track"
 *   diff >= -25  → "Delayed"
 *   diff < -25   → "At Risk"
 *   progress >= 100 → "Completed"
 *
 * If dates are missing it falls back to the stored `status` field (or "On Track").
 */
export function computeProjectStatus(project) {
  const progress = project.progress ?? 0;

  if (progress >= 100) return "Completed";

  const { startDate, endDate } = project;

  if (!startDate || !endDate) {
    return project.status || "On Track";
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalDays = (end - start) / (1000 * 60 * 60 * 24);
  if (totalDays <= 0) return project.status || "On Track";

  const daysPassed = (now - start) / (1000 * 60 * 60 * 24);
  const expectedProgress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

  const diff = progress - expectedProgress;

  if (diff >= 10) return "Ahead";
  if (diff >= -10) return "On Track";
  if (diff >= -25) return "Delayed";
  return "At Risk";
}

/** Full status display config keyed by status string */
export const PROJECT_STATUS_CONFIG = {
  "On Track":  { bg: "bg-status-ontrack/10",  text: "text-status-ontrack",  dot: "bg-status-ontrack",  border: "border-status-ontrack/20",  color: "var(--status-ontrack)"  },
  "Ahead":     { bg: "bg-status-ahead/10",    text: "text-status-ahead",    dot: "bg-status-ahead",    border: "border-status-ahead/20",    color: "var(--status-ahead)"    },
  "Delayed":   { bg: "bg-status-delayed/10",  text: "text-status-delayed",  dot: "bg-status-delayed",  border: "border-status-delayed/20",  color: "var(--status-delayed)"  },
  "At Risk":   { bg: "bg-status-atrisk/10",   text: "text-status-atrisk",   dot: "bg-status-atrisk",   border: "border-status-atrisk/20",   color: "var(--status-atrisk)"   },
  "Completed": { bg: "bg-emerald-500/10",      text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500/20", color: "#10b981" },
};
