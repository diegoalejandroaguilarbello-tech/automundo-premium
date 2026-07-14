const mysql = require("mysql2/promise");

function valueFromUrl(value = "") {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

function configFromMysqlUrl(mysqlUrl) {
  const url = new URL(mysqlUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: valueFromUrl(url.username),
    password: valueFromUrl(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

function getDatabaseConfig() {
  const railwayMysqlUrl = process.env.MYSQL_URL;

  const baseConfig = railwayMysqlUrl
    ? configFromMysqlUrl(railwayMysqlUrl)
    : {
        host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
        port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
        user: process.env.MYSQLUSER || process.env.DB_USER || "root",
        password: process.env.MYSQLPASSWORD ?? process.env.DB_PASSWORD ?? "",
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || "automundo",
      };

  return {
    ...baseConfig,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    namedPlaceholders: true,
  };
}

const pool = mysql.createPool(getDatabaseConfig());

module.exports = pool;
module.exports.getDatabaseConfig = getDatabaseConfig;
