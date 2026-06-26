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

// GET: Retrieve paginated list of advances, optionally filtered by worker
export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const workerIdParam = searchParams.get("workerId");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const conditions = [];
    const values = [];

    if (workerIdParam) {
      const numericWorkerId = getNumericId(workerIdParam);
      if (numericWorkerId) {
        values.push(numericWorkerId);
        conditions.push(`adv.worker_id = $${values.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10) || 20));
      const offset = (page - 1) * limit;

      const countRes = await pool.query(
        `SELECT COUNT(*) FROM advances adv ${whereClause}`,
        values
      );
      const total = parseInt(countRes.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);

      const selectQuery = `
        SELECT adv.id, adv.type, adv.amount, adv.date, adv.description, 
               adv.status, adv.display_id, w.display_id as worker_display_id
        FROM advances adv
        JOIN workers w ON adv.worker_id = w.id
        ${whereClause}
        ORDER BY adv.date DESC, adv.id DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;

      const result = await pool.query(selectQuery, [...values, limit, offset]);

      const formatted = result.rows.map((row) => ({
        id: row.display_id,
        workerId: row.worker_display_id,
        type: row.type,
        amount: Number(row.amount),
        date: formatDate(row.date),
        description: row.description,
        status: row.status,
      }));

      return NextResponse.json({
        data: formatted,
        pagination: { page, limit, total, totalPages }
      });
    }

    const selectQuery = `
      SELECT adv.id, adv.type, adv.amount, adv.date, adv.description, 
             adv.status, adv.display_id, w.display_id as worker_display_id
      FROM advances adv
      JOIN workers w ON adv.worker_id = w.id
      ${whereClause}
      ORDER BY adv.date DESC, adv.id DESC
      LIMIT 500
    `;

    const result = await pool.query(selectQuery, values);

    const formatted = result.rows.map((row) => ({
      id: row.display_id,
      workerId: row.worker_display_id,
      type: row.type,
      amount: Number(row.amount),
      date: formatDate(row.date),
      description: row.description,
      status: row.status,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/advances error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
