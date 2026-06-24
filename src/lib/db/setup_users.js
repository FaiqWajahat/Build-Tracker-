const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Manually parse .env
const envPath = './.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/);
    if (match) {
      process.env.DATABASE_URL = match[1];
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const defaultUsers = [
  { name: "Ahmed Malik", email: "ahmed.malik@7d.sa", role: "User", active_site: "Tower Block A, Villa Complex B", status: "Active" },
  { name: "Sara Khan", email: "sara.khan@7d.sa", role: "User", active_site: "Villa Complex B, Office Tower E", status: "Active" },
  { name: "Hassan Usman", email: "hassan.u@7d.sa", role: "User", active_site: "Tower Block A", status: "Active" },
  { name: "Omar Tareq", email: "omar.t@7d.sa", role: "User", active_site: "Warehouse D", status: "Active" },
  { name: "Faisal Ghamdi", email: "faisal.g@7d.sa", role: "User", active_site: "All Sites", status: "Active" },
  { name: "Khalid Al-Ahmadi", email: "khalid@7d.sa", role: "Admin", active_site: "All Portfolios", status: "Active" },
  { name: "Yasir Arafat", email: "yasir.a@7d.sa", role: "User", active_site: "Standby", status: "Suspended" },
];

async function run() {
  try {
    console.log("Altering table to add password column...");
    await pool.query(`
      ALTER TABLE erp_users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);

    console.log("Clearing existing users and restarting identity...");
    await pool.query(`
      TRUNCATE TABLE erp_users RESTART IDENTITY CASCADE;
    `);

    console.log("Seeding default users with hashed passwords...");
    const hashedPassword = bcrypt.hashSync("password123", 10);

    for (const u of defaultUsers) {
      await pool.query(`
        INSERT INTO erp_users (name, email, role, active_site, status, password, last_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [u.name, u.email, u.role, u.active_site, u.status, hashedPassword, "Never"]);
      console.log(`Seeded user: ${u.name} (${u.role})`);
    }

    console.log("Database setup and seeding completed successfully.");
  } catch (err) {
    console.error("ERROR running setup:", err);
  } finally {
    await pool.end();
  }
}

run();
