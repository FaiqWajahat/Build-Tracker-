import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getAssetIntId = (displayId) => {
  if (!displayId) return null;
  const numStr = displayId.toUpperCase().replace("AST-", "");
  const parsed = parseInt(numStr, 10);
  return isNaN(parsed) ? null : parsed;
};

const getWorkerIntId = (displayId) => {
  if (!displayId) return null;
  const numStr = displayId.toUpperCase().replace("WRK-", "");
  const parsed = parseInt(numStr, 10);
  return isNaN(parsed) ? null : parsed;
};

// PUT: Update asset details
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
    const intId = getAssetIntId(resolvedParams.id);
    if (!intId || isNaN(intId)) {
      return NextResponse.json({ error: "Invalid Asset ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, projectId, operatorId, expectedReturnDate, status, notes } = body;

    const workerIntId = getWorkerIntId(operatorId);

    const queryText = `
      UPDATE assets
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          project_id = $3,
          operator_id = $4,
          expected_return_date = $5,
          status = COALESCE($6, status),
          notes = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, name, category, project_id, operator_id, expected_return_date, status, notes, display_id
    `;

    const result = await pool.query(queryText, [
      name ? name.trim() : null,
      category || null,
      projectId || null,
      workerIntId,
      expectedReturnDate || null,
      status || null,
      notes || null,
      intId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const row = result.rows[0];

    const updatedAsset = {
      id: row.display_id,
      name: row.name,
      category: row.category,
      projectId: row.project_id || "",
      operatorId: operatorId || "", // return the display operator id
      expectedReturnDate: formatDate(row.expected_return_date) || "",
      status: row.status,
      notes: row.notes || "",
    };

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error("PUT /api/assets/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete asset
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
    const intId = getAssetIntId(resolvedParams.id);
    if (!intId || isNaN(intId)) {
      return NextResponse.json({ error: "Invalid Asset ID" }, { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM assets WHERE id = $1 RETURNING id`,
      [intId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/assets/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
