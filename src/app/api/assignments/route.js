import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Helper: shape an assignment row + breakdowns into the frontend object
// ---------------------------------------------------------------------------
function formatAssignment(row, phaseBreakdown, unitBreakdown) {
  return {
    id: row.display_id,
    projectId: row.project_display_id,
    scopeId: row.scope_id,
    scopeName: row.scope_name,
    trade: row.trade,
    tradeIcon: row.trade_icon,
    uom: row.uom,
    level: row.level,
    clientRate: row.client_rate !== null ? Number(row.client_rate) : null,
    subRate: row.sub_rate !== null ? Number(row.sub_rate) : null,
    assigneeType: row.assignee_type,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    totalQty: row.total_qty !== null ? Number(row.total_qty) : null,
    targetDate: row.target_date,
    notes: row.notes,
    createdAt: row.created_at,
    phaseBreakdown: phaseBreakdown.map((pb) => ({
      phaseId: pb.phase_display_id,
      phaseName: pb.phase_name,
      qty: pb.qty !== null ? Number(pb.qty) : null,
      done: pb.done !== null ? Number(pb.done) : null,
    })),
    unitBreakdown: unitBreakdown.map((ub) => ({
      unitId: ub.unit_display_id,
      qty: ub.qty !== null ? Number(ub.qty) : null,
      done: ub.done !== null ? Number(ub.done) : null,
    })),
  };
}

// ---------------------------------------------------------------------------
// GET /api/assignments — fetch all assignments, optional ?projectId=PRJ-001
// ---------------------------------------------------------------------------
export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");

    let assignmentsRes;
    if (projectId) {
      assignmentsRes = await pool.query(
        `SELECT sa.*, p.display_id AS project_display_id
         FROM scope_assignments sa
         JOIN projects p ON sa.project_id = p.id
         WHERE p.display_id = $1
         ORDER BY sa.created_at DESC`,
        [projectId]
      );
    } else {
      assignmentsRes = await pool.query(
        `SELECT sa.*, p.display_id AS project_display_id
         FROM scope_assignments sa
         JOIN projects p ON sa.project_id = p.id
         ORDER BY sa.created_at DESC`
      );
    }

    const assignments = assignmentsRes.rows;
    if (assignments.length === 0) {
      return NextResponse.json([]);
    }

    const assignmentIds = assignments.map((a) => a.id);

    const [phaseBreakRes, unitBreakRes] = await Promise.all([
      pool.query(
        `SELECT * FROM assignment_phase_breakdown WHERE assignment_id = ANY($1)`,
        [assignmentIds]
      ),
      pool.query(
        `SELECT * FROM assignment_unit_breakdown WHERE assignment_id = ANY($1)`,
        [assignmentIds]
      ),
    ]);

    const allPhaseBreak = phaseBreakRes.rows;
    const allUnitBreak = unitBreakRes.rows;

    const result = assignments.map((a) =>
      formatAssignment(
        a,
        allPhaseBreak.filter((pb) => pb.assignment_id === a.id),
        allUnitBreak.filter((ub) => ub.assignment_id === a.id)
      )
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/assignments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/assignments — create a new assignment with breakdowns
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
      projectId,
      scopeId,
      scopeName,
      trade,
      tradeIcon,
      uom,
      level,
      clientRate,
      subRate,
      assigneeType,
      assigneeId,
      assigneeName,
      totalQty,
      targetDate,
      notes,
      phaseBreakdown = [],
      unitBreakdown = [],
    } = body;

    if (!projectId || !scopeName) {
      return NextResponse.json(
        { error: "projectId and scopeName are required" },
        { status: 400 }
      );
    }

    await dbClient.query("BEGIN");

    // 1. Resolve numeric project id from display_id
    const projRes = await dbClient.query(
      `SELECT id FROM projects WHERE display_id = $1`,
      [projectId]
    );
    if (projRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const numericProjectId = projRes.rows[0].id;

    // 2. Insert assignment
    const asnRes = await dbClient.query(
      `INSERT INTO scope_assignments
         (project_id, scope_id, scope_name, trade, trade_icon, uom, level,
          client_rate, sub_rate, assignee_type, assignee_id, assignee_name,
          total_qty, target_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        numericProjectId,
        scopeId || null,
        scopeName,
        trade || null,
        tradeIcon || null,
        uom || null,
        level || null,
        clientRate !== undefined ? Number(clientRate) : null,
        subRate !== undefined ? Number(subRate) : null,
        assigneeType || null,
        assigneeId || null,
        assigneeName || null,
        totalQty !== undefined ? Number(totalQty) : null,
        targetDate || null,
        notes || null,
      ]
    );
    const assignment = asnRes.rows[0];

    // 3. Batch-insert phase breakdown
    const insertedPhaseBreak = [];
    for (const pb of phaseBreakdown) {
      const pbRes = await dbClient.query(
        `INSERT INTO assignment_phase_breakdown
           (assignment_id, phase_display_id, phase_name, qty, done)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          assignment.id,
          pb.phaseId,
          pb.phaseName || null,
          pb.qty !== undefined ? Number(pb.qty) : null,
          pb.done !== undefined ? Number(pb.done) : 0,
        ]
      );
      insertedPhaseBreak.push(pbRes.rows[0]);
    }

    // 4. Batch-insert unit breakdown
    const insertedUnitBreak = [];
    for (const ub of unitBreakdown) {
      const ubRes = await dbClient.query(
        `INSERT INTO assignment_unit_breakdown
           (assignment_id, unit_display_id, qty, done)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          assignment.id,
          ub.unitId,
          ub.qty !== undefined ? Number(ub.qty) : null,
          ub.done !== undefined ? Number(ub.done) : 0,
        ]
      );
      insertedUnitBreak.push(ubRes.rows[0]);
    }

    await dbClient.query("COMMIT");

    // Attach project display_id for the formatter
    assignment.project_display_id = projectId;

    return NextResponse.json(
      formatAssignment(assignment, insertedPhaseBreak, insertedUnitBreak),
      { status: 201 }
    );
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("POST /api/assignments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}
