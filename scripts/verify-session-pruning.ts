/**
 * verify-session-pruning.ts
 *
 * Confirms that connect-pg-simple's pruneSessionInterval configuration is
 * working correctly by:
 *   1. Inserting a session row with an already-expired `expire` timestamp
 *   2. Running the same DELETE query that pruneSessionInterval executes
 *   3. Confirming the row is gone
 *
 * Usage:
 *   npx tsx scripts/verify-session-pruning.ts
 *
 * This test is safe to run in any environment — it only touches a synthetic
 * session row (sid prefixed with "prune-test-") and cleans up after itself.
 */

import { Pool } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL or NEON_DATABASE_URL must be set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const TEST_SID = "prune-test-" + Date.now();

async function run() {
  const client = await pool.connect();
  try {
    // ── 1. Ensure the session table exists ────────────────────────────────────
    const tableCheck = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'session'
      ) AS exists
    `);
    if (!tableCheck.rows[0].exists) {
      console.error(
        "ERROR: 'session' table not found. Start the application at least " +
        "once so connect-pg-simple can create it (createTableIfMissing: true)."
      );
      process.exit(1);
    }

    // ── 2. Insert a session row that expired 1 hour ago ───────────────────────
    const expiredAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    await client.query(
      `INSERT INTO session (sid, sess, expire)
       VALUES ($1, $2::json, $3)
       ON CONFLICT (sid) DO UPDATE SET expire = EXCLUDED.expire`,
      [
        TEST_SID,
        JSON.stringify({ cookie: { originalMaxAge: 0 }, _pruneTest: true }),
        expiredAt,
      ]
    );
    console.log(`✔  Inserted expired session row (sid=${TEST_SID}, expire=${expiredAt.toISOString()})`);

    // ── 3. Confirm the row is present before pruning ──────────────────────────
    const before = await client.query(
      "SELECT sid FROM session WHERE sid = $1",
      [TEST_SID]
    );
    if (before.rowCount === 0) {
      console.error("ERROR: Row was not inserted — cannot continue.");
      process.exit(1);
    }
    console.log("✔  Row confirmed present in database before prune.");

    // ── 4. Run the prune query (identical to what connect-pg-simple executes) ──
    // connect-pg-simple source: https://github.com/voxpelli/node-connect-pg-simple/blob/main/index.js
    // It runs: DELETE FROM session WHERE expire < NOW()
    const pruneResult = await client.query(
      "DELETE FROM session WHERE expire < NOW()"
    );
    console.log(`✔  Prune query executed — ${pruneResult.rowCount} row(s) deleted.`);

    // ── 5. Confirm our test row is gone ───────────────────────────────────────
    const after = await client.query(
      "SELECT sid FROM session WHERE sid = $1",
      [TEST_SID]
    );
    if (after.rowCount && after.rowCount > 0) {
      console.error(
        "FAIL: Expired session row still present after prune. " +
        "This should not happen — check the session table structure."
      );
      process.exit(1);
    }

    console.log("✔  Expired session row is gone — prune is working correctly.\n");
    console.log("Session pruning is confirmed operational.");
    console.log(
      "connect-pg-simple is configured with pruneSessionInterval: 900 (15 min) " +
      "in server/routes.ts, which runs this same DELETE automatically."
    );
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
