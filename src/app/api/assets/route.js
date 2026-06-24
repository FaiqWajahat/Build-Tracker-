import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getWorkerIntId = (displayId) => {
  if (!displayId) return null;
  const numStr = displayId.toUpperCase().replace("WRK-", "");
  const parsed = parseInt(numStr, 10);
  return isNaN(parsed) ? null : parsed;
};

// GET: Fetch all assets
export async function GET() {
  try {
    const queryText = `
      SELECT a.*, w.display_id as operator_display_id
      FROM assets a
      LEFT JOIN workers w ON a.operator_id = w.id
      ORDER BY a.id DESC
    `;
    const result = await pool.query(queryText);

    const assets = result.rows.map((row) => ({
      id: row.display_id,
      name: row.name,
      category: row.category,
      projectId: row.project_id || "",
      operatorId: row.operator_display_id || "",
      expectedReturnDate: formatDate(row.expected_return_date) || "",
      status: row.status,
      notes: row.notes || "",
    }));

    return NextResponse.json(assets);
  } catch (error) {
    console.error("GET /api/assets error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Add a new asset
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
    const { name, category, projectId, operatorId, expectedReturnDate, status, notes } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and Category are required" },
        { status: 400 }
      );
    }

    const workerIntId = getWorkerIntId(operatorId);

    const queryText = `
      INSERT INTO assets (name, category, project_id, operator_id, expected_return_date, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, category, project_id, operator_id, expected_return_date, status, notes, display_id
    `;

    const result = await pool.query(queryText, [
      name.trim(),
      category,
      projectId || null,
      workerIntId,
      expectedReturnDate || null,
      status || "Idle",
      notes || null,
    ]);

    const row = result.rows[0];
    const newAsset = {
      id: row.display_id,
      name: row.name,
      category: row.category,
      projectId: row.project_id || "",
      operatorId: operatorId || "", // return the display operator id
      expectedReturnDate: formatDate(row.expected_return_date) || "",
      status: row.status,
      notes: row.notes || "",
    };

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error("POST /api/assets error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
