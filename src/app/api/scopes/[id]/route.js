import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// Helper to extract numeric ID from 'SCO-XXX' or 'XXX' format
function getNumericId(idParam) {
  if (!idParam) return null;
  const match = idParam.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// PUT: Update an existing scope
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
      return NextResponse.json(
        { error: "Invalid scope ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { trade, name, uom } = body;

    // Validation
    if (!trade || !name || !uom) {
      return NextResponse.json(
        { error: "Trade, Name, and UOM are required" },
        { status: 400 }
      );
    }

    // Update in DB
    const queryText = `
      UPDATE master_scopes
      SET trade = $1, name = $2, uom = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, trade, name, uom, created_at, display_id
    `;
    const result = await pool.query(queryText, [trade.trim(), name.trim(), uom.trim(), numericId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Scope not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const updatedScope = {
      id: row.display_id,
      trade: row.trade,
      name: row.name,
      uom: row.uom,
      createdAt: row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : null,
    };

    return NextResponse.json(updatedScope);
  } catch (error) {
    console.error("PUT /api/scopes/[id] error:", error);

    // Duplicate key constraint error
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A scope with this name already exists in this trade" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an existing scope
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
      return NextResponse.json(
        { error: "Invalid scope ID format" },
        { status: 400 }
      );
    }

    const queryText = `
      DELETE FROM master_scopes
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(queryText, [numericId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Scope not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Scope deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/scopes/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
