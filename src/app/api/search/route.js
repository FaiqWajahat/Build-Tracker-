import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET(request) {
  try {
    const loggedIn = await isAuthenticated();
    if (!loggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ workers: [], contractors: [], teams: [] });
    }

    const cleanQuery = `%${query.trim()}%`;

    // Query Workers (display_id, name, trade)
    const workersRes = await pool.query(
      `SELECT display_id as id, name, trade 
       FROM workers 
       WHERE name ILIKE $1 OR trade ILIKE $1 OR display_id ILIKE $1
       LIMIT 5`,
      [cleanQuery]
    );

    // Query Contractors (display_id, name, trade)
    const contractorsRes = await pool.query(
      `SELECT display_id as id, name, trade 
       FROM contractors 
       WHERE name ILIKE $1 OR trade ILIKE $1 OR display_id ILIKE $1
       LIMIT 5`,
      [cleanQuery]
    );

    // Query Teams (display_id, name, trade)
    const teamsRes = await pool.query(
      `SELECT display_id as id, name, trade 
       FROM labour_teams 
       WHERE name ILIKE $1 OR trade ILIKE $1 OR display_id ILIKE $1
       LIMIT 5`,
      [cleanQuery]
    );

    return NextResponse.json({
      workers: workersRes.rows,
      contractors: contractorsRes.rows,
      teams: teamsRes.rows
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
