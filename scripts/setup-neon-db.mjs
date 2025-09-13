import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// ✅ Replacements for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup script for Neon PostgreSQL
export async function setupNeonDatabase(sqlFileName = "create-chat-messages-table.sql") {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("🔄 Connecting to Neon database...");

    // Test connection
    const client = await pool.connect();
    console.log("✅ Connected to Neon database successfully");
    client.release();

    // Read and execute SQL file
    console.log(`🔄 Executing SQL script: ${sqlFileName}...`);
    const sqlFilePath = path.join(__dirname, sqlFileName);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    await pool.query(sqlContent);
    console.log(`✅ SQL script executed successfully: ${sqlFileName}`);

    // // Read and execute verification tokens table
    // console.log("🔄 Adding verification tokens table...");
    // const verificationSQL = fs.readFileSync(
    //   path.join(__dirname, "add-verification-tokens-table.sql"),
    //   "utf8"
    // );
    // await pool.query(verificationSQL);
    // console.log("✅ Verification tokens table added successfully");

    // // Read and execute demo data seeding
    // console.log("🔄 Seeding demo data...");
    // const seedSQL = fs.readFileSync(
    //   path.join(__dirname, "seed-demo-data.sql"),
    //   "utf8"
    // );
    // await pool.query(seedSQL);
    // console.log("✅ Demo data seeded successfully");

    // // Verify setup by checking table counts
    // console.log("🔄 Verifying database setup...");
    // const tables = [
    //   "users",
    //   "goals",
    //   "milestones",
    //   "check_ins",
    //   "chat_sessions",
    //   "chat_messages",
    //   "progress_tracking",
    //   "progress_metrics",
    //   "user_activities",
    // ];

    // for (const table of tables) {
    //   const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
    //   console.log(`📊 ${table}: ${result.rows[0].count} records`);
    // }

    console.log("🎉 Neon database setup completed successfully!");
    console.log("");
    // console.log("Demo account credentials:");
    // console.log("Email: demo@aiTutor.com");
    // console.log("Password: demo123");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// ✅ Run the setup only if executed directly
if (process.argv[1] === __filename) {
  // Get SQL file name from command line arguments
  const sqlFileName = process.argv[2] || "create-chat-messages-table.sql";
  setupNeonDatabase(sqlFileName);
}
