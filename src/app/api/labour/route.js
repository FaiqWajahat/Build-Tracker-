import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Helper to format date objects safely to YYYY-MM-DD (timezone-safe)
const formatDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") {
    return dateVal.split("T")[0];
  }
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// GET: Retrieve all labour data (workers, teams, attendance, advances) in one call
export async function GET() {
  try {
    // 1. Fetch Workers
    const workersResult = await pool.query(`
      SELECT id, name, iqama_number, nationality, trade, pay_type, rate, 
             phone, emergency_contact, join_date, status, photo, notes, 
             blood_group, iqama_expiry, display_id 
      FROM workers 
      ORDER BY id ASC
    `);

    // 2. Fetch Teams and join leader display_id
    const teamsResult = await pool.query(`
      SELECT t.id, t.name, t.project_id, t.project_name, t.trade, 
             t.start_date, t.end_date, t.status, t.location, t.notes, 
             t.display_id, w.display_id as leader_display_id
      FROM labour_teams t
      LEFT JOIN workers w ON t.leader_id = w.id
      ORDER BY t.id ASC
    `);

    // 3. Fetch Team Members mapping
    const membersResult = await pool.query(`
      SELECT tm.team_id, lt.display_id as team_display_id, w.display_id as worker_display_id
      FROM team_members tm
      JOIN labour_teams lt ON tm.team_id = lt.id
      JOIN workers w ON tm.worker_id = w.id
    `);

    // 4. Fetch Attendance and join worker display_id
    const attendanceResult = await pool.query(`
      SELECT a.id, a.date, a.project_id, a.status, a.shift, 
             a.clock_in, a.clock_out, a.break_minutes, a.hours_worked, 
             a.overtime, a.location, a.notes, a.display_id, w.display_id as worker_display_id
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.date >= CURRENT_DATE - INTERVAL '15 days'
      ORDER BY a.date DESC, a.id DESC
    `);

    // 5. Fetch Advances and join worker display_id
    const advancesResult = await pool.query(`
      SELECT adv.id, adv.type, adv.amount, adv.date, adv.description, 
             adv.status, adv.display_id, w.display_id as worker_display_id
      FROM advances adv
      JOIN workers w ON adv.worker_id = w.id
      WHERE adv.date >= CURRENT_DATE - INTERVAL '15 days'
      ORDER BY adv.date DESC, adv.id DESC
    `);

    // ─── Format Data for Frontend ───

    // Format workers
    const workers = workersResult.rows.map((row) => ({
      id: row.display_id,
      name: row.name,
      iqamaNumber: row.iqama_number,
      nationality: row.nationality,
      trade: row.trade,
      payType: row.pay_type,
      rate: Number(row.rate),
      phone: row.phone,
      emergencyContact: row.emergency_contact,
      joinDate: formatDate(row.join_date),
      status: row.status,
      photo: row.photo,
      notes: row.notes,
      bloodGroup: row.blood_group,
      iqamaExpiry: formatDate(row.iqama_expiry),
    }));

    // Group team members
    const teamMembersMap = {};
    membersResult.rows.forEach((row) => {
      if (!teamMembersMap[row.team_display_id]) {
        teamMembersMap[row.team_display_id] = [];
      }
      teamMembersMap[row.team_display_id].push(row.worker_display_id);
    });

    // Format teams
    const teams = teamsResult.rows.map((row) => ({
      id: row.display_id,
      name: row.name,
      projectId: row.project_id,
      projectName: row.project_name,
      leaderId: row.leader_display_id,
      leaderName: workers.find((w) => w.id === row.leader_display_id)?.name || "",
      memberIds: teamMembersMap[row.display_id] || [],
      trade: row.trade,
      startDate: formatDate(row.start_date),
      endDate: formatDate(row.end_date),
      status: row.status,
      location: row.location,
      notes: row.notes,
    }));

    // Format attendance
    const attendance = attendanceResult.rows.map((row) => ({
      id: row.display_id,
      workerId: row.worker_display_id,
      date: formatDate(row.date),
      projectId: row.project_id,
      status: row.status,
      shift: row.shift,
      clockIn: row.clock_in ? row.clock_in.substring(0, 5) : null, // format "HH:MM:SS" -> "HH:MM"
      clockOut: row.clock_out ? row.clock_out.substring(0, 5) : null,
      breakMinutes: Number(row.break_minutes) || 0,
      hoursWorked: Number(row.hours_worked) || 0,
      overtime: Number(row.overtime) || 0,
      location: row.location || "",
      notes: row.notes || "",
    }));

    // Format advances
    const advances = advancesResult.rows.map((row) => ({
      id: row.display_id,
      workerId: row.worker_display_id,
      type: row.type,
      amount: Number(row.amount),
      date: formatDate(row.date),
      description: row.description || "",
      status: row.status,
    }));

    return NextResponse.json({
      workers,
      teams,
      attendance,
      advances,
    });
  } catch (error) {
    console.error("GET /api/labour error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
