const test = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../config/database");
const controllerPath = require.resolve("../controllers/leadController");

test("listLeads interpola una paginación segura para Railway/MySQL", async () => {
  const originalDatabaseModule = require.cache[databasePath];
  const calls = [];
  const pool = {
    async execute(sql, params) {
      calls.push({ sql, params });
      return [[{ id: calls.length }]];
    },
  };

  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: pool,
  };
  delete require.cache[controllerPath];

  try {
    const { listLeads } = require(controllerPath);
    const cases = [
      {
        query: { status: "new", limit: "25", offset: "10" },
        expected: /LIMIT 25\s+OFFSET 10/,
        params: { status: "new" },
      },
      {
        query: { limit: "9999", offset: "-20" },
        expected: /LIMIT 100\s+OFFSET 0/,
        params: {},
      },
      {
        query: { limit: "0 UNION SELECT password", offset: "1; DROP TABLE leads" },
        expected: /LIMIT 50\s+OFFSET 0/,
        params: {},
      },
    ];

    for (const currentCase of cases) {
      let payload;
      let nextError;
      const response = {
        json(value) {
          payload = value;
          return this;
        },
      };

      await listLeads(
        { query: currentCase.query },
        response,
        (error) => {
          nextError = error;
        }
      );

      assert.equal(nextError, undefined);
      assert.deepEqual(payload, {
        leads: [{ id: calls.length }],
      });

      const lastCall = calls.at(-1);
      assert.match(lastCall.sql, currentCase.expected);
      assert.doesNotMatch(lastCall.sql, /LIMIT\s+:/);
      assert.doesNotMatch(lastCall.sql, /OFFSET\s+:/);
      assert.doesNotMatch(lastCall.sql, /UNION|DROP TABLE/i);
      assert.deepEqual(lastCall.params, currentCase.params);
    }
  } finally {
    delete require.cache[controllerPath];
    if (originalDatabaseModule) {
      require.cache[databasePath] = originalDatabaseModule;
    } else {
      delete require.cache[databasePath];
    }
  }
});
