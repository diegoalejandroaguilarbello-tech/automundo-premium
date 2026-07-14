const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const pool = require("../config/database");

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, "migrate-catalog.sql"), "utf8");
    const statements = sql.split(/;\s*(?:\r?\n|$)/)
      .map((part) => part.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
    for (const statement of statements) await pool.query(statement);
    console.log("Migración de catálogo completada.");
    process.exit(0);
  } catch (error) {
    console.error("Error durante la migración:", error.message);
    process.exit(1);
  }
}

migrate();
