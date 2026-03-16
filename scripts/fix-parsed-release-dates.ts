/**
 * Correct release dates that were misparsed as MM/DD instead of DD/MM during Excel import.
 * 2026-06-01 (June 1) → 2026-01-06 (Jan 6)
 * 2026-08-01 (Aug 1) → 2026-01-08 (Jan 8)
 *
 * Run from brds/ directory: npx tsx scripts/fix-parsed-release-dates.ts
 */
import { getDb, initDb } from "../database/schema";

function run() {
  initDb();
  const db = getDb();

  const june = db.prepare(
    "UPDATE features SET release_date = '2026-01-06' WHERE release_date = '2026-06-01'"
  ).run();
  const august = db.prepare(
    "UPDATE features SET release_date = '2026-01-08' WHERE release_date = '2026-08-01'"
  ).run();

  // Recalculate lead_time for affected rows
  db.exec(`
    UPDATE features SET lead_time = CAST(julianday(release_date) - julianday(brd_shared_date) AS INTEGER)
    WHERE brd_shared_date IS NOT NULL AND release_date IS NOT NULL
  `);

  db.close();

  console.log("Release date correction complete:");
  console.log(`  2026-06-01 → 2026-01-06:  ${june.changes} updated`);
  console.log(`  2026-08-01 → 2026-01-08:  ${august.changes} updated`);
  console.log(`  Total:                    ${june.changes + august.changes} records fixed`);
  console.log(`  lead_time:                recalculated for affected rows`);
}

run();
