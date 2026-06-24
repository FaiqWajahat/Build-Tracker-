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

// PUT: Update an existing attendance record by serial ID
export async function PUT(request, { params }) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Admin privileges required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id: idParam } = resolvedParams;
    const numericId = getNumericId(idParam);

    if (!numericId) {
      return NextResponse.json({ error: "Invalid attendance ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
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

    const queryText = `
      UPDATE attendance
      SET status = $1, shift = $2, clock_in = $3, clock_out = $4, 
          break_minutes = $5, hours_worked = $6, overtime = $7, 
          location = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING id, worker_id, date, project_id, status, shift, clock_in, clock_out, 
                break_minutes, hours_worked, overtime, location, notes, display_id
    `;

    const result = await pool.query(queryText, [
      status,
      shift || "full-day",
      clockIn || null,
      clockOut || null,
      Number(breakMinutes) || 0,
      Number(hoursWorked) || 0,
      Number(overtime) || 0,
      location || "",
      notes || "",
      numericId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    const row = result.rows[0];

    // Fetch worker display_id to build full formatted payload
    const workerResult = await pool.query(
      "SELECT display_id FROM workers WHERE id = $1",
      [row.worker_id]
    );

    const formattedEntry = {
      id: row.display_id,
      workerId: workerResult.rows[0]?.display_id || "",
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

    return NextResponse.json(formattedEntry);
  } catch (error) {
    console.error("PUT /api/attendance/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an attendance record
export async function DELETE(request, { params }) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Admin privileges required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id: idParam } = resolvedParams;
    const numericId = getNumericId(idParam);

    if (!numericId) {
      return NextResponse.json({ error: "Invalid attendance ID" }, { status: 400 });
    }

    const queryText = `
      DELETE FROM attendance
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(queryText, [numericId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/attendance/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
