import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const getIntId = (displayId) => {
  if (!displayId) return null;
  const numStr = displayId.toUpperCase().replace("PAY-", "");
  return parseInt(numStr, 10);
};

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// PUT: Approve payment (status -> 'Cleared')
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
    console.log("[Approve Route] resolvedParams:", resolvedParams);
    const intId = getIntId(resolvedParams.id);
    console.log("[Approve Route] parsed intId:", intId);
    if (!intId || isNaN(intId)) {
      return NextResponse.json({ error: "Invalid Payment ID" }, { status: 400 });
    }

    const queryText = `
      UPDATE contractor_payments
      SET status = 'Cleared',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, project, amount, date, channel, status, display_id
    `;

    const result = await pool.query(queryText, [intId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Fetch contractor details to match naming expectation
    const queryContractor = `
      SELECT c.name FROM contractors c
      JOIN contractor_payments p ON p.contractor_id = c.id
      WHERE p.id = $1
    `;
    const contractorRes = await pool.query(queryContractor, [intId]);

    const row = result.rows[0];
    const updatedPayment = {
      id: row.display_id,
      subcontractor: contractorRes.rows[0]?.name || "Unknown",
      project: row.project,
      amount: Number(row.amount),
      date: formatDate(row.date),
      channel: row.channel,
      status: row.status,
    };

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("PUT /api/contractors/payments/[id]/approve error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
