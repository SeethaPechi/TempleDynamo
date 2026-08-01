/**
 * verify-passwords.ts
 *
 * Post-migration health check that confirms every password in the `users` table
 * is a valid bcrypt hash.  Run this after migrate-passwords.ts to ensure no
 * user was left with a legacy (base64) password that would silently break login.
 *
 * Usage:
 *   npx tsx scripts/verify-passwords.ts
 *
 * Exit codes:
 *   0 — all passwords are bcrypt hashes (migration complete)
 *   1 — one or more passwords are NOT bcrypt (action required)
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

/** Return true when the value looks like a bcrypt hash ($2b$ or $2a$ prefix). */
function isBcrypt(value: string): boolean {
  return value.startsWith('$2b$') || value.startsWith('$2a$');
}

async function main() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ id: number; email: string; password: string }>(
      'SELECT id, email, password FROM users ORDER BY id'
    );

    if (rows.length === 0) {
      console.log('ℹ️  No users found in the database.');
      return;
    }

    console.log(`Checking ${rows.length} user(s)…\n`);

    let ok = 0;
    let legacy = 0;
    let invalid = 0;

    for (const row of rows) {
      if (isBcrypt(row.password)) {
        // Validate the hash is well-formed (bcrypt.getRounds throws on bad hashes)
        try {
          const cost = bcrypt.getRounds(row.password);
          if (cost !== BCRYPT_COST) {
            console.warn(`  ⚠  id=${row.id} <${row.email}> — bcrypt hash but cost=${cost} (expected ${BCRYPT_COST})`);
            invalid++;
          } else {
            console.log(`  ✔  id=${row.id} <${row.email}> — bcrypt hash (cost ${cost})`);
            ok++;
          }
        } catch {
          console.error(`  ✖  id=${row.id} <${row.email}> — MALFORMED bcrypt hash`);
          invalid++;
        }
      } else {
        console.warn(`  ⚠  id=${row.id} <${row.email}> — NOT a bcrypt hash (legacy or unknown format)`);
        legacy++;
      }
    }

    console.log('\n── Summary ─────────────────────────────────────────');
    console.log(`  Bcrypt (good) : ${ok}`);
    console.log(`  Legacy / other: ${legacy}`);
    console.log(`  Malformed     : ${invalid}`);

    if (legacy > 0 || invalid > 0) {
      console.log('\n❌  Action required:');
      if (legacy > 0) {
        console.log(`    ${legacy} user(s) still have non-bcrypt passwords.`);
        console.log('    Run: npx tsx scripts/migrate-passwords.ts');
      }
      if (invalid > 0) {
        console.log(`    ${invalid} user(s) have malformed bcrypt hashes — these accounts need a password reset.`);
      }
      process.exitCode = 1;
    } else {
      console.log('\n✅  All passwords are valid bcrypt hashes — migration complete.');
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
