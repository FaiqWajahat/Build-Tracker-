import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// POST: Create a new worker
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
      name,
      iqamaNumber,
      nationality,
      trade,
      payType,
      rate,
      phone,
      emergencyContact,
      joinDate,
      status,
      notes,
      bloodGroup,
      iqamaExpiry,
    } = body;

    if (!name || !payType || rate === undefined) {
      return NextResponse.json(
        { error: "Name, Pay Type, and Rate are required" },
        { status: 400 }
      );
    }

    const queryText = `
      INSERT INTO workers (
        name, iqama_number, nationality, trade, pay_type, rate, 
        phone, emergency_contact, join_date, status, notes, 
        blood_group, iqama_expiry
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, iqama_number, nationality, trade, pay_type, rate, 
                phone, emergency_contact, join_date, status, notes, 
                blood_group, iqama_expiry, display_id
    `;

    const result = await pool.query(queryText, [
      name.trim(),
      iqamaNumber || null,
      nationality || null,
      trade || null,
      payType,
      Number(rate) || 0,
      phone || null,
      emergencyContact || null,
      joinDate || new Date().toISOString().split("T")[0],
      status || "Active",
      notes || "",
      bloodGroup || null,
      iqamaExpiry || null,
    ]);

    const row = result.rows[0];
    const newWorker = {
      id: row.display_id,
      name: row.name,
      iqamaNumber: row.iqama_number,
      nationality: row.nationality,
      trade: row.trade,
      payType: row.pay_type,
      rate: Number(row.rate),
      phone: row.phone,
      emergencyContact: row.emergency_contact,
      joinDate: formatDate(row.join_date),
      status: row.status,
      notes: row.notes,
      bloodGroup: row.blood_group,
      iqamaExpiry: formatDate(row.iqama_expiry),
    };

    return NextResponse.json(newWorker, { status: 201 });
  } catch (error) {
    console.error("POST /api/workers error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
