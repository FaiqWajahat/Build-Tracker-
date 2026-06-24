import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyAdmin } from "@/lib/auth";

const getIntId = (displayId) => {
  if (!displayId) return null;
  const numStr = displayId.toUpperCase().replace("USR-", "");
  const parsed = parseInt(numStr, 10);
  return isNaN(parsed) ? null : parsed;
};

// PUT: Update user profile
export async function PUT(request, { params }) {
  try {
    // Authorization check
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Admin privileges required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const intId = getIntId(resolvedParams.id);
    if (!intId || isNaN(intId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, role, activeSite, status, password } = body;

    // Check if user exists
    const checkUser = await pool.query("SELECT password FROM erp_users WHERE id = $1", [intId]);
    if (checkUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let queryText = "";
    let queryParams = [];

    if (password && password.trim() !== "") {
      const hashedPassword = bcrypt.hashSync(password, 10);
      queryText = `
        UPDATE erp_users
        SET name = $1, email = $2, role = $3, active_site = $4, status = $5, password = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, name, email, role, active_site, status, last_login, display_id
      `;
      queryParams = [
        name.trim(),
        email.trim().toLowerCase(),
        role,
        activeSite || "All Sites",
        status || "Active",
        hashedPassword,
        intId
      ];
    } else {
      queryText = `
        UPDATE erp_users
        SET name = $1, email = $2, role = $3, active_site = $4, status = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, name, email, role, active_site, status, last_login, display_id
      `;
      queryParams = [
        name.trim(),
        email.trim().toLowerCase(),
        role,
        activeSite || "All Sites",
        status || "Active",
        intId
      ];
    }

    const result = await pool.query(queryText, queryParams);
    const row = result.rows[0];

    const updatedUser = {
      id: row.display_id,
      name: row.name,
      email: row.email,
      role: row.role,
      activeSite: row.active_site || "",
      status: row.status,
      lastLogin: row.last_login || "Never",
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete user account
export async function DELETE(request, { params }) {
  try {
    // Authorization check
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Admin privileges required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const intId = getIntId(resolvedParams.id);
    if (!intId || isNaN(intId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    const queryText = `
      DELETE FROM erp_users
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(queryText, [intId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
