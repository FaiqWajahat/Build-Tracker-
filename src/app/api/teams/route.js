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

// POST: Create a new team
export async function POST(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Access Denied: Admin privileges required" },
      { status: 403 }
    );
  }

  const client = await pool.connect();
  try {
    const body = await request.json();
    const {
      name,
      projectId,
      projectName,
      leaderId, // display_id like 'WRK-001'
      memberIds, // array of display_ids like ['WRK-001', 'WRK-002']
      trade,
      startDate,
      endDate,
      status,
      location,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const numericLeaderId = getNumericId(leaderId);

    await client.query("BEGIN");

    // 1. Insert into labour_teams
    const queryText = `
      INSERT INTO labour_teams (
        name, project_id, project_name, leader_id, trade, 
        start_date, end_date, status, location, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, project_id, project_name, leader_id, trade, 
                start_date, end_date, status, location, notes, display_id
    `;
    const teamResult = await client.query(queryText, [
      name.trim(),
      projectId || null,
      projectName || null,
      numericLeaderId,
      trade || null,
      startDate || null,
      endDate || null,
      status || "Active",
      location || null,
      notes || "",
    ]);

    const newTeamRow = teamResult.rows[0];
    const teamId = newTeamRow.id;

    // 2. Insert members into team_members junction table
    if (memberIds && Array.isArray(memberIds)) {
      for (const memberDisplayId of memberIds) {
        const numericWorkerId = getNumericId(memberDisplayId);
        if (numericWorkerId) {
          await client.query(`
            INSERT INTO team_members (team_id, worker_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [teamId, numericWorkerId]);
        }
      }
    }

    await client.query("COMMIT");

    // Format new team payload
    const formattedTeam = {
      id: newTeamRow.display_id,
      name: newTeamRow.name,
      projectId: newTeamRow.project_id,
      projectName: newTeamRow.project_name,
      leaderId: leaderId || null,
      memberIds: memberIds || [],
      trade: newTeamRow.trade,
      startDate: formatDate(newTeamRow.start_date),
      endDate: formatDate(newTeamRow.end_date),
      status: newTeamRow.status,
      location: newTeamRow.location,
      notes: newTeamRow.notes,
    };

    return NextResponse.json(formattedTeam, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/teams error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
