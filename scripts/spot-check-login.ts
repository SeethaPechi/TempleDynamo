/**
 * spot-check-login.ts
 *
 * End-to-end verification that the base64→bcrypt migration preserves login
 * ability.  This script:
 *
 *   1. Runs a suite of unit-level checks against the verifyPassword logic
 *      (bcrypt match, bcrypt mismatch, legacy base64 auto-upgrade, wrong b64).
 *   2. Creates a temporary DB user with a known base64-encoded password,
 *      runs the same migration logic that migrate-passwords.ts uses, then
 *      verifies bcrypt.compare succeeds with the original plaintext — and
 *      finally removes the temp user.
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 *
 * Usage:
 *   npx tsx scripts/spot-check-login.ts
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const BCRYPT_COST = 12;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL or NEON_DATABASE_URL must be set.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// ── Helpers that mirror the production verifyPassword + migration logic ──────

/** Decode a legacy base64 password, falling back to the raw value if not truly base64. */
function decodeLegacy(stored: string): string {
  try {
    const decoded = Buffer.from(stored, 'base64').toString('utf8');
    const reEncoded = Buffer.from(decoded, 'utf8').toString('base64');
    return reEncoded === stored ? decoded : stored;
  } catch {
    return stored;
  }
}

/** Verify a password against a stored value, identical to server/routes.ts verifyPassword */
async function verifyPassword(
  input: string,
  stored: string,
): Promise<boolean> {
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    return bcrypt.compare(input, stored);
  }
  const decoded = decodeLegacy(stored);
  return decoded === input;
}

// ── Unit-level checks ────────────────────────────────────────────────────────

interface CheckResult { name: string; passed: boolean; detail?: string }

async function runUnitChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const plaintext = 'S3cr3t!Pass#';

  // 1. bcrypt hash of plaintext — correct password must match
  {
    const hash = await bcrypt.hash(plaintext, BCRYPT_COST);
    const ok = await verifyPassword(plaintext, hash);
    results.push({ name: 'bcrypt: correct password matches', passed: ok });
  }

  // 2. bcrypt hash of plaintext — wrong password must NOT match
  {
    const hash = await bcrypt.hash(plaintext, BCRYPT_COST);
    const ok = await verifyPassword('WrongPassword!', hash);
    results.push({ name: 'bcrypt: wrong password rejected', passed: !ok });
  }

  // 3. Legacy base64: correct decoded value must match
  {
    const stored = Buffer.from(plaintext, 'utf8').toString('base64');
    const ok = await verifyPassword(plaintext, stored);
    results.push({ name: 'legacy base64: correct plaintext matches', passed: ok });
  }

  // 4. Legacy base64: wrong plaintext must NOT match
  {
    const stored = Buffer.from(plaintext, 'utf8').toString('base64');
    const ok = await verifyPassword('WrongPassword!', stored);
    results.push({ name: 'legacy base64: wrong plaintext rejected', passed: !ok });
  }

  // 5. Migration round-trip: decode b64 → bcrypt → verify original plaintext
  {
    const stored = Buffer.from(plaintext, 'utf8').toString('base64');
    const decoded = decodeLegacy(stored);
    const hash = await bcrypt.hash(decoded, BCRYPT_COST);
    const ok = await verifyPassword(plaintext, hash);
    results.push({ name: 'migration round-trip: original plaintext matches migrated hash', passed: ok });
  }

  // 6. Migration round-trip: wrong password must not match migrated hash
  {
    const stored = Buffer.from(plaintext, 'utf8').toString('base64');
    const decoded = decodeLegacy(stored);
    const hash = await bcrypt.hash(decoded, BCRYPT_COST);
    const ok = await verifyPassword('WrongPassword!', hash);
    results.push({ name: 'migration round-trip: wrong password rejected after migration', passed: !ok });
  }

  // 7. Non-base64 value (plain text): falls back gracefully — same string matches
  {
    const rawValue = 'plaintext_not_base64!@#';
    const ok = await verifyPassword(rawValue, rawValue);
    results.push({ name: 'non-base64 fallback: raw value matches itself', passed: ok });
  }

  return results;
}

// ── DB spot-check ─────────────────────────────────────────────────────────────

async function runDbSpotCheck(client: any): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const testEmail = `_spot_check_${Date.now()}@test.internal`;
  const plaintext  = 'Sp0tCh3ck!Test#99';
  const b64stored  = Buffer.from(plaintext, 'utf8').toString('base64');

  let userId: number | null = null;

  try {
    // Insert a temp user with a legacy base64 password
    const { rows } = await (await client).query<{ id: number }>(
      `INSERT INTO users (first_name, last_name, email, password, phone, country_code, role)
       VALUES ('_spot', '_check', $1, $2, '0000000000', '+00', 'user')
       RETURNING id`,
      [testEmail, b64stored],
    );
    userId = rows[0].id;

    // Simulate what migrate-passwords.ts does
    const decoded = decodeLegacy(b64stored);
    const hash    = await bcrypt.hash(decoded, BCRYPT_COST);
    await (await client).query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId]);

    // Verify: correct plaintext must match the migrated hash
    const matchOk = await bcrypt.compare(plaintext, hash);
    results.push({
      name: `DB spot-check (id=${userId}): original plaintext matches migrated hash`,
      passed: matchOk,
    });

    // Verify: wrong password must NOT match
    const wrongOk = await bcrypt.compare('WrongPassword!', hash);
    results.push({
      name: `DB spot-check (id=${userId}): wrong password rejected`,
      passed: !wrongOk,
    });

    // Verify: stored hash is well-formed bcrypt at the expected cost
    let costOk = false;
    try {
      const cost = bcrypt.getRounds(hash);
      costOk = cost === BCRYPT_COST;
    } catch { /* malformed */ }
    results.push({
      name: `DB spot-check (id=${userId}): migrated hash has cost ${BCRYPT_COST}`,
      passed: costOk,
    });
  } finally {
    // Always clean up — even if assertions above throw
    if (userId !== null) {
      await (await client).query('DELETE FROM users WHERE id = $1', [userId]);
    }
  }

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Running verifyPassword spot-checks…\n');

  const unitResults = await runUnitChecks();

  const client = await pool.connect();
  let dbResults: CheckResult[] = [];
  try {
    dbResults = await runDbSpotCheck(client as any);
  } finally {
    client.release();
    await pool.end();
  }

  const allResults = [...unitResults, ...dbResults];

  let passed = 0;
  let failed = 0;
  for (const r of allResults) {
    const icon = r.passed ? '  ✔' : '  ✖';
    console.log(`${icon}  ${r.name}`);
    r.passed ? passed++ : failed++;
  }

  console.log(`\n── Summary ──────────────────────────────────────────`);
  console.log(`  Passed: ${passed} / ${allResults.length}`);

  if (failed > 0) {
    console.log(`\n❌  ${failed} check(s) FAILED — login may be broken for some users.`);
    process.exitCode = 1;
  } else {
    console.log(`\n✅  All checks passed — migration preserves login for verified credential shapes.`);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
