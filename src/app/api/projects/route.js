import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Helper: shape a project row + phases rows + units rows into the frontend obj
// ---------------------------------------------------------------------------
function formatProject(
  project,
  phases,
  units,
  assignments = [],
  logs = [],
  phaseBreakdowns = [],
  unitBreakdowns = []
) {
  const phaseRows = phases.filter((ph) => ph.project_id === project.id);
  const unitRows = units.filter((u) => u.project_id === project.id);
  const projectAssignments = assignments.filter((a) => a.project_id === project.id);
  const projectLogs = logs.filter((l) => l.project_id === project.id);

  let totalQty = 0;
  let totalDone = 0;
  let totalContract = 0;
  let totalEarned = 0;
  let totalCost = 0;
  let completedAssignmentsCount = 0;

  projectAssignments.forEach((a) => {
    const aPhaseBreakdowns = phaseBreakdowns.filter((pb) => pb.assignment_id === a.id);
    const aUnitBreakdowns = unitBreakdowns.filter((ub) => ub.assignment_id === a.id);
    const aLogs = projectLogs.filter((l) => l.assignment_id === a.id);

    let tQty = 0;
    let tDone = 0;
    if (a.level === "unit") {
      tQty = aUnitBreakdowns.reduce((s, u) => s + Number(u.qty || 0), 0);
      tDone = aUnitBreakdowns.reduce((s, u) => s + Number(u.done || 0), 0);
    } else if (a.level === "phase") {
      tQty = aPhaseBreakdowns.reduce((s, p) => s + Number(p.qty || 0), 0);
      tDone = aPhaseBreakdowns.reduce((s, p) => s + Number(p.done || 0), 0);
    } else {
      tQty = Number(a.total_qty || 0);
      tDone = aLogs.reduce((s, l) => s + Number(l.qty_completed || 0), 0);
    }

    totalQty += tQty;
    totalDone += tDone;
    totalContract += tQty * Number(a.client_rate || 0);
    totalEarned += tDone * Number(a.client_rate || 0);
    totalCost += tDone * Number(a.sub_rate || 0);

    if (tQty > 0 && tDone >= tQty) {
      completedAssignmentsCount++;
    }
  });

  const progress = totalQty > 0 ? Math.min(100, Math.round((totalDone / totalQty) * 100)) : 0;

  const formattedPhases = phaseRows.map((ph) => ({
    id: ph.display_id,
    name: ph.name,
    colorId: ph.color_id,
    unitIds: unitRows
      .filter((u) => u.phase_id === ph.id)
      .map((u) => u.display_id),
  }));

  const formattedUnits = unitRows.map((u) => ({
    id: u.display_id,
    name: u.name,
    phaseId: phaseRows.find((ph) => ph.id === u.phase_id)?.display_id ?? null,
    type: u.unit_type,
  }));

  return {
    id: project.display_id,
    name: project.name,
    client: project.client,
    location: project.location,
    pm: project.pm,
    type: project.type,
    subtype: project.subtype,
    status: project.status,
    progress: progress,
    totalContractVal: totalContract,
    totalEarned: totalEarned,
    totalCost: totalCost,
    assignmentsCount: projectAssignments.length,
    completedAssignmentsCount: completedAssignmentsCount,
    startDate: project.start_date,
    endDate: project.end_date,
    createdAt: project.created_at,
    phases: formattedPhases,
    units: formattedUnits,
    scopes: [],
  };
}

// ---------------------------------------------------------------------------
// GET /api/projects — return all projects with embedded phases & units
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const projectsRes = await pool.query(
      `SELECT * FROM projects ORDER BY created_at DESC`
    );
    const projects = projectsRes.rows;

    if (projects.length === 0) {
      return NextResponse.json([]);
    }

    const projectIds = projects.map((p) => p.id);

    const [phasesRes, unitsRes, assignmentsRes, logsRes] = await Promise.all([
      pool.query(
        `SELECT * FROM project_phases WHERE project_id = ANY($1) ORDER BY display_order ASC`,
        [projectIds]
      ),
      pool.query(
        `SELECT * FROM project_units WHERE project_id = ANY($1) ORDER BY id ASC`,
        [projectIds]
      ),
      pool.query(
        `SELECT * FROM scope_assignments WHERE project_id = ANY($1)`,
        [projectIds]
      ),
      pool.query(
        `SELECT * FROM progress_logs WHERE project_id = ANY($1)`,
        [projectIds]
      ),
    ]);

    const allPhases = phasesRes.rows;
    const allUnits = unitsRes.rows;
    const allAssignments = assignmentsRes.rows;
    const allLogs = logsRes.rows;

    const assignmentIds = allAssignments.map((a) => a.id);
    let phaseBreakdowns = [];
    let unitBreakdowns = [];
    if (assignmentIds.length > 0) {
      const [phaseBRes, unitBRes] = await Promise.all([
        pool.query(
          `SELECT * FROM assignment_phase_breakdown WHERE assignment_id = ANY($1)`,
          [assignmentIds]
        ),
        pool.query(
          `SELECT * FROM assignment_unit_breakdown WHERE assignment_id = ANY($1)`,
          [assignmentIds]
        ),
      ]);
      phaseBreakdowns = phaseBRes.rows;
      unitBreakdowns = unitBRes.rows;
    }

    const result = projects.map((p) =>
      formatProject(
        p,
        allPhases,
        allUnits,
        allAssignments,
        allLogs,
        phaseBreakdowns,
        unitBreakdowns
      )
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/projects — create a project + optional phases & units
// ---------------------------------------------------------------------------
export async function POST(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Access Denied: Admin privileges required" },
      { status: 403 }
    );
  }

  const dbClient = await pool.connect();
  try {
    const body = await request.json();
    const {
      name,
      client: clientName,
      location,
      pm,
      type,
      subtype,
      status,
      startDate,
      endDate,
      phases = [],
      units = [],
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    await dbClient.query("BEGIN");

    // 1. Insert project
    const projectRes = await dbClient.query(
      `INSERT INTO projects (name, client, location, pm, type, subtype, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        clientName || null,
        location || null,
        pm || null,
        type || null,
        subtype || null,
        status || 'On Track',
        startDate || null,
        endDate || null,
      ]
    );
    const project = projectRes.rows[0];

    // 2. Insert phases (ordered by array position)
    const insertedPhases = [];
    for (let i = 0; i < phases.length; i++) {
      const ph = phases[i];
      const phRes = await dbClient.query(
        `INSERT INTO project_phases (project_id, name, color_id, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [project.id, ph.name, ph.colorId ?? null, i + 1]
      );
      insertedPhases.push(phRes.rows[0]);
    }

    // Build a lookup map: phase name -> inserted row (used when units reference by name)
    const phaseNameToRow = {};
    insertedPhases.forEach((ph) => {
      phaseNameToRow[ph.name] = ph;
    });

    // 3. Insert units — resolve phase numeric id from phaseName or phaseId (display_id)
    const insertedUnits = [];
    for (const u of units) {
      let phaseNumericId = null;
      if (u.phaseName && phaseNameToRow[u.phaseName]) {
        phaseNumericId = phaseNameToRow[u.phaseName].id;
      } else if (u.phaseId) {
        const found = insertedPhases.find((ph) => ph.display_id === u.phaseId);
        if (found) phaseNumericId = found.id;
      }

      const unitRes = await dbClient.query(
        `INSERT INTO project_units (project_id, phase_id, display_id, name, unit_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [project.id, phaseNumericId, u.id || null, u.name, u.type ?? null]
      );
      insertedUnits.push(unitRes.rows[0]);
    }

    await dbClient.query("COMMIT");

    const result = formatProject(project, insertedPhases, insertedUnits);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}
