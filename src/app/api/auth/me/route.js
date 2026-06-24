import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-7d-sa";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenObj = cookieStore.get("token");
    const token = tokenObj?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Fetch user from DB to ensure they still exist and status is Active
    const queryText = `
      SELECT id, name, email, role, active_site, status, display_id
      FROM erp_users
      WHERE id = $1
    `;
    const result = await pool.query(queryText, [decoded.id]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User no longer exists" },
        { status: 401 }
      );
    }

    if (user.status !== "Active") {
      return NextResponse.json(
        { error: `Account status is ${user.status}` },
        { status: 403 }
      );
    }

    const currentUser = {
      id: user.display_id,
      name: user.name,
      email: user.email,
      role: user.role,
      activeSite: user.active_site || "",
      status: user.status,
    };

    return NextResponse.json({ success: true, user: currentUser });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
