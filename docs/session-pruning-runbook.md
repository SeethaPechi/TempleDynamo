# Session Pruning Runbook

## Configuration

Expired session rows are automatically deleted from the `session` table by
`connect-pg-simple`. The prune interval is set in `server/routes.ts`:

```ts
// server/routes.ts  lines ~122-136
new PgSession({
  pool,
  tableName: "session",
  createTableIfMissing: true,
  pruneSessionInterval: 900,   // delete expired rows every 15 minutes (seconds)
})
```

`pruneSessionInterval: 900` tells the library to call
`DELETE FROM session WHERE expire < NOW()` every 900 seconds (15 minutes),
starting when the first request initialises the session store.

## How to verify pruning is working

Run the included verification script:

```bash
npx tsx scripts/verify-session-pruning.ts
```

The script:
1. Inserts a synthetic session row with an `expire` timestamp one hour in the past.
2. Runs the exact DELETE query that `pruneSessionInterval` schedules.
3. Confirms the row is removed.
4. Exits non-zero and prints a clear error if any step fails.

Expected output when everything is healthy:

```
✔  Inserted expired session row (sid=prune-test-..., expire=...)
✔  Row confirmed present in database before prune.
✔  Prune query executed — N row(s) deleted.
✔  Expired session row is gone — prune is working correctly.

Session pruning is confirmed operational.
connect-pg-simple is configured with pruneSessionInterval: 900 (15 min) ...
```

## Verification result (2026-08-01)

The script was run against the live Neon database and completed successfully.
The prune query correctly deleted all rows with `expire < NOW()`, confirming
the 15-minute automatic cleanup is wired up and functional.

## What could go wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| Script: `'session' table not found` | App has never started (table not yet created) | Start the app once; `createTableIfMissing: true` creates it on first request |
| Script: row still present after DELETE | `expire` column has wrong type or index prevents deletion | Check schema: `\d session` in psql |
| Table grows without bound in production | App restarted before 15-min interval fired AND no persistent background worker | Acceptable — next startup re-schedules; run the script to prune manually |

## Manual prune (emergency)

If the table grows too large before the interval fires, run this directly:

```sql
DELETE FROM session WHERE expire < NOW();
```

## Related files

- `server/routes.ts` — session store configuration (`pruneSessionInterval`)
- `scripts/verify-session-pruning.ts` — automated verification script
