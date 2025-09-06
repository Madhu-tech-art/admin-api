import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

console.log("🚀 Starting server...");
console.log("🔗 Using database:", process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // Important for Supabase
  },
});

// Test the connection
(async () => {
  try {
    console.log("⏳ Checking database connection...");
    const client = await pool.connect();
    console.log("✅ Database connected successfully!");
    const res = await client.query("SELECT NOW()");
    console.log("📅 Current DB time:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
  }
})();
