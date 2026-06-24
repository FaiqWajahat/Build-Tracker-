import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// Helper to get integer ID from display ID (PAY-001 -> 1)
const getIntId = (displayId) => {
  if (!displayId) return null;
  const numStr = displayId.replace("PAY-", "");
  return parseInt(numStr, 10);
};

// DELETE: Delete a contractor payment record
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
      return NextResponse.json({ error: "Invalid Payment ID" }, { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM contractor_payments WHERE id = $1 RETURNING id`,
      [intId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contractors/payments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
