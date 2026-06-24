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

// PUT: Update worker profile
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
    const { id: idParam } = resolvedParams;
    const numericId = getNumericId(idParam);

    if (!numericId) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
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
      UPDATE workers
      SET name = $1, iqama_number = $2, nationality = $3, trade = $4, 
          pay_type = $5, rate = $6, phone = $7, emergency_contact = $8, 
          join_date = $9, status = $10, notes = $11, blood_group = $12, 
          iqama_expiry = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
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
      joinDate || null,
      status || "Active",
      notes || "",
      bloodGroup || null,
      iqamaExpiry || null,
      numericId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const row = result.rows[0];
    const updatedWorker = {
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

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error("PUT /api/workers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete worker profile
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
    const { id: idParam } = resolvedParams;
    const numericId = getNumericId(idParam);

    if (!numericId) {
      return NextResponse.json({ error: "Invalid worker ID" }, { status: 400 });
    }

    // References to worker (attendance, advances, team_members) are handled by CASCADE in DDL
    const queryText = `
      DELETE FROM workers
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(queryText, [numericId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Worker deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/workers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
