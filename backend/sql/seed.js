const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const pool = require("../config/database");

function stripSqlComments(sqlContent) {
  return sqlContent
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

async function runStatements(sqlContent) {
  const statements = stripSqlComments(sqlContent)
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function seed() {
  try {
    console.log("Iniciando sembrado de datos...");
    const sqlPath = path.join(__dirname, "seed.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    await runStatements(sqlContent);

    console.log("Sembrado completado con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("Error durante el sembrado de datos:", error.message);
    process.exit(1);
  }
}

seed();
