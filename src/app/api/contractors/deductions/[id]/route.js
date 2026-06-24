import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// Helper to get integer ID from display ID (DED-001 -> 1)
const getIntId = (displayId) => {
  if (!displayId) return null;
  const numStr = displayId.replace("DED-", "");
  return parseInt(numStr, 10);
};

// DELETE: Delete a contractor deduction record
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
      return NextResponse.json({ error: "Invalid Deduction ID" }, { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM contractor_deductions WHERE id = $1 RETURNING id`,
      [intId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Deduction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contractors/deductions/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
