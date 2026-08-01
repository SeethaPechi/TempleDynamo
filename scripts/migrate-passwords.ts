/**
 * migrate-passwords.ts
 *
 * One-time (idempotent) script that upgrades every remaining base64-encoded
 * password in the `users` table to a bcrypt hash (cost 12).
 *
 * A password is considered "already migrated" when it starts with "$2b$" or
 * "$2a$" (bcrypt magic prefixes).  All other rows are treated as base64 and
 * upgraded in-place.
 *
 * Usage:
 *   npx tsx scripts/migrate-passwords.ts
 *
 * Safe to run multiple times — already-hashed rows are skipped.
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const BCRYPT_COST = 12;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL or NEON_DATABASE_URL environment variable must be set.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    // Fetch only rows that are NOT already bcrypt hashes
    const { rows } = await client.query<{ id: number; password: string }>(
      `SELECT id, password
       FROM   users
       WHERE  password NOT LIKE '$2b$%'
         AND  password NOT LIKE '$2a$%'`
    );

    if (rows.length === 0) {
      console.log('✅  No legacy passwords found — database is already fully migrated.');
      return;
    }

    console.log(`Found ${rows.length} user(s) with legacy passwords. Migrating…`);

    let upgraded = 0;
    let skipped  = 0;

    for (const row of rows) {
      let plaintext: string;

      try {
        // Attempt to decode as base64; fall back to treating it as plain text
        const decoded = Buffer.from(row.password, 'base64').toString('utf8');

        // Sanity-check: re-encoding the decoded value should give back the
        // original string (guards against values that happen to be valid base64
        // but weren't actually encoded that way).
        const reEncoded = Buffer.from(decoded, 'utf8').toString('base64');
        plaintext = reEncoded === row.password ? decoded : row.password;
      } catch {
        // Buffer.from never actually throws for base64, but be defensive
        plaintext = row.password;
      }

      try {
        const hash = await bcrypt.hash(plaintext, BCRYPT_COST);

        await client.query(
          'UPDATE users SET password = $1 WHERE id = $2',
          [hash, row.id]
        );

        console.log(`  ✔  user id=${row.id} upgraded`);
        upgraded++;
      } catch (err) {
        console.error(`  ✖  user id=${row.id} FAILED:`, err);
        skipped++;
      }
    }

    console.log(`\nDone. Upgraded: ${upgraded}, Failed: ${skipped}`);

    if (skipped > 0) {
      process.exitCode = 1;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
