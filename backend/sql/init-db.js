const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function decode(value = "") {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

function parseMysqlUrl(mysqlUrl) {
  const url = new URL(mysqlUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decode(url.username),
    password: decode(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

function getBaseConfig() {
  if (process.env.MYSQL_URL) {
    return parseMysqlUrl(process.env.MYSQL_URL);
  }

  return {
    host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || "root",
    password: process.env.MYSQLPASSWORD ?? process.env.DB_PASSWORD ?? "",
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || "automundo",
  };
}

function stripSqlComments(sqlContent) {
  return sqlContent
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

async function runStatements(connection, sqlContent) {
  const statements = stripSqlComments(sqlContent)
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await connection.query(statement);
  }
}

async function initDb() {
  const config = getBaseConfig();
  let connection;

  try {
    console.log(`Inicializando base de datos: ${config.database}`);

    const usesRailwayDatabase = Boolean(process.env.MYSQLDATABASE || process.env.MYSQL_URL);

    if (usesRailwayDatabase) {
      connection = await mysql.createConnection({ ...config, multipleStatements: false });
    } else {
      const { database, ...serverConfig } = config;
      connection = await mysql.createConnection({ ...serverConfig, multipleStatements: false });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await connection.changeUser({ database });
    }

    const initSqlPath = path.join(__dirname, "..", "..", "database", "init.sql");
    const sqlContent = fs.readFileSync(initSqlPath, "utf-8");
    await runStatements(connection, sqlContent);

    console.log("Base de datos inicializada correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDb();
