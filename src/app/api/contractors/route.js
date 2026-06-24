import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// GET: Unified payload of contractors, deductions, and payments
export async function GET() {
  try {
    const contractorsRes = await pool.query(
      `SELECT * FROM contractors ORDER BY name ASC`
    );
    const deductionsRes = await pool.query(
      `SELECT d.*, c.display_id as contractor_display_id, c.name as contractor_name 
       FROM contractor_deductions d 
       JOIN contractors c ON d.contractor_id = c.id 
       ORDER BY d.date DESC`
    );
    const paymentsRes = await pool.query(
      `SELECT p.*, c.name as contractor_name 
       FROM contractor_payments p 
       JOIN contractors c ON p.contractor_id = c.id 
       ORDER BY p.date DESC`
    );

    const contractors = contractorsRes.rows.map((row) => ({
      id: row.display_id,
      name: row.name,
      trade: row.trade,
      rating: Number(row.rating),
      status: row.status,
      email: row.email,
      phone: row.phone,
    }));

    const deductions = deductionsRes.rows.map((row) => ({
      id: row.display_id,
      contractorId: row.contractor_display_id,
      contractorName: row.contractor_name,
      site: row.site,
      amount: Number(row.amount),
      category: row.category,
      date: formatDate(row.date),
      approvedBy: row.approved_by,
      description: row.description,
    }));

    const payments = paymentsRes.rows.map((row) => ({
      id: row.display_id,
      subcontractor: row.contractor_name,
      project: row.project,
      amount: Number(row.amount),
      date: formatDate(row.date),
      channel: row.channel,
      status: row.status,
    }));

    return NextResponse.json({ contractors, deductions, payments });
  } catch (error) {
    console.error("GET /api/contractors error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Add a new contractor
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
    const { name, trade, rating, status, email, phone } = body;

    if (!name || !trade) {
      return NextResponse.json(
        { error: "Name and Trade are required" },
        { status: 400 }
      );
    }

    const queryText = `
      INSERT INTO contractors (name, trade, rating, status, email, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, trade, rating, status, email, phone, display_id
    `;

    const result = await pool.query(queryText, [
      name.trim(),
      trade,
      rating !== undefined ? Number(rating) : 5.0,
      status || "Active",
      email || null,
      phone || null,
    ]);

    const row = result.rows[0];
    const newContractor = {
      id: row.display_id,
      name: row.name,
      trade: row.trade,
      rating: Number(row.rating),
      status: row.status,
      email: row.email,
      phone: row.phone,
    };

    return NextResponse.json(newContractor, { status: 201 });
  } catch (error) {
    console.error("POST /api/contractors error:", error);
    if (error.code === "23505") { // unique_violation for name
      return NextResponse.json(
        { error: "Contractor name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
