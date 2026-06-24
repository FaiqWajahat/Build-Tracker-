import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Helper to extract numeric ID from display ID
function getNumericId(idParam) {
  if (!idParam) return null;
  const match = idParam.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// POST: Bulk mark attendance logs for multiple workers
export async function POST(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Access Denied: Admin privileges required" },
      { status: 403 }
    );
  }

  const client = await pool.connect();
  try {
    const body = await request.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid payload, entries array required" }, { status: 400 });
    }

    await client.query("BEGIN");

    const savedEntries = [];

    const upsertQuery = `
      INSERT INTO attendance (
        worker_id, date, project_id, status, shift, clock_in, clock_out, 
        break_minutes, hours_worked, overtime, location, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (worker_id, date)
      DO UPDATE SET
        project_id = EXCLUDED.project_id,
        status = EXCLUDED.status,
        shift = EXCLUDED.shift,
        clock_in = EXCLUDED.clock_in,
        clock_out = EXCLUDED.clock_out,
        break_minutes = EXCLUDED.break_minutes,
        hours_worked = EXCLUDED.hours_worked,
        overtime = EXCLUDED.overtime,
        location = EXCLUDED.location,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, worker_id, date, project_id, status, shift, clock_in, clock_out, 
                break_minutes, hours_worked, overtime, location, notes, display_id
    `;

    for (const entry of entries) {
      const numericWorkerId = getNumericId(entry.workerId);
      if (!numericWorkerId) continue;

      const result = await client.query(upsertQuery, [
        numericWorkerId,
        entry.date,
        entry.projectId || null,
        entry.status,
        entry.shift || "full-day",
        entry.clockIn || null,
        entry.clockOut || null,
        Number(entry.breakMinutes) || 0,
        Number(entry.hoursWorked) || 0,
        Number(entry.overtime) || 0,
        entry.location || "",
        entry.notes || "",
      ]);

      const row = result.rows[0];
      savedEntries.push({
        id: row.display_id,
        workerId: entry.workerId,
        date: formatDate(row.date),
        projectId: row.project_id,
        status: row.status,
        shift: row.shift,
        clockIn: row.clock_in ? row.clock_in.substring(0, 5) : null,
        clockOut: row.clock_out ? row.clock_out.substring(0, 5) : null,
        breakMinutes: Number(row.break_minutes),
        hoursWorked: Number(row.hours_worked),
        overtime: Number(row.overtime),
        location: row.location,
        notes: row.notes,
      });
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true, count: savedEntries.length, data: savedEntries });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/attendance/bulk error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
