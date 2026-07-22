const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const pool = require("../config/database");

function stripSqlComments(sqlContent) {
  return sqlContent
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function splitStatements(sqlContent) {
  return stripSqlComments(sqlContent)
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function runSqlFile(fileName) {
  const sql = fs.readFileSync(path.join(__dirname, fileName), "utf8");

  for (const statement of splitStatements(sql)) {
    await pool.query(statement);
  }
}

function assertIdentifier(value) {
  if (!/^[a-z0-9_]+$/i.test(value)) {
    throw new Error(`Identificador SQL inválido: ${value}`);
  }
  return value;
}

async function tableExists(tableName) {
  const table = assertIdentifier(tableName);
  const [rows] = await pool.query("SHOW TABLES LIKE ?", [table]);
  return rows.length > 0;
}

async function ensureColumn(tableName, columnName, definition) {
  const table = assertIdentifier(tableName);
  const column = assertIdentifier(columnName);

  if (!(await tableExists(table))) return;

  const [rows] = await pool.query(
    `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
    [column]
  );

  if (!rows.length) {
    await pool.query(
      `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`
    );
    console.log(`Columna añadida: ${table}.${column}`);
  }
}

async function ensureLegacyColumns() {
  const columns = [
    ["users", "active", "BOOLEAN NOT NULL DEFAULT TRUE"],
    ["vehicles", "model_id", "INT NULL AFTER `model`"],
    ["leads", "last_name", "VARCHAR(100) NULL AFTER `first_name`"],
    ["leads", "phone", "VARCHAR(40) NULL AFTER `email`"],
    ["leads", "message", "TEXT NULL AFTER `phone`"],
    ["leads", "vehicle_id", "INT NULL AFTER `message`"],
    ["leads", "source", "VARCHAR(80) NOT NULL DEFAULT 'web' AFTER `vehicle_id`"],
    ["leads", "status", "ENUM('new','contacted','qualified','closed','lost') NOT NULL DEFAULT 'new' AFTER `source`"],
    ["leads", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
    ["leads", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
    ["financing_quotes", "phone", "VARCHAR(40) NULL AFTER `email`"],
    ["financing_quotes", "vehicle_id", "INT NULL AFTER `phone`"],
    ["financing_quotes", "down_payment", "DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `vehicle_price`"],
    ["financing_quotes", "annual_interest_rate", "DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER `months`"],
    ["financing_quotes", "monthly_payment", "DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `annual_interest_rate`"],
    ["financing_quotes", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
  ];

  for (const [table, column, definition] of columns) {
    await ensureColumn(table, column, definition);
  }
}

async function migrate() {
  try {
    console.log("Verificando estructura de la base de datos...");

    await runSqlFile("migrate-runtime.sql");
    await ensureLegacyColumns();
    await runSqlFile("migrate-catalog.sql");

    console.log("Migraciones completadas correctamente.");
  } catch (error) {
    console.error("Error durante la migración:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = {
  migrate,
  splitStatements,
  stripSqlComments,
};
