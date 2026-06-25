import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Retrieve latest notifications
export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, title, description, type, read, project_id AS \"projectId\", created_at AS \"createdAt\" FROM notifications ORDER BY created_at DESC LIMIT 50"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Add a new notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, type = "info", projectId = null } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and Description are required" },
        { status: 400 }
      );
    }

    const queryText = `
      INSERT INTO notifications (title, description, type, project_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, type, read, project_id AS "projectId", created_at AS "createdAt"
    `;
    const result = await pool.query(queryText, [title.trim(), description.trim(), type, projectId]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
