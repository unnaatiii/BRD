import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "brds.db");

export function getDb() {
  return new Database(dbPath);
}

export function initDb() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_name TEXT NOT NULL,
      vertical TEXT NOT NULL,
      stakeholder_name TEXT NOT NULL,
      brd_link TEXT,
      feature_description TEXT,
      request_date TEXT,
      brd_shared_date TEXT,
      development_start_date TEXT,
      release_date TEXT,
      release_version TEXT,
      developer_name TEXT,
      qa_name TEXT,
      scope_changed_after_release INTEGER DEFAULT 0,
      feedback_notes TEXT,
      usage_score INTEGER,
      success_rate INTEGER,
      status TEXT DEFAULT 'Pending BRD',
      bugs_found INTEGER,
      bug_count_after_release INTEGER DEFAULT 0
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);
  try {
    db.exec("ALTER TABLE features ADD COLUMN bug_count_after_release INTEGER DEFAULT 0");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE features ADD COLUMN release_type TEXT DEFAULT 'NORMAL_RELEASE'");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE features ADD COLUMN lead_time INTEGER");
  } catch {
    // Column already exists
  }
  try {
    db.exec("ALTER TABLE features ADD COLUMN reviewer_name TEXT");
  } catch {
    // Column already exists
  }
  // Backfill lead_time for existing rows where both dates exist
  try {
    db.exec(`
      UPDATE features SET lead_time = CAST(julianday(release_date) - julianday(brd_shared_date) AS INTEGER)
      WHERE lead_time IS NULL AND brd_shared_date IS NOT NULL AND release_date IS NOT NULL
    `);
  } catch {
    // Ignore
  }
  db.close();
}
