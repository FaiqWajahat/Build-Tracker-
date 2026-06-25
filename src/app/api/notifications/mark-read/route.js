import { NextResponse } from "next/server";
import pool from "@/lib/db";

// PUT: Mark all notifications as read
export async function PUT() {
  try {
    await pool.query("UPDATE notifications SET read = true WHERE read = false");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/notifications/mark-read error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
