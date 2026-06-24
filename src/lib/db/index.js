import { Pool, types } from "pg";

// Parse DATE (OID 1082) as a raw string to prevent timezone/DST shifting
types.setTypeParser(1082, (val) => val);

let pool;

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  // Prevent creating multiple pools during development hot reloading
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  pool = global._postgresPool;
}

export default pool;
