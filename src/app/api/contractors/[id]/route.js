import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// Helper to get integer ID from display ID (CON-001 -> 1)
const getIntId = (displayId) => {
  if (!displayId) return null;
  const numStr = displayId.replace("CON-", "");
  return parseInt(numStr, 10);
};

// PUT: Update contractor details
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
    const intId = getIntId(resolvedParams.id);
    if (!intId || isNaN(intId)) {
      return NextResponse.json({ error: "Invalid Contractor ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, trade, rating, status, email, phone } = body;

    const queryText = `
      UPDATE contractors
      SET name = COALESCE($1, name),
          trade = COALESCE($2, trade),
          rating = COALESCE($3, rating),
          status = COALESCE($4, status),
          email = COALESCE($5, email),
          phone = COALESCE($6, phone),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, trade, rating, status, email, phone, display_id
    `;

    const result = await pool.query(queryText, [
      name ? name.trim() : null,
      trade || null,
      rating !== undefined ? Number(rating) : null,
      status || null,
      email || null,
      phone || null,
      intId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    const row = result.rows[0];
    const updatedContractor = {
      id: row.display_id,
      name: row.name,
      trade: row.trade,
      rating: Number(row.rating),
      status: row.status,
      email: row.email,
      phone: row.phone,
    };

    return NextResponse.json(updatedContractor);
  } catch (error) {
    console.error("PUT /api/contractors/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete contractor (cascades to deductions and payments)
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
    const intId = getIntId(resolvedParams.id);
    if (!intId || isNaN(intId)) {
      return NextResponse.json({ error: "Invalid Contractor ID" }, { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM contractors WHERE id = $1 RETURNING id`,
      [intId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contractors/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
