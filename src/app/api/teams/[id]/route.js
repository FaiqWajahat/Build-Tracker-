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

// PUT: Update an existing team
export async function PUT(request, { params }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Access Denied: Admin privileges required" },
      { status: 403 }
    );
  }

  const client = await pool.connect();
  try {
    const resolvedParams = await params;
    const { id: idParam } = resolvedParams;
    const numericTeamId = getNumericId(idParam);

    if (!numericTeamId) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      projectId,
      projectName,
      leaderId, // display_id
      memberIds, // array of display_ids
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

    // 1. Update labour_teams
    const queryText = `
      UPDATE labour_teams
      SET name = $1, project_id = $2, project_name = $3, leader_id = $4, 
          trade = $5, start_date = $6, end_date = $7, status = $8, 
          location = $9, notes = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
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
      numericTeamId,
    ]);

    if (teamResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const updatedTeamRow = teamResult.rows[0];

    // 2. Sync members: Delete old ones and insert new ones
    await client.query(`
      DELETE FROM team_members
      WHERE team_id = $1
    `, [numericTeamId]);

    if (memberIds && Array.isArray(memberIds)) {
      for (const memberDisplayId of memberIds) {
        const numericWorkerId = getNumericId(memberDisplayId);
        if (numericWorkerId) {
          await client.query(`
            INSERT INTO team_members (team_id, worker_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [numericTeamId, numericWorkerId]);
        }
      }
    }

    await client.query("COMMIT");

    const formattedTeam = {
      id: updatedTeamRow.display_id,
      name: updatedTeamRow.name,
      projectId: updatedTeamRow.project_id,
      projectName: updatedTeamRow.project_name,
      leaderId: leaderId || null,
      memberIds: memberIds || [],
      trade: updatedTeamRow.trade,
      startDate: formatDate(updatedTeamRow.start_date),
      endDate: formatDate(updatedTeamRow.end_date),
      status: updatedTeamRow.status,
      location: updatedTeamRow.location,
      notes: updatedTeamRow.notes,
    };

    return NextResponse.json(formattedTeam);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PUT /api/teams/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE: Delete a team
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
    const numericTeamId = getNumericId(idParam);

    if (!numericTeamId) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    // CASCADE delete in team_members is handled in SQL
    const queryText = `
      DELETE FROM labour_teams
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(queryText, [numericTeamId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/teams/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
