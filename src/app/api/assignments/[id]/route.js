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
// GET /api/assignments/[id] — fetch single assignment by display_id
// ---------------------------------------------------------------------------
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const asnRes = await pool.query(
      `SELECT sa.*, p.display_id AS project_display_id
       FROM scope_assignments sa
       JOIN projects p ON sa.project_id = p.id
       WHERE sa.display_id = $1`,
      [id]
    );
    if (asnRes.rowCount === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    const assignment = asnRes.rows[0];

    const [phaseBreakRes, unitBreakRes] = await Promise.all([
      pool.query(
        `SELECT * FROM assignment_phase_breakdown WHERE assignment_id = $1`,
        [assignment.id]
      ),
      pool.query(
        `SELECT * FROM assignment_unit_breakdown WHERE assignment_id = $1`,
        [assignment.id]
      ),
    ]);

    return NextResponse.json(
      formatAssignment(assignment, phaseBreakRes.rows, unitBreakRes.rows)
    );
  } catch (error) {
    console.error("GET /api/assignments/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/assignments/[id] — update assignment, replace breakdowns
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
      phaseBreakdown,
      unitBreakdown,
    } = body;

    await dbClient.query("BEGIN");

    // 1. Update the assignment row
    const asnRes = await dbClient.query(
      `UPDATE scope_assignments
       SET scope_id      = COALESCE($1, scope_id),
           scope_name    = COALESCE($2, scope_name),
           trade         = COALESCE($3, trade),
           trade_icon    = COALESCE($4, trade_icon),
           uom           = COALESCE($5, uom),
           level         = COALESCE($6, level),
           client_rate   = COALESCE($7, client_rate),
           sub_rate      = COALESCE($8, sub_rate),
           assignee_type = COALESCE($9, assignee_type),
           assignee_id   = COALESCE($10, assignee_id),
           assignee_name = COALESCE($11, assignee_name),
           total_qty     = COALESCE($12, total_qty),
           target_date   = COALESCE($13, target_date),
           notes         = COALESCE($14, notes)
       WHERE display_id = $15
       RETURNING *, (SELECT display_id FROM projects WHERE id = project_id) AS project_display_id`,
      [
        scopeId ?? null,
        scopeName ?? null,
        trade ?? null,
        tradeIcon ?? null,
        uom ?? null,
        level ?? null,
        clientRate !== undefined ? Number(clientRate) : null,
        subRate !== undefined ? Number(subRate) : null,
        assigneeType ?? null,
        assigneeId ?? null,
        assigneeName ?? null,
        totalQty !== undefined ? Number(totalQty) : null,
        targetDate ?? null,
        notes ?? null,
        id,
      ]
    );

    if (asnRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    const assignment = asnRes.rows[0];

    // 2. Replace phase breakdown if provided
    let finalPhaseBreak = [];
    if (Array.isArray(phaseBreakdown)) {
      await dbClient.query(
        `DELETE FROM assignment_phase_breakdown WHERE assignment_id = $1`,
        [assignment.id]
      );
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
        finalPhaseBreak.push(pbRes.rows[0]);
      }
    } else {
      const pbRes = await dbClient.query(
        `SELECT * FROM assignment_phase_breakdown WHERE assignment_id = $1`,
        [assignment.id]
      );
      finalPhaseBreak = pbRes.rows;
    }

    // 3. Replace unit breakdown if provided
    let finalUnitBreak = [];
    if (Array.isArray(unitBreakdown)) {
      await dbClient.query(
        `DELETE FROM assignment_unit_breakdown WHERE assignment_id = $1`,
        [assignment.id]
      );
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
        finalUnitBreak.push(ubRes.rows[0]);
      }
    } else {
      const ubRes = await dbClient.query(
        `SELECT * FROM assignment_unit_breakdown WHERE assignment_id = $1`,
        [assignment.id]
      );
      finalUnitBreak = ubRes.rows;
    }

    await dbClient.query("COMMIT");

    return NextResponse.json(
      formatAssignment(assignment, finalPhaseBreak, finalUnitBreak)
    );
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("PUT /api/assignments/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/assignments/[id] — delete by display_id
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
      `DELETE FROM scope_assignments WHERE display_id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/assignments/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
