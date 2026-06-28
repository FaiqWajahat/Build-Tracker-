import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Helper: shape invoice row + line items
// ---------------------------------------------------------------------------
function formatInvoice(invoice, lineItems = []) {
  const subtotal = lineItems.reduce((s, li) => s + Number(li.current_amount || 0), 0);
  const retentionRate = Number(invoice.retention_rate ?? 0.05);
  const vatRate = Number(invoice.vat_rate ?? 0.15);
  const retention = subtotal * retentionRate;
  const netAfterRetention = subtotal - retention;
  const vat = netAfterRetention * vatRate;
  const grandTotal = netAfterRetention + vat;

  return {
    id: invoice.display_id,
    projectId: invoice.project_display_id,
    projectName: invoice.project_name,
    clientName: invoice.client_name,
    location: invoice.project_location,
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    invoiceType: invoice.invoice_type,
    status: invoice.status,
    retentionRate,
    vatRate,
    notes: invoice.notes,
    companyName: invoice.company_name,
    companyReg: invoice.company_reg,
    companyAddress: invoice.company_address,
    periodFrom: invoice.period_from,
    periodTo: invoice.period_to,
    lineItems: lineItems.map((li) => ({
      id: li.id,
      assignmentId: li.assignment_id,
      assignmentDisplayId: li.assignment_display_id,
      description: li.description,
      unitLabel: li.unit_label,
      prevQty: Number(li.prev_qty || 0),
      currentQty: Number(li.current_qty || 0),
      totalQty: Number(li.total_qty || 0),
      rate: Number(li.rate || 0),
      prevAmount: Number(li.prev_amount || 0),
      currentAmount: Number(li.current_amount || 0),
      totalAmount: Number(li.total_amount || 0),
    })),
    summary: {
      subtotal,
      retentionRate,
      retention,
      netAfterRetention,
      vatRate,
      vat,
      grandTotal,
    },
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
  };
}

// ---------------------------------------------------------------------------
// GET /api/invoices/[id] — fetch single invoice + full progress breakdown
// ---------------------------------------------------------------------------
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const invRes = await pool.query(
      `SELECT * FROM invoices WHERE display_id = $1`,
      [id]
    );
    if (invRes.rowCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    const invoice = invRes.rows[0];

    // Line items
    const liRes = await pool.query(
      `SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id ASC`,
      [invoice.id]
    );

    // ── Page 2 data: full progress breakdown for the project ────────────────
    let progressData = [];
    if (invoice.project_id) {
      // Fetch all assignments for the project
      const asnRes = await pool.query(
        `SELECT sa.*, p.display_id AS project_display_id
         FROM scope_assignments sa
         JOIN projects p ON sa.project_id = p.id
         WHERE sa.project_id = $1
         ORDER BY sa.created_at ASC`,
        [invoice.project_id]
      );
      const assignments = asnRes.rows;
      const assignmentIds = assignments.map((a) => a.id);

      let phaseBreaks = [], unitBreaks = [], logs = [];
      if (assignmentIds.length > 0) {
        const [pbRes, ubRes, logsRes] = await Promise.all([
          pool.query(
            `SELECT apb.*, pp.name AS phase_name
             FROM assignment_phase_breakdown apb
             LEFT JOIN project_phases pp ON pp.display_id = apb.phase_display_id AND pp.project_id = $2
             WHERE apb.assignment_id = ANY($1)`,
            [assignmentIds, invoice.project_id]
          ),
          pool.query(
            `SELECT aub.*, pu.name AS unit_name
             FROM assignment_unit_breakdown aub
             LEFT JOIN project_units pu ON pu.display_id = aub.unit_display_id AND pu.project_id = $2
             WHERE aub.assignment_id = ANY($1)`,
            [assignmentIds, invoice.project_id]
          ),
          pool.query(
            `SELECT pl.*, sa.display_id AS assignment_display_id
             FROM progress_logs pl
             JOIN scope_assignments sa ON pl.assignment_id = sa.id
             WHERE pl.project_id = $1
             ORDER BY pl.date DESC`,
            [invoice.project_id]
          ),
        ]);
        phaseBreaks = pbRes.rows;
        unitBreaks = ubRes.rows;
        logs = logsRes.rows;
      }

      progressData = assignments.map((a) => {
        const aPhaseBreaks = phaseBreaks.filter((pb) => pb.assignment_id === a.id);
        const aUnitBreaks = unitBreaks.filter((ub) => ub.assignment_id === a.id);
        const aLogs = logs.filter((l) => l.assignment_id === a.id);

        let totalQty = 0, doneQty = 0;
        if (a.level === "unit") {
          totalQty = aUnitBreaks.reduce((s, u) => s + Number(u.qty || 0), 0);
          doneQty = aUnitBreaks.reduce((s, u) => s + Number(u.done || 0), 0);
        } else if (a.level === "phase") {
          totalQty = aPhaseBreaks.reduce((s, p) => s + Number(p.qty || 0), 0);
          doneQty = aPhaseBreaks.reduce((s, p) => s + Number(p.done || 0), 0);
        } else {
          totalQty = Number(a.total_qty || 0);
          doneQty = aLogs.reduce((s, l) => s + Number(l.qty_completed || 0), 0);
        }

        const pct = totalQty > 0 ? Math.min(100, Math.round((doneQty / totalQty) * 100)) : 0;

        return {
          assignmentId: a.display_id,
          scopeName: a.scope_name,
          trade: a.trade,
          uom: a.uom,
          level: a.level,
          assigneeName: a.assignee_name,
          clientRate: Number(a.client_rate || 0),
          totalQty,
          doneQty,
          remainingQty: Math.max(0, totalQty - doneQty),
          pct,
          earnedValue: doneQty * Number(a.client_rate || 0),
          contractValue: totalQty * Number(a.client_rate || 0),
          unitBreakdown: aUnitBreaks.map((u) => ({
            unitId: u.unit_display_id,
            unitName: u.unit_name || u.unit_display_id,
            qty: Number(u.qty || 0),
            done: Number(u.done || 0),
            remaining: Math.max(0, Number(u.qty || 0) - Number(u.done || 0)),
            pct: Number(u.qty || 0) > 0
              ? Math.min(100, Math.round((Number(u.done || 0) / Number(u.qty || 0)) * 100))
              : 0,
          })),
          phaseBreakdown: aPhaseBreaks.map((p) => ({
            phaseId: p.phase_display_id,
            phaseName: p.phase_name || p.phase_display_id,
            qty: Number(p.qty || 0),
            done: Number(p.done || 0),
            remaining: Math.max(0, Number(p.qty || 0) - Number(p.done || 0)),
            pct: Number(p.qty || 0) > 0
              ? Math.min(100, Math.round((Number(p.done || 0) / Number(p.qty || 0)) * 100))
              : 0,
          })),
          recentLogs: aLogs.slice(0, 5).map((l) => ({
            date: l.date,
            qty: Number(l.qty_completed || 0),
            notes: l.notes,
          })),
        };
      });
    }

    const formatted = formatInvoice(invoice, liRes.rows);
    formatted.progressData = progressData;
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/invoices/[id] — update invoice fields + line items
// ---------------------------------------------------------------------------
export async function PUT(request, { params }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const dbClient = await pool.connect();
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      invoiceDate,
      dueDate,
      invoiceType,
      status,
      retentionRate,
      vatRate,
      notes,
      companyName,
      companyReg,
      companyAddress,
      periodFrom,
      periodTo,
      lineItems,
    } = body;

    await dbClient.query("BEGIN");

    const invRes = await dbClient.query(
      `UPDATE invoices SET
        invoice_date    = COALESCE($1, invoice_date),
        due_date        = COALESCE($2, due_date),
        invoice_type    = COALESCE($3, invoice_type),
        status          = COALESCE($4, status),
        retention_rate  = COALESCE($5, retention_rate),
        vat_rate        = COALESCE($6, vat_rate),
        notes           = COALESCE($7, notes),
        company_name    = COALESCE($8, company_name),
        company_reg     = COALESCE($9, company_reg),
        company_address = COALESCE($10, company_address),
        period_from     = COALESCE($11, period_from),
        period_to       = COALESCE($12, period_to),
        updated_at      = NOW()
      WHERE display_id = $13
      RETURNING *`,
      [
        invoiceDate ?? null,
        dueDate ?? null,
        invoiceType ?? null,
        status ?? null,
        retentionRate !== undefined ? Number(retentionRate) : null,
        vatRate !== undefined ? Number(vatRate) : null,
        notes ?? null,
        companyName ?? null,
        companyReg ?? null,
        companyAddress ?? null,
        periodFrom ?? null,
        periodTo ?? null,
        id,
      ]
    );

    if (invRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    const invoice = invRes.rows[0];

    // Update line items if provided
    if (Array.isArray(lineItems)) {
      // Delete existing and re-insert
      await dbClient.query(
        `DELETE FROM invoice_line_items WHERE invoice_id = $1`,
        [invoice.id]
      );
      for (const li of lineItems) {
        await dbClient.query(
          `INSERT INTO invoice_line_items (
            invoice_id, assignment_id, assignment_display_id, description,
            unit_label, prev_qty, current_qty, total_qty, rate,
            prev_amount, current_amount, total_amount
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            invoice.id,
            li.assignmentId || null,
            li.assignmentDisplayId || null,
            li.description,
            li.unitLabel || "No.",
            li.prevQty || 0,
            li.currentQty || 0,
            li.totalQty || 0,
            li.rate || 0,
            li.prevAmount || 0,
            li.currentAmount || 0,
            li.totalAmount || 0,
          ]
        );
      }
    }

    await dbClient.query("COMMIT");

    const liRes = await pool.query(
      `SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id ASC`,
      [invoice.id]
    );
    return NextResponse.json(formatInvoice(invoice, liRes.rows));
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("PUT /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/invoices/[id] — delete invoice
// ---------------------------------------------------------------------------
export async function DELETE(request, { params }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const result = await pool.query(
      `DELETE FROM invoices WHERE display_id = $1 RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
