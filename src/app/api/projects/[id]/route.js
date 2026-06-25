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

  const formattedPhases = phases.map((ph) => ({
    id: ph.display_id,
    name: ph.name,
    colorId: ph.color_id,
    unitIds: units
      .filter((u) => u.phase_id === ph.id)
      .map((u) => u.display_id),
  }));

  const formattedUnits = units.map((u) => ({
    id: u.display_id,
    name: u.name,
    phaseId: phases.find((ph) => ph.id === u.phase_id)?.display_id ?? null,
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
// GET /api/projects/[id] — fetch single project by display_id
// ---------------------------------------------------------------------------
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const projectRes = await pool.query(
      `SELECT * FROM projects WHERE display_id = $1`,
      [id]
    );
    if (projectRes.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectRes.rows[0];

    const [phasesRes, unitsRes, assignmentsRes, logsRes] = await Promise.all([
      pool.query(
        `SELECT * FROM project_phases WHERE project_id = $1 ORDER BY display_order ASC`,
        [project.id]
      ),
      pool.query(
        `SELECT * FROM project_units WHERE project_id = $1 ORDER BY id ASC`,
        [project.id]
      ),
      pool.query(
        `SELECT * FROM scope_assignments WHERE project_id = $1`,
        [project.id]
      ),
      pool.query(
        `SELECT * FROM progress_logs WHERE project_id = $1`,
        [project.id]
      ),
    ]);

    const assignmentIds = assignmentsRes.rows.map((a) => a.id);
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

    return NextResponse.json(
      formatProject(
        project,
        phasesRes.rows,
        unitsRes.rows,
        assignmentsRes.rows,
        logsRes.rows,
        phaseBreakdowns,
        unitBreakdowns
      )
    );
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/projects/[id] — update project fields + optional phases/units upsert
// ---------------------------------------------------------------------------
export async function PUT(request, { params }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Access Denied: Admin privileges required" },
      { status: 403 }
    );
  }

  const dbClient = await pool.connect();
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      client: clientName,
      location,
      pm,
      type,
      subtype,
      status,
      progress,
      startDate,
      endDate,
      phases,
      units,
    } = body;

    await dbClient.query("BEGIN");

    // 1. Update project
    const projectRes = await dbClient.query(
      `UPDATE projects
       SET name       = COALESCE($1, name),
           client     = COALESCE($2, client),
           location   = COALESCE($3, location),
           pm         = COALESCE($4, pm),
           type       = COALESCE($5, type),
           subtype    = COALESCE($6, subtype),
           status     = COALESCE($7, status),
           progress   = COALESCE($8, progress),
           start_date = COALESCE($9, start_date),
           end_date   = COALESCE($10, end_date)
       WHERE display_id = $11
       RETURNING *`,
      [
        name ?? null,
        clientName ?? null,
        location ?? null,
        pm ?? null,
        type ?? null,
        subtype ?? null,
        status ?? null,
        progress !== undefined ? Number(progress) : null,
        startDate ?? null,
        endDate ?? null,
        id,
      ]
    );

    if (projectRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectRes.rows[0];

    // 2. Upsert phases (if provided)
    let finalPhases = [];
    let finalUnits = [];

    if (Array.isArray(phases)) {
      // Get all existing phases for this project
      const existingPhasesRes = await dbClient.query(
        `SELECT id, display_id FROM project_phases WHERE project_id = $1`,
        [project.id]
      );
      const existingPhases = existingPhasesRes.rows;
      const incomingPhaseIds = phases.map(ph => ph.id).filter(Boolean);

      // Delete phases that are in DB but NOT in incoming request
      const phasesToDelete = existingPhases.filter(ph => !incomingPhaseIds.includes(ph.display_id));
      if (phasesToDelete.length > 0) {
        const deleteIds = phasesToDelete.map(ph => ph.id);
        await dbClient.query(
          `DELETE FROM project_phases WHERE id = ANY($1)`,
          [deleteIds]
        );
      }

      // Upsert incoming phases
      for (let i = 0; i < phases.length; i++) {
        const ph = phases[i];
        const isExisting = ph.id && existingPhases.some(ep => ep.display_id === ph.id);
        if (isExisting) {
          // Update existing
          const phRes = await dbClient.query(
            `UPDATE project_phases
             SET name = $1, color_id = $2, display_order = $3
             WHERE display_id = $4 AND project_id = $5
             RETURNING *`,
            [ph.name, ph.colorId ?? null, i + 1, ph.id, project.id]
          );
          if (phRes.rowCount > 0) {
            finalPhases.push(phRes.rows[0]);
          }
        } else {
          // Insert new
          const phRes = await dbClient.query(
            `INSERT INTO project_phases (project_id, name, color_id, display_order)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [project.id, ph.name, ph.colorId ?? null, i + 1]
          );
          finalPhases.push(phRes.rows[0]);
        }
      }
    } else {
      // Fetch existing phases for the response
      const phasesRes = await dbClient.query(
        `SELECT * FROM project_phases WHERE project_id = $1 ORDER BY display_order ASC`,
        [project.id]
      );
      finalPhases = phasesRes.rows;
    }

    // 3. Upsert units (if provided)
    if (Array.isArray(units)) {
      // Get all existing units for this project
      const existingUnitsRes = await dbClient.query(
        `SELECT id, display_id FROM project_units WHERE project_id = $1`,
        [project.id]
      );
      const existingUnits = existingUnitsRes.rows;
      const incomingUnitIds = units.map(u => u.id).filter(Boolean);

      // Delete units that are in DB but NOT in incoming request
      const unitsToDelete = existingUnits.filter(u => !incomingUnitIds.includes(u.display_id));
      if (unitsToDelete.length > 0) {
        const deleteIds = unitsToDelete.map(u => u.id);
        await dbClient.query(
          `DELETE FROM project_units WHERE id = ANY($1)`,
          [deleteIds]
        );
      }

      // Map phase name -> row for easy lookup
      const phaseNameToRow = {};
      finalPhases.forEach((ph) => { phaseNameToRow[ph.name] = ph; });

      // Upsert incoming units
      for (const u of units) {
        let phaseNumericId = null;
        if (u.phaseName && phaseNameToRow[u.phaseName]) {
          phaseNumericId = phaseNameToRow[u.phaseName].id;
        } else if (u.phaseId) {
          const found = finalPhases.find((ph) => ph.display_id === u.phaseId);
          if (found) phaseNumericId = found.id;
        }

        const isExisting = u.id && existingUnits.some(eu => eu.display_id === u.id);
        if (isExisting) {
          // Update existing
          const unitRes = await dbClient.query(
            `UPDATE project_units
             SET phase_id = $1, name = $2, unit_type = $3
             WHERE display_id = $4 AND project_id = $5
             RETURNING *`,
            [phaseNumericId, u.name, u.type ?? null, u.id, project.id]
          );
          if (unitRes.rowCount > 0) {
            finalUnits.push(unitRes.rows[0]);
          }
        } else {
          // Insert new
          const unitRes = await dbClient.query(
            `INSERT INTO project_units (project_id, phase_id, display_id, name, unit_type)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [project.id, phaseNumericId, u.id || null, u.name, u.type ?? null]
          );
          finalUnits.push(unitRes.rows[0]);
        }
      }
    } else {
      const unitsRes = await dbClient.query(
        `SELECT * FROM project_units WHERE project_id = $1 ORDER BY id ASC`,
        [project.id]
      );
      finalUnits = unitsRes.rows;
    }

    // Fetch assignments, logs and breakdowns for formatProject
    const [assignmentsRes, logsRes] = await Promise.all([
      dbClient.query(
        `SELECT * FROM scope_assignments WHERE project_id = $1`,
        [project.id]
      ),
      dbClient.query(
        `SELECT * FROM progress_logs WHERE project_id = $1`,
        [project.id]
      ),
    ]);

    const assignmentIds = assignmentsRes.rows.map((a) => a.id);
    let phaseBreakdowns = [];
    let unitBreakdowns = [];
    if (assignmentIds.length > 0) {
      const [phaseBRes, unitBRes] = await Promise.all([
        dbClient.query(
          `SELECT * FROM assignment_phase_breakdown WHERE assignment_id = ANY($1)`,
          [assignmentIds]
        ),
        dbClient.query(
          `SELECT * FROM assignment_unit_breakdown WHERE assignment_id = ANY($1)`,
          [assignmentIds]
        ),
      ]);
      phaseBreakdowns = phaseBRes.rows;
      unitBreakdowns = unitBRes.rows;
    }

    await dbClient.query("COMMIT");

    return NextResponse.json(
      formatProject(
        project,
        finalPhases,
        finalUnits,
        assignmentsRes.rows,
        logsRes.rows,
        phaseBreakdowns,
        unitBreakdowns
      )
    );
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/projects/[id] — delete project by display_id (DB cascade handles children)
// ---------------------------------------------------------------------------
export async function DELETE(request, { params }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Access Denied: Admin privileges required" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    const result = await pool.query(
      `DELETE FROM projects WHERE display_id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
