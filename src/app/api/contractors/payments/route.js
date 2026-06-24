import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// POST: Add a subcontractor payment
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
    const { subcontractor, project, amount, date, channel, status } = body;

    if (!subcontractor || !project || amount === undefined || !channel) {
      return NextResponse.json(
        { error: "Subcontractor, Project, Amount, and Channel are required" },
        { status: 400 }
      );
    }

    // Resolve contractor integer ID by name lookup (case-insensitive)
    const contractorRes = await pool.query(
      `SELECT id, name FROM contractors WHERE LOWER(name) = LOWER($1)`,
      [subcontractor.trim()]
    );

    if (contractorRes.rowCount === 0) {
      return NextResponse.json(
        { error: `Contractor partner "${subcontractor}" not found. Please register them first.` },
        { status: 400 }
      );
    }

    const contractorId = contractorRes.rows[0].id;
    const contractorName = contractorRes.rows[0].name; // actual name matching case

    const queryText = `
      INSERT INTO contractor_payments (contractor_id, project, amount, date, channel, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, contractor_id, project, amount, date, channel, status, display_id
    `;

    const result = await pool.query(queryText, [
      contractorId,
      project.trim(),
      Number(amount) || 0,
      date || new Date().toISOString().split("T")[0],
      channel.trim(),
      status || "Pending Approval",
    ]);

    const row = result.rows[0];
    const newPayment = {
      id: row.display_id,
      subcontractor: contractorName,
      project: row.project,
      amount: Number(row.amount),
      date: formatDate(row.date),
      channel: row.channel,
      status: row.status,
    };

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("POST /api/contractors/payments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
