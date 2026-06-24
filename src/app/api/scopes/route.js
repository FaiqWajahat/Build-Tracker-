import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// GET: Retrieve all master scopes
export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, trade, name, uom, created_at, display_id FROM master_scopes ORDER BY id ASC"
    );

    // Map display_id to id for frontend compatibility
    const scopes = result.rows.map((row) => ({
      id: row.display_id,
      trade: row.trade,
      name: row.name,
      uom: row.uom,
      createdAt: row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : null,
    }));

    return NextResponse.json(scopes);
  } catch (error) {
    console.error("GET /api/scopes error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Add a new scope
export async function POST(request) {
  try {
    // Authorization check
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { trade, name, uom } = body;

    // Validation
    if (!trade || !name || !uom) {
      return NextResponse.json(
        { error: "Trade, Name, and UOM are required" },
        { status: 400 }
      );
    }

    // Insert into DB
    const queryText = `
      INSERT INTO master_scopes (trade, name, uom)
      VALUES ($1, $2, $3)
      RETURNING id, trade, name, uom, created_at, display_id
    `;
    const result = await pool.query(queryText, [trade.trim(), name.trim(), uom.trim()]);
    const row = result.rows[0];

    // Return newly created scope with display_id mapped as id
    const newScope = {
      id: row.display_id,
      trade: row.trade,
      name: row.name,
      uom: row.uom,
      createdAt: row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : null,
    };

    return NextResponse.json(newScope, { status: 201 });
  } catch (error) {
    console.error("POST /api/scopes error:", error);
    
    // Check for duplicate key constraint error (PostgreSQL error code '23505')
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A scope with this name already exists in this trade" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
