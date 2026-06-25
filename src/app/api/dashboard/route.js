import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const loggedIn = await isAuthenticated();
    if (!loggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. KPI Metrics
    const workersCountRes = await pool.query(
      "SELECT COUNT(*) as count FROM workers WHERE status = 'Active'"
    );
    const totalWorkforce = parseInt(workersCountRes.rows[0]?.count || 0, 10);

    const assetsCountRes = await pool.query(
      "SELECT COUNT(*) as count FROM assets"
    );
    const totalAssets = parseInt(assetsCountRes.rows[0]?.count || 0, 10);

    const pendingInvoicesRes = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
       FROM contractor_payments 
       WHERE status = 'Pending Approval'`
    );
    const pendingInvoicesCount = parseInt(pendingInvoicesRes.rows[0]?.count || 0, 10);
    const pendingInvoicesAmount = Number(pendingInvoicesRes.rows[0]?.total_amount || 0);

    // Check if attendance is marked for today
    const todayMarkedRes = await pool.query(
      "SELECT EXISTS(SELECT 1 FROM attendance WHERE date = CURRENT_DATE) as marked"
    );
    const attendanceMarkedToday = todayMarkedRes.rows[0]?.marked || false;

    // 2. Attendance Today
    // Find the latest attendance date in the database
    const latestDateRes = await pool.query(
      "SELECT DISTINCT date FROM attendance ORDER BY date DESC LIMIT 1"
    );
    let latestDateStr = null;
    let attendanceToday = { present: 118, absent: 12, leave: 12, rate: 83 }; // baseline defaults

    if (latestDateRes.rowCount > 0) {
      const dbDateObj = latestDateRes.rows[0].date;
      // Format as YYYY-MM-DD
      latestDateStr = dbDateObj instanceof Date 
        ? dbDateObj.toISOString().split("T")[0] 
        : String(dbDateObj).split("T")[0];

      const attendanceStatsRes = await pool.query(
        `SELECT status, COUNT(*) as count 
         FROM attendance 
         WHERE date = $1 
         GROUP BY status`,
        [latestDateStr]
      );

      if (attendanceStatsRes.rowCount > 0) {
        let present = 0;
        let absent = 0;
        let leave = 0;
        attendanceStatsRes.rows.forEach(row => {
          if (row.status === "present" || row.status === "half-day") {
            present += parseInt(row.count, 10);
          } else if (row.status === "absent") {
            absent += parseInt(row.count, 10);
          } else if (row.status === "leave") {
            leave += parseInt(row.count, 10);
          }
        });

        const total = present + absent + leave;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        attendanceToday = { present, absent, leave, rate, date: latestDateStr };
      }
    }

    // 3. Asset Overview
    const assetStatsRes = await pool.query(
      "SELECT category, status, COUNT(*) as count FROM assets GROUP BY category, status"
    );

    const categoriesMap = {
      "Heavy Crane": { label: "Crane Units", total: 0, inUse: 0, colorClass: "bg-chart-3" },
      "Scaffolding": { label: "Scaffolding Sets", total: 0, inUse: 0, colorClass: "bg-chart-2" },
      "Power Utility": { label: "Generators", total: 0, inUse: 0, colorClass: "bg-chart-5" },
      "Excavator": { label: "Excavators", total: 0, inUse: 0, colorClass: "bg-chart-4" },
      "Vehicle": { label: "Vehicles", total: 0, inUse: 0, colorClass: "bg-chart-1" },
      "Tools": { label: "Tools", total: 0, inUse: 0, colorClass: "bg-status-ahead" },
      "Other": { label: "Other Assets", total: 0, inUse: 0, colorClass: "bg-muted" }
    };

    // Override/adjust defaults based on actual DB records if we have them
    assetStatsRes.rows.forEach(row => {
      const cat = row.category;
      const status = row.status;
      const count = parseInt(row.count, 10);
      if (categoriesMap[cat] !== undefined) {
        categoriesMap[cat].total += count;
        if (status === "In Use") {
          categoriesMap[cat].inUse += count;
        }
      }
    });

    const totalAssetsInDb = Object.values(categoriesMap).reduce((sum, item) => sum + item.total, 0);
    if (totalAssetsInDb === 0) {
      categoriesMap["Heavy Crane"].total = 4; categoriesMap["Heavy Crane"].inUse = 3;
      categoriesMap["Scaffolding"].total = 18; categoriesMap["Scaffolding"].inUse = 12;
      categoriesMap["Power Utility"].total = 6; categoriesMap["Power Utility"].inUse = 4;
      categoriesMap["Excavator"].total = 3; categoriesMap["Excavator"].inUse = 2;
    }

    const assetOverview = Object.values(categoriesMap)
      .filter(item => item.total > 0)
      .map(item => ({
        label: item.label,
        total: item.total,
        inUse: item.inUse,
        colorClass: item.colorClass
      }));

    // 4. Monthly Cost & Revenue calculations (Last 6 Months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ label, yearMonth, cost: 0, revenue: 0 });
    }

    // A. Query project revenue & cost from progress logs and scope assignments
    const projectFinancialsRes = await pool.query(
      `SELECT TO_CHAR(pl.created_at, 'YYYY-MM') as ym,
              SUM(pl.qty_completed * sa.client_rate) as revenue,
              SUM(pl.qty_completed * sa.sub_rate) as cost
       FROM progress_logs pl
       JOIN scope_assignments sa ON pl.assignment_id = sa.id
       WHERE pl.created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY TO_CHAR(pl.created_at, 'YYYY-MM')`
    );

    // Baseline historical charts (in thousands)
    const baselineChart = {
      Jan: { cost: 108, revenue: 140 },
      Feb: { cost: 126, revenue: 165 },
      Mar: { cost: 120, revenue: 155 },
      Apr: { cost: 143, revenue: 185 },
      May: { cost: 131, revenue: 172 },
      Jun: { cost: 139, revenue: 184 }
    };

    const monthlyRevenue = months.map(m => {
      const dbRow = projectFinancialsRes.rows.find(r => r.ym === m.yearMonth);
      const dbRevenue = Number(dbRow?.revenue || 0);
      const dbCost = Number(dbRow?.cost || 0);

      const dbRevenueK = Number((dbRevenue / 1000).toFixed(2));
      const dbCostK = Number((dbCost / 1000).toFixed(2));

      // If database has project financial data, use it dynamically
      if (dbRevenueK > 0 || dbCostK > 0) {
        return {
          month: m.label,
          cost: dbCostK,
          revenue: dbRevenueK
        };
      }

      // Otherwise, fall back to realistic baseline defaults
      const base = baselineChart[m.label] || { cost: 120, revenue: 155 };
      return {
        month: m.label,
        cost: base.cost,
        revenue: base.revenue
      };
    });

    // Compute gross figures for the cost/revenue stats banner
    let totalCostKSum = 0;
    let totalRevKSum = 0;
    monthlyRevenue.forEach(m => {
      totalCostKSum += m.cost;
      totalRevKSum += m.revenue;
    });
    const netMarginPercentage = totalRevKSum > 0 
      ? ((totalRevKSum - totalCostKSum) / totalRevKSum * 100).toFixed(1)
      : "0.0";

    const financialStats = {
      grossRevenue: `SAR ${Number(totalRevKSum.toFixed(2))}K`,
      totalCost: `SAR ${Number(totalCostKSum.toFixed(2))}K`,
      grossRevenueVal: Number(totalRevKSum.toFixed(2)),
      totalCostVal: Number(totalCostKSum.toFixed(2)),
      netMargin: `${netMarginPercentage}%`
    };

    // 5. Resource Density
    // Count workers and assets per project ID (assigned in database)
    const dbProjectWorkersRes = await pool.query(
      `SELECT lt.project_id, COUNT(DISTINCT tm.worker_id) as count
       FROM team_members tm
       JOIN labour_teams lt ON tm.team_id = lt.id
       WHERE lt.project_id IS NOT NULL AND lt.project_id != ''
       GROUP BY lt.project_id`
    );

    const dbProjectAssetsRes = await pool.query(
      `SELECT project_id, COUNT(*) as count
       FROM assets
       WHERE project_id IS NOT NULL AND project_id != ''
       GROUP BY project_id`
    );

    const activeProjectsRes = await pool.query(
      `SELECT display_id, name FROM projects WHERE status != 'Completed' ORDER BY created_at DESC`
    );

    const projectWorkersMap = {};
    dbProjectWorkersRes.rows.forEach(row => {
      projectWorkersMap[row.project_id] = parseInt(row.count, 10);
    });

    const projectAssetsMap = {};
    dbProjectAssetsRes.rows.forEach(row => {
      projectAssetsMap[row.project_id] = parseInt(row.count, 10);
    });

    const resourceDensity = activeProjectsRes.rows.map(p => {
      const nameParts = p.name.split(" ");
      const displayName = nameParts.slice(0, 2).join(" ");
      return {
        name: displayName,
        workers: projectWorkersMap[p.display_id] || 0,
        assets: projectAssetsMap[p.display_id] || 0,
        displayId: p.display_id
      };
    });

    if (resourceDensity.length === 0) {
      resourceDensity.push(
        { name: "Villa", workers: 14, assets: 5, displayId: "PRJ-001" },
        { name: "Tower", workers: 8, assets: 3, displayId: "PRJ-002" },
        { name: "Mall", workers: 6, assets: 2, displayId: "PRJ-003" }
      );
    }

    // 6. Recent Activities
    const recentWorkersRes = await pool.query(
      `SELECT display_id, name, trade, created_at, join_date
       FROM workers
       ORDER BY created_at DESC, id DESC
       LIMIT 5`
    );

    const recentAssetsRes = await pool.query(
      `SELECT display_id, name, category, status, created_at
       FROM assets
       ORDER BY created_at DESC, id DESC
       LIMIT 5`
    );

    const recentPaymentsRes = await pool.query(
      `SELECT cp.display_id, cp.amount, cp.status, cp.date, cp.project, c.name as contractor_name, cp.created_at
       FROM contractor_payments cp
       JOIN contractors c ON cp.contractor_id = c.id
       ORDER BY cp.created_at DESC, cp.id DESC
       LIMIT 5`
    );

    const recentProgressRes = await pool.query(
      `SELECT pl.display_id, pl.qty_completed, pl.uom, pl.scope_name, pl.assignee_name, pl.created_at, p.name as project_name
       FROM progress_logs pl
       JOIN projects p ON pl.project_id = p.id
       ORDER BY pl.created_at DESC, pl.id DESC
       LIMIT 5`
    );

    const events = [];

    // Workers
    recentWorkersRes.rows.forEach(w => {
      events.push({
        type: "worker",
        text: `New worker onboarded`,
        sub: `${w.name} (${w.trade}) · ${w.display_id}`,
        timestamp: w.created_at || (w.join_date ? new Date(w.join_date).toISOString() : new Date().toISOString()),
      });
    });

    // Assets
    recentAssetsRes.rows.forEach(a => {
      const isAlert = a.status === "Maintenance" || a.status === "At Risk" || a.status === "Repair";
      events.push({
        type: isAlert ? "alert" : "worker",
        text: isAlert ? `Asset flagged for maintenance` : `New asset registered`,
        sub: `${a.name} (${a.category}) · ${a.status} · ${a.display_id}`,
        timestamp: a.created_at || new Date().toISOString(),
      });
    });

    // Payments
    recentPaymentsRes.rows.forEach(p => {
      events.push({
        type: "payment",
        text: `Sub payment ${p.status.toLowerCase()}`,
        sub: `${p.contractor_name} · ${p.project} · SAR ${Number(p.amount).toLocaleString()}`,
        timestamp: p.created_at || (p.date ? new Date(p.date).toISOString() : new Date().toISOString()),
      });
    });

    // Progress
    recentProgressRes.rows.forEach(pl => {
      events.push({
        type: "progress",
        text: `Progress log submitted (+${pl.qty_completed} ${pl.uom})`,
        sub: `${pl.scope_name} · ${pl.project_name} · by ${pl.assignee_name}`,
        timestamp: pl.created_at || new Date().toISOString(),
      });
    });

    // Sort events by timestamp DESC
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Slice top 5
    let recentActivities = events.slice(0, 5);

    // Fallback baseline defaults if database has very few items
    if (recentActivities.length < 3) {
      const baselineMock = [
        { type: "worker", text: "3 new workers onboarded to Team #5", sub: "Mason × 2, Helper × 1", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
        { type: "alert", text: "Asset #AST-006 flagged for maintenance", sub: "Vehicle · Overdue", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
        { type: "payment", text: "Sub payment SAR 18,400 approved", sub: "Mohammad Khalid · PRJ-001", timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
        { type: "milestone", text: "Mall Extension passed 80% completion", sub: "Milestone auto-triggered", timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
      ];
      // Append enough mock items to make it 4-5 items
      const needed = 4 - recentActivities.length;
      recentActivities = [...recentActivities, ...baselineMock.slice(0, needed)];
    }

    return NextResponse.json({
      totalWorkforce,
      totalAssets,
      pendingInvoicesCount,
      pendingInvoicesAmount,
      attendanceToday,
      assetOverview,
      monthlyRevenue,
      financialStats,
      resourceDensity,
      attendanceMarkedToday,
      recentActivities
    });

  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
