import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-7d-sa";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user in database
    const queryText = `
      SELECT id, name, email, role, active_site, status, password, display_id
      FROM erp_users
      WHERE email = $1
    `;
    const result = await pool.query(queryText, [email.trim().toLowerCase()]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status !== "Active") {
      return NextResponse.json(
        { error: `Account is ${user.status}. Please contact system administrator.` },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        displayId: user.display_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    // Update last login
    const nowString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " ago";
    await pool.query("UPDATE erp_users SET last_login = $1 WHERE id = $2", ["1m ago", user.id]);

    const loggedInUser = {
      id: user.display_id,
      name: user.name,
      email: user.email,
      role: user.role,
      activeSite: user.active_site || "",
      status: user.status,
    };

    return NextResponse.json({ success: true, user: loggedInUser });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
