import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Helper: shape a progress log row into the frontend object
// ---------------------------------------------------------------------------
function formatLog(row) {
  return {
    id: row.display_id,
    projectId: row.project_display_id,
    assignmentId: row.assignment_display_id,
    unitId: row.unit_display_id,
    phaseId: row.phase_display_id,
    scopeName: row.scope_name,
    uom: row.uom,
    date: row.date,
    qtyCompleted: row.qty_completed !== null ? Number(row.qty_completed) : null,
    rate: row.rate !== null ? Number(row.rate) : null,
    amountEarned: row.amount_earned !== null ? Number(row.amount_earned) : null,
    assigneeType: row.assignee_type,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    notes: row.notes,
    signedBy: row.signed_by,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// GET /api/progress-logs/[id] — fetch single log by display_id
// ---------------------------------------------------------------------------
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const logRes = await pool.query(
      `SELECT pl.*,
              p.display_id  AS project_display_id,
              sa.display_id AS assignment_display_id
       FROM progress_logs pl
       JOIN projects          p  ON pl.project_id    = p.id
       JOIN scope_assignments sa ON pl.assignment_id = sa.id
       WHERE pl.display_id = $1`,
      [id]
    );

    if (logRes.rowCount === 0) {
      return NextResponse.json({ error: "Progress log not found" }, { status: 404 });
    }

    return NextResponse.json(formatLog(logRes.rows[0]));
  } catch (error) {
    console.error("GET /api/progress-logs/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/progress-logs/[id] — update log; adjust breakdown done if qty changed
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
    const { qtyCompleted, notes, signedBy, status } = body;

    await dbClient.query("BEGIN");

    // 1. Fetch the current log to get old qty and breakdown references
    const existingRes = await dbClient.query(
      `SELECT pl.*,
              p.display_id  AS project_display_id,
              sa.display_id AS assignment_display_id
       FROM progress_logs pl
       JOIN projects          p  ON pl.project_id    = p.id
       JOIN scope_assignments sa ON pl.assignment_id = sa.id
       WHERE pl.display_id = $1`,
      [id]
    );

    if (existingRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Progress log not found" }, { status: 404 });
    }

    const existing = existingRes.rows[0];
    const oldQty = Number(existing.qty_completed ?? 0);
    const oldRate = Number(existing.rate ?? 0);

    // Determine new values — fall back to existing if not provided
    const newQty =
      qtyCompleted !== undefined ? Number(qtyCompleted) : oldQty;
    const newRate = oldRate; // rate is not editable via PUT per spec
    const newAmountEarned = newQty * newRate;

    // 2. Update the log row
    const logRes = await dbClient.query(
      `UPDATE progress_logs
       SET qty_completed  = $1,
           amount_earned  = $2,
           notes          = COALESCE($3, notes),
           signed_by      = COALESCE($4, signed_by),
           status         = COALESCE($5, status)
       WHERE display_id = $6
       RETURNING *`,
      [
        newQty,
        newAmountEarned,
        notes ?? null,
        signedBy ?? null,
        status ?? null,
        id,
      ]
    );

    const log = logRes.rows[0];

    // 3. Adjust breakdown done qty if qty changed
    const qtyDelta = newQty - oldQty;
    if (qtyDelta !== 0) {
      if (existing.unit_display_id) {
        await dbClient.query(
          `UPDATE assignment_unit_breakdown
           SET done = done + $1
           WHERE assignment_id = $2 AND unit_display_id = $3`,
          [qtyDelta, existing.assignment_id, existing.unit_display_id]
        );
      } else if (existing.phase_display_id) {
        await dbClient.query(
          `UPDATE assignment_phase_breakdown
           SET done = done + $1
           WHERE assignment_id = $2 AND phase_display_id = $3`,
          [qtyDelta, existing.assignment_id, existing.phase_display_id]
        );
      }
    }

    await dbClient.query("COMMIT");

    // Attach display_ids for the formatter
    log.project_display_id = existing.project_display_id;
    log.assignment_display_id = existing.assignment_display_id;
    log.unit_display_id = existing.unit_display_id;
    log.phase_display_id = existing.phase_display_id;

    return NextResponse.json(formatLog(log));
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("PUT /api/progress-logs/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/progress-logs/[id] — delete log by display_id
// ---------------------------------------------------------------------------
export async function DELETE(request, { params }) {
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

    await dbClient.query("BEGIN");

    // 1. Fetch the log details before deleting, to adjust the breakdowns
    const existingRes = await dbClient.query(
      `SELECT assignment_id, qty_completed, unit_display_id, phase_display_id
       FROM progress_logs
       WHERE display_id = $1`,
      [id]
    );

    if (existingRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Progress log not found" }, { status: 404 });
    }

    const log = existingRes.rows[0];
    const qty = Number(log.qty_completed ?? 0);

    // 2. Adjust breakdown done qty downward by the log's qty
    if (log.unit_display_id) {
      await dbClient.query(
        `UPDATE assignment_unit_breakdown
         SET done = done - $1
         WHERE assignment_id = $2 AND unit_display_id = $3`,
        [qty, log.assignment_id, log.unit_display_id]
      );
    } else if (log.phase_display_id) {
      await dbClient.query(
        `UPDATE assignment_phase_breakdown
         SET done = done - $1
         WHERE assignment_id = $2 AND phase_display_id = $3`,
        [qty, log.assignment_id, log.phase_display_id]
      );
    }

    // 3. Delete the progress log
    await dbClient.query(
      `DELETE FROM progress_logs WHERE display_id = $1`,
      [id]
    );

    await dbClient.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("DELETE /api/progress-logs/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}
