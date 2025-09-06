// db.js
// ✅ Disable strict SSL verification (required for Supabase, Render, etc.)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// ✅ Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing! Please set it in your .env file.");
  process.exit(1);
}

console.log("🚀 Starting server...");
console.log("🔗 Using database:", process.env.DATABASE_URL.split("@")[1]); // hides password

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false },
});

// ✅ Test the connection once at startup
(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database connected successfully at:", result.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1); // Stop app if DB is not reachable
  }
})();
