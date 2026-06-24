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

// POST: Add or update single attendance log (UPSERT)
export async function POST(request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      workerId, // display_id like 'WRK-001'
      date,
      projectId,
      status,
      shift,
      clockIn,
      clockOut,
      breakMinutes,
      hoursWorked,
      overtime,
      location,
      notes,
    } = body;

    if (!workerId || !date || !status) {
      return NextResponse.json(
        { error: "Worker ID, Date, and Status are required" },
        { status: 400 }
      );
    }

    const numericWorkerId = getNumericId(workerId);
    if (!numericWorkerId) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
    }

    // Upsert query
    const queryText = `
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

    const result = await pool.query(queryText, [
      numericWorkerId,
      date,
      projectId || null,
      status,
      shift || "full-day",
      clockIn || null,
      clockOut || null,
      Number(breakMinutes) || 0,
      Number(hoursWorked) || 0,
      Number(overtime) || 0,
      location || "",
      notes || "",
    ]);

    const row = result.rows[0];
    const formattedEntry = {
      id: row.display_id,
      workerId: workerId,
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
    };

    return NextResponse.json(formattedEntry, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
