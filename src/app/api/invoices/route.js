import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Helper: shape invoice row + line items into frontend object
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
      assignmentId: li.assignment_display_id,
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

let tablesChecked = false;

// ---------------------------------------------------------------------------
// Ensure invoices table exists
// ---------------------------------------------------------------------------
async function ensureInvoiceTablesExist() {
  if (tablesChecked) return;
  
  // First ensure standard basic structure exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id            SERIAL PRIMARY KEY,
      display_id    TEXT UNIQUE NOT NULL,
      project_id    INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      invoice_number INTEGER NOT NULL,
      invoice_date  DATE NOT NULL DEFAULT CURRENT_DATE,
      due_date      DATE,
      invoice_type  TEXT DEFAULT 'progress',
      status        TEXT DEFAULT 'draft',
      retention_rate NUMERIC(5,4) DEFAULT 0.05,
      vat_rate       NUMERIC(5,4) DEFAULT 0.15,
      notes          TEXT,
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      updated_at     TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id             SERIAL PRIMARY KEY,
      invoice_id     INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
      assignment_id  INTEGER REFERENCES scope_assignments(id),
      description    TEXT NOT NULL,
      unit_label     TEXT,
      prev_qty       NUMERIC DEFAULT 0,
      current_qty    NUMERIC DEFAULT 0,
      total_qty      NUMERIC DEFAULT 0,
      rate           NUMERIC DEFAULT 0,
      prev_amount    NUMERIC DEFAULT 0,
      current_amount NUMERIC DEFAULT 0,
      total_amount   NUMERIC DEFAULT 0
    );
  `);

  // Dynamically add extended fields to 'invoices' table if missing
  const alterInvoices = [
    { name: "project_display_id", type: "TEXT" },
    { name: "project_name", type: "TEXT" },
    { name: "client_name", type: "TEXT" },
    { name: "project_location", type: "TEXT" },
    { name: "company_name", type: "TEXT" },
    { name: "company_reg", type: "TEXT" },
    { name: "company_address", type: "TEXT" },
    { name: "period_from", type: "DATE" },
    { name: "period_to", type: "DATE" }
  ];

  for (const col of alterInvoices) {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='invoices' AND column_name='${col.name}'
        ) THEN
          ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type};
        END IF;
      END $$;
    `);
  }

  // Dynamically add extended fields to 'invoice_line_items' table if missing
  const alterLineItems = [
    { name: "assignment_display_id", type: "TEXT" }
  ];

  for (const col of alterLineItems) {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='invoice_line_items' AND column_name='${col.name}'
        ) THEN
          ALTER TABLE invoice_line_items ADD COLUMN ${col.name} ${col.type};
        END IF;
      END $$;
    `);
  }
  tablesChecked = true;
}

// ---------------------------------------------------------------------------
// GET /api/invoices — list all invoices (optional ?projectId=)
// ---------------------------------------------------------------------------
export async function GET(request) {
  try {
    await ensureInvoiceTablesExist();
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    let invoicesRes;
    let pagination = null;

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10) || 10));
      const offset = (page - 1) * limit;

      let countRes;
      if (projectId) {
        countRes = await pool.query(
          `SELECT COUNT(*) FROM invoices WHERE project_display_id = $1`,
          [projectId]
        );
        invoicesRes = await pool.query(
          `SELECT * FROM invoices WHERE project_display_id = $1 ORDER BY invoice_number DESC LIMIT $2 OFFSET $3`,
          [projectId, limit, offset]
        );
      } else {
        countRes = await pool.query(`SELECT COUNT(*) FROM invoices`);
        invoicesRes = await pool.query(
          `SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
      }

      const total = parseInt(countRes.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);
      pagination = { page, limit, total, totalPages };
    } else {
      if (projectId) {
        invoicesRes = await pool.query(
          `SELECT * FROM invoices WHERE project_display_id = $1 ORDER BY invoice_number DESC LIMIT 500`,
          [projectId]
        );
      } else {
        invoicesRes = await pool.query(
          `SELECT * FROM invoices ORDER BY created_at DESC LIMIT 500`
        );
      }
    }

    const invoiceIds = invoicesRes.rows.map((i) => i.id);
    let lineItemsRes = { rows: [] };
    if (invoiceIds.length > 0) {
      lineItemsRes = await pool.query(
        `SELECT * FROM invoice_line_items WHERE invoice_id = ANY($1) ORDER BY id ASC`,
        [invoiceIds]
      );
    }

    const lineItemsByInvoice = {};
    lineItemsRes.rows.forEach((li) => {
      if (!lineItemsByInvoice[li.invoice_id]) lineItemsByInvoice[li.invoice_id] = [];
      lineItemsByInvoice[li.invoice_id].push(li);
    });

    const formatted = invoicesRes.rows.map((inv) =>
      formatInvoice(inv, lineItemsByInvoice[inv.id] || [])
    );

    if (pagination) {
      return NextResponse.json({ data: formatted, pagination });
    }

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/invoices — create invoice (manual or generate from progress)
// ---------------------------------------------------------------------------
export async function POST(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  await ensureInvoiceTablesExist();
  const dbClient = await pool.connect();
  try {
    const body = await request.json();
    const {
      projectId,
      invoiceType = "progress",
      invoiceDate,
      dueDate,
      retentionRate = 0.05,
      vatRate = 0.15,
      notes = "",
      companyName,
      companyReg,
      companyAddress,
      periodFrom,
      periodTo,
      lineItems = [], // manual line items if provided
    } = body;

    await dbClient.query("BEGIN");

    // Lookup project
    const projectRes = await dbClient.query(
      `SELECT * FROM projects WHERE display_id = $1`,
      [projectId]
    );
    if (projectRes.rowCount === 0) {
      await dbClient.query("ROLLBACK");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectRes.rows[0];

    // Get next invoice number for this project
    const numRes = await dbClient.query(
      `SELECT COALESCE(MAX(invoice_number), 0) + 1 AS next_num FROM invoices WHERE project_id = $1`,
      [project.id]
    );
    const invoiceNumber = numRes.rows[0].next_num;

    // Generate display_id
    const countRes = await dbClient.query(`SELECT COUNT(*) FROM invoices`);
    const totalCount = parseInt(countRes.rows[0].count) + 1;
    const displayId = `INV-${String(totalCount).padStart(4, "0")}`;

    // Insert invoice
    const invRes = await dbClient.query(
      `INSERT INTO invoices (
        display_id, project_id, project_display_id, project_name, client_name,
        project_location, invoice_number, invoice_date, due_date, invoice_type,
        status, retention_rate, vat_rate, notes, company_name, company_reg,
        company_address, period_from, period_to
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        displayId, project.id, project.display_id, project.name, project.client,
        project.location, invoiceNumber, invoiceDate || new Date().toISOString().split("T")[0],
        dueDate || null, invoiceType, "draft",
        retentionRate, vatRate, notes, companyName || null, companyReg || null,
        companyAddress || null,
        periodFrom || null, periodTo || null,
      ]
    );
    const invoice = invRes.rows[0];

    // ── Auto-generate line items from assignments + progress ──────────────
    let computedLineItems = lineItems;
    if (lineItems.length === 0) {
      // Fetch assignments for this project
      const assignRes = await dbClient.query(
        `SELECT * FROM scope_assignments WHERE project_id = $1`,
        [project.id]
      );
      const assignments = assignRes.rows;

      for (const a of assignments) {
        let targetQty = 0;
        let doneQty = 0;

        if (a.level === "unit") {
          const ubRes = await dbClient.query(
            `SELECT SUM(qty) AS tq, SUM(done) AS td FROM assignment_unit_breakdown WHERE assignment_id = $1`,
            [a.id]
          );
          targetQty = Number(ubRes.rows[0]?.tq || 0);
          doneQty = Number(ubRes.rows[0]?.td || 0);
        } else if (a.level === "phase") {
          const pbRes = await dbClient.query(
            `SELECT SUM(qty) AS tq, SUM(done) AS td FROM assignment_phase_breakdown WHERE assignment_id = $1`,
            [a.id]
          );
          targetQty = Number(pbRes.rows[0]?.tq || 0);
          doneQty = Number(pbRes.rows[0]?.td || 0);
        } else {
          targetQty = Number(a.total_qty || 0);
          // Filter logs by period if provided
          let logsQuery = `SELECT SUM(qty_completed) AS td FROM progress_logs WHERE assignment_id = $1`;
          const logsParams = [a.id];
          if (periodFrom && periodTo) {
            logsQuery += ` AND date BETWEEN $2 AND $3`;
            logsParams.push(periodFrom, periodTo);
          }
          const logsRes = await dbClient.query(logsQuery, logsParams);
          doneQty = Number(logsRes.rows[0]?.td || 0);
        }

        // Get previous progress (before period)
        let prevQty = 0;
        if (periodFrom) {
          if (a.level === "project") {
            const prevRes = await dbClient.query(
              `SELECT SUM(qty_completed) AS prev FROM progress_logs WHERE assignment_id = $1 AND date < $2`,
              [a.id, periodFrom]
            );
            prevQty = Number(prevRes.rows[0]?.prev || 0);
          }
        }

        const rate = Number(a.client_rate || 0);
        const currentQty = doneQty - prevQty;
        const prevAmount = prevQty * rate;
        const currentAmount = currentQty * rate;
        const totalAmount = doneQty * rate;

        computedLineItems.push({
          assignmentId: a.id,
          assignmentDisplayId: a.display_id,
          description: a.scope_name || "Scope Work",
          unitLabel: a.uom || "No.",
          prevQty,
          currentQty,
          totalQty: targetQty,
          rate,
          prevAmount,
          currentAmount,
          totalAmount,
        });
      }
    }

    // Insert line items
    for (const li of computedLineItems) {
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

    await dbClient.query("COMMIT");

    // Fetch back the line items for response
    const liRes = await dbClient.query(
      `SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id ASC`,
      [invoice.id]
    );

    return NextResponse.json(formatInvoice(invoice, liRes.rows), { status: 201 });
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    dbClient.release();
  }
}
