/**
 * Correct dates mistakenly entered as January 2025 → January 2026.
 * Updates release_date, brd_shared_date, request_date.
 * Only changes records where year=2025 and month=01.
 *
 * Run from brds/ directory: npx tsx scripts/fix-january-2025-dates.ts
 */
import { getDb, initDb } from "../database/schema";

function run() {
  initDb();
  const db = getDb();

  const releaseResult = db
    .prepare("UPDATE features SET release_date = '2026' || substr(release_date, 5) WHERE release_date LIKE '2025-01-%'")
    .run();
  const brdResult = db
    .prepare("UPDATE features SET brd_shared_date = '2026' || substr(brd_shared_date, 5) WHERE brd_shared_date LIKE '2025-01-%'")
    .run();
  const requestResult = db
    .prepare("UPDATE features SET request_date = '2026' || substr(request_date, 5) WHERE request_date LIKE '2025-01-%'")
    .run();

  // Recalculate lead_time for rows where both brd_shared_date and release_date exist
  db.exec(`
    UPDATE features SET lead_time = CAST(julianday(release_date) - julianday(brd_shared_date) AS INTEGER)
    WHERE brd_shared_date IS NOT NULL AND release_date IS NOT NULL
  `);

  db.close();

  console.log("Date correction complete:");
  console.log(`  release_date:     ${releaseResult.changes} updated`);
  console.log(`  brd_shared_date:  ${brdResult.changes} updated`);
  console.log(`  request_date:     ${requestResult.changes} updated`);
  console.log(`  lead_time:        recalculated for affected rows`);
}

run();
