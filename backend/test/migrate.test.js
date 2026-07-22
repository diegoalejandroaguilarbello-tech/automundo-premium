const test = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../config/database");
const migrationPath = require.resolve("../sql/migrate");

test("la migración prepara vehículos antes de migrar el catálogo", async () => {
  const originalDatabaseModule = require.cache[databasePath];
  const statements = [];
  let connectionClosed = false;
  const pool = {
    async query(sql) {
      statements.push(sql);

      if (/^SHOW TABLES LIKE/i.test(sql)) {
        return [[{ table: true }]];
      }

      if (/^SHOW COLUMNS FROM/i.test(sql)) {
        return [[{ Field: "existing" }]];
      }

      return [[]];
    },
    async end() {
      connectionClosed = true;
    },
  };

  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: pool,
  };
  delete require.cache[migrationPath];

  try {
    const { migrate } = require(migrationPath);
    await migrate();

    const createVehiclesIndex = statements.findIndex((sql) =>
      /CREATE TABLE IF NOT EXISTS vehicles/i.test(sql)
    );
    const catalogInsertIndex = statements.findIndex((sql) =>
      /INSERT INTO brands[\s\S]*SELECT DISTINCT brand/i.test(sql)
    );

    assert.notEqual(createVehiclesIndex, -1);
    assert.notEqual(catalogInsertIndex, -1);
    assert.ok(createVehiclesIndex < catalogInsertIndex);
    assert.equal(connectionClosed, true);
  } finally {
    delete require.cache[migrationPath];
    if (originalDatabaseModule) {
      require.cache[databasePath] = originalDatabaseModule;
    } else {
      delete require.cache[databasePath];
    }
  }
});
