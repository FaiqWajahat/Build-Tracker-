import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// POST: Add a new deduction
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
    const { contractorId, site, amount, category, date, approvedBy, description } = body;

    if (!contractorId || !site || amount === undefined || !category) {
      return NextResponse.json(
        { error: "Contractor ID, Site, Amount, and Category are required" },
        { status: 400 }
      );
    }

    // Resolve contractor integer ID from display ID (CON-001 -> 1)
    const intContractorId = parseInt(contractorId.replace("CON-", ""), 10);
    if (isNaN(intContractorId)) {
      return NextResponse.json({ error: "Invalid Contractor ID format" }, { status: 400 });
    }

    const queryText = `
      INSERT INTO contractor_deductions (contractor_id, site, amount, category, date, approved_by, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, contractor_id, site, amount, category, date, approved_by, description, display_id
    `;

    const result = await pool.query(queryText, [
      intContractorId,
      site.trim(),
      Number(amount) || 0,
      category.trim(),
      date || new Date().toISOString().split("T")[0],
      approvedBy || null,
      description || "",
    ]);

    // Fetch contractor details to return contractorName and contractorId as display IDs
    const contractorRes = await pool.query(
      `SELECT display_id, name FROM contractors WHERE id = $1`,
      [intContractorId]
    );

    const row = result.rows[0];
    const contractorRow = contractorRes.rows[0];

    const newDeduction = {
      id: row.display_id,
      contractorId: contractorRow?.display_id || contractorId,
      contractorName: contractorRow?.name || "Unknown",
      site: row.site,
      amount: Number(row.amount),
      category: row.category,
      date: formatDate(row.date),
      approvedBy: row.approved_by,
      description: row.description,
    };

    return NextResponse.json(newDeduction, { status: 201 });
  } catch (error) {
    console.error("POST /api/contractors/deductions error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET: Retrieve contractor deductions with pagination
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
        conditions.push(`d.contractor_id = $${values.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let deductionsRes;
    let pagination = null;

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10) || 10));
      const offset = (page - 1) * limit;

      const countRes = await pool.query(
        `SELECT COUNT(*) FROM contractor_deductions d ${whereClause}`,
        values
      );
      const total = parseInt(countRes.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);
      pagination = { page, limit, total, totalPages };

      deductionsRes = await pool.query(
        `SELECT d.*, c.display_id as contractor_display_id, c.name as contractor_name 
         FROM contractor_deductions d 
         JOIN contractors c ON d.contractor_id = c.id 
         ${whereClause}
         ORDER BY d.date DESC, d.id DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      );
    } else {
      deductionsRes = await pool.query(
        `SELECT d.*, c.display_id as contractor_display_id, c.name as contractor_name 
         FROM contractor_deductions d 
         JOIN contractors c ON d.contractor_id = c.id 
         ${whereClause}
         ORDER BY d.date DESC, d.id DESC
         LIMIT 500`,
        values
      );
    }

    const formatted = deductionsRes.rows.map((row) => ({
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

    if (pagination) {
      return NextResponse.json({ data: formatted, pagination });
    }
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/contractors/deductions error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
