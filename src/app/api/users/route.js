import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyAdmin } from "@/lib/auth";

// GET: Fetch all ERP users
export async function GET() {
  try {
    const queryText = `
      SELECT id, name, email, role, active_site, status, last_login, display_id
      FROM erp_users
      ORDER BY id ASC
    `;
    const result = await pool.query(queryText);

    const users = result.rows.map((row) => ({
      id: row.display_id,
      name: row.name,
      email: row.email,
      role: row.role,
      activeSite: row.active_site || "",
      status: row.status,
      lastLogin: row.last_login || "Never",
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Register/Invite a new user
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
    const { name, email, role, activeSite, status, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const checkUser = await pool.query("SELECT id FROM erp_users WHERE email = $1", [email.trim().toLowerCase()]);
    if (checkUser.rows.length > 0) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password (default to 'password123' if not provided)
    const rawPassword = password || "password123";
    const hashedPassword = bcrypt.hashSync(rawPassword, 10);

    const queryText = `
      INSERT INTO erp_users (name, email, role, active_site, status, password, last_login)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role, active_site, status, last_login, display_id
    `;

    const result = await pool.query(queryText, [
      name.trim(),
      email.trim().toLowerCase(),
      role,
      activeSite || "All Sites",
      status || "Active",
      hashedPassword,
      "Never"
    ]);

    const row = result.rows[0];
    const newUser = {
      id: row.display_id,
      name: row.name,
      email: row.email,
      role: row.role,
      activeSite: row.active_site || "",
      status: row.status,
      lastLogin: row.last_login || "Never",
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
