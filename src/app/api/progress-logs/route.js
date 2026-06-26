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
// GET /api/progress-logs — fetch all logs, optional ?projectId= & ?assignmentId=
// ---------------------------------------------------------------------------
export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const assignmentId = searchParams.get("assignmentId");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const conditions = [];
    const values = [];

    if (projectId) {
      values.push(projectId);
      conditions.push(`p.display_id = $${values.length}`);
    }
    if (assignmentId) {
      values.push(assignmentId);
      conditions.push(`sa.display_id = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10) || 20));
      const offset = (page - 1) * limit;

      const countRes = await pool.query(
        `SELECT COUNT(*)
         FROM progress_logs pl
         JOIN projects         p  ON pl.project_id    = p.id
         JOIN scope_assignments sa ON pl.assignment_id = sa.id
         ${whereClause}`,
        values
      );
      const total = parseInt(countRes.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);

      const logsRes = await pool.query(
        `SELECT pl.*,
                p.display_id  AS project_display_id,
                sa.display_id AS assignment_display_id
         FROM progress_logs pl
         JOIN projects         p  ON pl.project_id    = p.id
         JOIN scope_assignments sa ON pl.assignment_id = sa.id
         ${whereClause}
         ORDER BY pl.date DESC, pl.created_at DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      );

      return NextResponse.json({
        data: logsRes.rows.map(formatLog),
        pagination: { page, limit, total, totalPages }
      });
    }

    const logsRes = await pool.query(
      `SELECT pl.*,
              p.display_id  AS project_display_id,
              sa.display_id AS assignment_display_id
       FROM progress_logs pl
       JOIN projects         p  ON pl.project_id    = p.id
       JOIN scope_assignments sa ON pl.assignment_id = sa.id
       ${whereClause}
       ORDER BY pl.date DESC, pl.created_at DESC
       LIMIT 500`,
      values
    );

    return NextResponse.json(logsRes.rows.map(formatLog));
  } catch (error) {
    console.error("GET /api/progress-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/progress-logs — create a new log + update breakdown done qty
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
      assignmentId,
      unitId,
      phaseId,
      scopeName,
      uom,
      date,
      qtyCompleted,
      rate,
      assigneeType,
      assigneeId,
      assigneeName,
      notes,
      signedBy,
      status,
    } = body;

    if (!projectId || !assignmentId || !date) {
      return NextResponse.json(
        { error: "projectId, assignmentId, and date are required" },
        { status: 400 }
      );
    }

    const qty = Number(qtyCompleted ?? 0);
    const rateNum = Number(rate ?? 0);
    const amountEarned = qty * rateNum;

    await dbClient.query("BEGIN");

    // 1. Resolve numeric project id
    const projRes = await dbClient.query(
      `SELECT id FROM projects WHERE display_id = $1`,
      [projectId]
    );
    if (projRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const numericProjectId = projRes.rows[0].id;

    // 2. Resolve numeric assignment id
    const asnRes = await dbClient.query(
      `SELECT id FROM scope_assignments WHERE display_id = $1`,
      [assignmentId]
    );
    if (asnRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    const numericAssignmentId = asnRes.rows[0].id;

    // 3. Insert progress log
    const logRes = await dbClient.query(
      `INSERT INTO progress_logs
         (project_id, assignment_id, unit_display_id, phase_display_id,
          scope_name, uom, date, qty_completed, rate, amount_earned,
          assignee_type, assignee_id, assignee_name, notes, signed_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        numericProjectId,
        numericAssignmentId,
        unitId || null,
        phaseId || null,
        scopeName || null,
        uom || null,
        date,
        qty,
        rateNum,
        amountEarned,
        assigneeType || null,
        assigneeId || null,
        assigneeName || null,
        notes || null,
        signedBy || null,
        status || "Pending",
      ]
    );
    const log = logRes.rows[0];

    // 4. Update breakdown done qty
    if (unitId) {
      await dbClient.query(
        `UPDATE assignment_unit_breakdown
         SET done = done + $1
         WHERE assignment_id = $2 AND unit_display_id = $3`,
        [qty, numericAssignmentId, unitId]
      );
    } else if (phaseId) {
      await dbClient.query(
        `UPDATE assignment_phase_breakdown
         SET done = done + $1
         WHERE assignment_id = $2 AND phase_display_id = $3`,
        [qty, numericAssignmentId, phaseId]
      );
    }

    // 5. Generate dynamic system notification
    let notifTitle = `${scopeName || "Work"} progress update`;
    let notifDesc = `${assigneeName || "Team"} logged ${qty} ${uom || ""} for ${unitId || phaseId || "project"}.`;
    let notifType = "info";

    if (status === "Delayed" || status === "Blocked") {
      notifTitle = `${scopeName || "Work"} flagged as ${status}`;
      notifDesc = `${assigneeName || "Team"} reported ${status.toLowerCase()} status for ${unitId || phaseId || "project"}.${notes ? ` Notes: ${notes}` : ""}`;
      notifType = "warning";
    } else if (status === "Completed") {
      notifTitle = `${scopeName || "Work"} completed`;
      notifDesc = `${assigneeName || "Team"} marked this scope as completed for ${unitId || phaseId || "project"}.`;
      notifType = "success";
    }

    await dbClient.query(
      `INSERT INTO notifications (title, description, type, project_id)
       VALUES ($1, $2, $3, $4)`,
      [notifTitle, notifDesc, notifType, projectId]
    );

    await dbClient.query("COMMIT");

    // Attach display_ids for the formatter
    log.project_display_id = projectId;
    log.assignment_display_id = assignmentId;

    return NextResponse.json(formatLog(log), { status: 201 });
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("POST /api/progress-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}
