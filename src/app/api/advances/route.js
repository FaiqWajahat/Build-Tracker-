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

// POST: Add a new advance/expense/bonus
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
    const {
      workerId, // display_id like 'WRK-001'
      type,
      amount,
      date,
      description,
      status,
    } = body;

    if (!workerId || !type || amount === undefined) {
      return NextResponse.json(
        { error: "Worker ID, Type, and Amount are required" },
        { status: 400 }
      );
    }

    const numericWorkerId = getNumericId(workerId);
    if (!numericWorkerId) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
    }

    const queryText = `
      INSERT INTO advances (worker_id, type, amount, date, description, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, worker_id, type, amount, date, description, status, display_id
    `;

    const result = await pool.query(queryText, [
      numericWorkerId,
      type,
      Number(amount) || 0,
      date || new Date().toISOString().split("T")[0],
      description || "",
      status || "pending",
    ]);

    const row = result.rows[0];
    const formattedEntry = {
      id: row.display_id,
      workerId: workerId,
      type: row.type,
      amount: Number(row.amount),
      date: formatDate(row.date),
      description: row.description,
      status: row.status,
    };

    return NextResponse.json(formattedEntry, { status: 201 });
  } catch (error) {
    console.error("POST /api/advances error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
