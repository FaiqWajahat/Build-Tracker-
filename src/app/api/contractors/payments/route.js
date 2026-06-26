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

    // Generate dynamic system notification for payment request
    const notifTitle = `New Payment Request`;
    const notifDesc = `Payment request of SAR ${Number(amount).toLocaleString()} for ${contractorName} (${project}) is pending approval.`;
    const notifType = "info";

    try {
      await pool.query(
        `INSERT INTO notifications (title, description, type, project_id)
         VALUES ($1, $2, $3, $4)`,
        [notifTitle, notifDesc, notifType, project.trim()]
      );
    } catch (nErr) {
      console.error("Failed to generate payment notification:", nErr);
    }

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

// GET: Retrieve contractor payments with pagination
export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const contractorIdParam = searchParams.get("contractorId");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const conditions = [];
    const values = [];

    if (contractorIdParam) {
      const intId = parseInt(contractorIdParam.replace("CON-", ""), 10);
      if (!isNaN(intId)) {
        values.push(intId);
        conditions.push(`p.contractor_id = $${values.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let paymentsRes;
    let pagination = null;

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10) || 10));
      const offset = (page - 1) * limit;

      const countRes = await pool.query(
        `SELECT COUNT(*) FROM contractor_payments p ${whereClause}`,
        values
      );
      const total = parseInt(countRes.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);
      pagination = { page, limit, total, totalPages };

      paymentsRes = await pool.query(
        `SELECT p.*, c.name as contractor_name 
         FROM contractor_payments p 
         JOIN contractors c ON p.contractor_id = c.id 
         ${whereClause}
         ORDER BY p.date DESC, p.id DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      );
    } else {
      paymentsRes = await pool.query(
        `SELECT p.*, c.name as contractor_name 
         FROM contractor_payments p 
         JOIN contractors c ON p.contractor_id = c.id 
         ${whereClause}
         ORDER BY p.date DESC, p.id DESC
         LIMIT 500`,
        values
      );
    }

    const formatted = paymentsRes.rows.map((row) => ({
      id: row.display_id,
      subcontractor: row.contractor_name,
      project: row.project,
      amount: Number(row.amount),
      date: formatDate(row.date),
      channel: row.channel,
      status: row.status,
    }));

    if (pagination) {
      return NextResponse.json({ data: formatted, pagination });
    }
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/contractors/payments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
