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

// PUT: Update an existing advance record
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
      return NextResponse.json({ error: "Invalid advance ID" }, { status: 400 });
    }

    const body = await request.json();
    const { type, amount, date, description, status } = body;

    const queryText = `
      UPDATE advances
      SET type = COALESCE($1, type), 
          amount = COALESCE($2, amount), 
          date = COALESCE($3, date), 
          description = COALESCE($4, description), 
          status = COALESCE($5, status), 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, worker_id, type, amount, date, description, status, display_id
    `;

    const result = await pool.query(queryText, [
      type || null,
      amount !== undefined && amount !== null ? Number(amount) : null,
      date || null,
      description !== undefined ? description : null,
      status || null,
      numericId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Advance record not found" }, { status: 404 });
    }

    const row = result.rows[0];

    // Fetch worker display_id
    const workerResult = await pool.query(
      "SELECT display_id FROM workers WHERE id = $1",
      [row.worker_id]
    );

    const formattedEntry = {
      id: row.display_id,
      workerId: workerResult.rows[0]?.display_id || "",
      type: row.type,
      amount: Number(row.amount),
      date: formatDate(row.date),
      description: row.description,
      status: row.status,
    };

    return NextResponse.json(formattedEntry);
  } catch (error) {
    console.error("PUT /api/advances/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an advance record
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
      return NextResponse.json({ error: "Invalid advance ID" }, { status: 400 });
    }

    const queryText = `
      DELETE FROM advances
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(queryText, [numericId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Advance record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Advance record deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/advances/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
