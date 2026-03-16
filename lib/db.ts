import { getDb, initDb } from "@/database/schema";
import type { Feature, FeatureInput, User, UserRole } from "@/lib/types";
import { calcSuccessRate, calcLeadTime } from "@/lib/utils";

export { calcSuccessRate } from "@/lib/utils";

export function mapRow(row: Record<string, unknown>): Feature {
  return {
    id: row.id as number,
    feature_name: row.feature_name as string,
    vertical: row.vertical as Feature["vertical"],
    stakeholder_name: row.stakeholder_name as string,
    brd_link: (row.brd_link as string) || null,
    feature_description: (row.feature_description as string) || null,
    request_date: (row.request_date as string) || null,
    brd_shared_date: (row.brd_shared_date as string) || null,
    development_start_date: (row.development_start_date as string) || null,
    release_date: (row.release_date as string) || null,
    release_version: (row.release_version as string) || null,
    developer_name: (row.developer_name as string) || null,
    qa_name: (row.qa_name as string) || null,
    reviewer_name: (row.reviewer_name as string) || null,
    scope_changed_after_release: Boolean(row.scope_changed_after_release),
    feedback_notes: (row.feedback_notes as string) || null,
    usage_score: row.usage_score != null ? Number(row.usage_score) : null,
    success_rate: row.success_rate != null ? Number(row.success_rate) : null,
    status: (row.status as Feature["status"]) || "Pending BRD",
    bugs_found: row.bugs_found != null ? Number(row.bugs_found) : null,
    bug_count_after_release: row.bug_count_after_release != null ? Number(row.bug_count_after_release) : null,
    release_type: (row.release_type as Feature["release_type"]) || "NORMAL_RELEASE",
    lead_time: row.lead_time != null ? Number(row.lead_time) : null,
  };
}

export function getAllFeatures(): Feature[] {
  initDb();
  const db = getDb();
  const rows = db.prepare("SELECT * FROM features ORDER BY id DESC").all();
  db.close();
  return (rows as Record<string, unknown>[]).map(mapRow);
}

export function getFeatureById(id: number): Feature | null {
  initDb();
  const db = getDb();
  const row = db.prepare("SELECT * FROM features WHERE id = ?").get(id);
  db.close();
  return row ? mapRow(row as Record<string, unknown>) : null;
}

/** Match developer by exact or comma-separated (e.g. "Gaurav, Vedansh") */
export function getFeaturesByDeveloper(developer: string): Feature[] {
  initDb();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM features WHERE
        developer_name = ? OR
        developer_name LIKE ? || ',%' OR
        developer_name LIKE '%, ' || ? OR
        developer_name LIKE '%, ' || ? || ',%'
      ORDER BY id DESC`
    )
    .all(developer, developer, developer, developer);
  db.close();
  return (rows as Record<string, unknown>[]).map(mapRow);
}

export function getFeaturesByQA(qa: string): Feature[] {
  initDb();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM features WHERE qa_name = ? ORDER BY id DESC")
    .all(qa);
  db.close();
  return (rows as Record<string, unknown>[]).map(mapRow);
}

export function createFeature(input: FeatureInput): Feature {
  initDb();
  const successRate =
    input.success_rate ??
    calcSuccessRate(input.bug_count_after_release, input.scope_changed_after_release);
  const leadTime = calcLeadTime(input.brd_shared_date, input.release_date);
  const releaseType = input.release_type || "NORMAL_RELEASE";
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO features (
      feature_name, vertical, stakeholder_name, brd_link, feature_description,
      request_date, brd_shared_date, development_start_date, release_date,
      release_version, developer_name, qa_name, reviewer_name, scope_changed_after_release,
      feedback_notes, usage_score, success_rate, status, bugs_found, bug_count_after_release,
      release_type, lead_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    input.feature_name,
    input.vertical,
    input.stakeholder_name,
    input.brd_link || null,
    input.feature_description || null,
    input.request_date || null,
    input.brd_shared_date || null,
    input.development_start_date || null,
    input.release_date || null,
    input.release_version || null,
    input.developer_name || null,
    input.qa_name || null,
    input.reviewer_name || null,
    input.scope_changed_after_release ? 1 : 0,
    input.feedback_notes || null,
    input.usage_score ?? null,
    successRate ?? null,
    input.status || "Pending BRD",
    input.bugs_found ?? null,
    input.bug_count_after_release ?? null,
    releaseType,
    leadTime
  );
  const id = (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id;
  db.close();
  const created = getFeatureById(id);
  if (!created) throw new Error("Failed to create feature");
  return created;
}

export function findFeatureIdByBrdLink(brdLink: string): number | null {
  initDb();
  const db = getDb();
  const row = db.prepare("SELECT id FROM features WHERE brd_link = ? LIMIT 1").get(brdLink) as
    | { id: number }
    | undefined;
  db.close();
  return row?.id ?? null;
}

export function deleteFeature(id: number): boolean {
  initDb();
  const db = getDb();
  const r = db.prepare("DELETE FROM features WHERE id = ?").run(id);
  db.close();
  return r.changes > 0;
}

export function deleteFeaturesWhereFeatureNameLike(pattern: string): number {
  initDb();
  const db = getDb();
  const r = db.prepare("DELETE FROM features WHERE feature_name LIKE ?").run(pattern);
  db.close();
  return r.changes;
}

/** Delete features whose feature_name is only a date (DD/MM/YYYY) */
export function deleteDateOnlyFeatures(): number {
  initDb();
  const db = getDb();
  const rows = db
    .prepare("SELECT id, feature_name FROM features")
    .all() as { id: number; feature_name: string }[];
  const dateOnlyRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  let deleted = 0;
  for (const row of rows) {
    if (dateOnlyRegex.test(String(row.feature_name).trim())) {
      db.prepare("DELETE FROM features WHERE id = ?").run(row.id);
      deleted++;
    }
  }
  db.close();
  return deleted;
}

/** Remap developer_name from one value to another (bulk update) */
export function updateFeaturesDeveloperName(
  from: string,
  to: string
): number {
  initDb();
  const db = getDb();
  const r = db
    .prepare("UPDATE features SET developer_name = ? WHERE developer_name = ?")
    .run(to, from);
  db.close();
  return r.changes;
}

/** Update developer_name for features matching fromName where release_date < cutoff → oldName, >= cutoff → newName */
export function updateDeveloperByDate(
  fromName: string,
  cutoff: string,
  oldName: string,
  newName: string
): { before: number; after: number } {
  initDb();
  const db = getDb();
  const beforeRows = db
    .prepare(
      "SELECT id FROM features WHERE developer_name = ? AND release_date IS NOT NULL AND release_date < ?"
    )
    .all(fromName, cutoff) as { id: number }[];
  const afterRows = db
    .prepare(
      "SELECT id FROM features WHERE developer_name = ? AND (release_date IS NULL OR release_date >= ?)"
    )
    .all(fromName, cutoff) as { id: number }[];

  for (const { id } of beforeRows) {
    db.prepare("UPDATE features SET developer_name = ? WHERE id = ?").run(oldName, id);
  }
  for (const { id } of afterRows) {
    db.prepare("UPDATE features SET developer_name = ? WHERE id = ?").run(newName, id);
  }
  db.close();
  return { before: beforeRows.length, after: afterRows.length };
}

/** Restore qa_name from reviewer_name when reviewer was wrongly moved (e.g. Abhishek → Abhishek Pandey) */
export function updateFeaturesReviewerToQA(reviewerName: string, qaName: string): number {
  initDb();
  const db = getDb();
  const r = db
    .prepare(
      "UPDATE features SET qa_name = ?, reviewer_name = NULL WHERE reviewer_name = ?"
    )
    .run(qaName, reviewerName);
  db.close();
  return r.changes;
}

/** Remap qa_name from one value to another (bulk update) */
export function updateFeaturesQAName(from: string, to: string): number {
  initDb();
  const db = getDb();
  const r = db.prepare("UPDATE features SET qa_name = ? WHERE qa_name = ?").run(to, from);
  db.close();
  return r.changes;
}

/** Move non-allowed QA names to reviewer_name, clear qa_name */
export function moveQAToReviewer(qaName: string): number {
  initDb();
  const db = getDb();
  const r = db
    .prepare("UPDATE features SET qa_name = NULL, reviewer_name = ? WHERE qa_name = ?")
    .run(qaName, qaName);
  db.close();
  return r.changes;
}

export function findFeatureIdByName(featureName: string): number | null {
  initDb();
  const db = getDb();
  const row = db.prepare("SELECT id FROM features WHERE feature_name = ? LIMIT 1").get(featureName) as
    | { id: number }
    | undefined;
  db.close();
  return row?.id ?? null;
}

export function updateFeature(id: number, input: Partial<FeatureInput>): Feature | null {
  initDb();
  const existing = getFeatureById(id);
  if (!existing) return null;
  const bugCount = input.bug_count_after_release ?? existing.bug_count_after_release ?? 0;
  const scopeChanged = input.scope_changed_after_release ?? existing.scope_changed_after_release;
  const successRate =
    input.success_rate ?? calcSuccessRate(bugCount, scopeChanged);
  const brdDate = input.brd_shared_date ?? existing.brd_shared_date;
  const relDate = input.release_date ?? existing.release_date;
  const leadTime = calcLeadTime(brdDate, relDate);
  const releaseType = input.release_type ?? existing.release_type ?? "NORMAL_RELEASE";
  const db = getDb();
  db.prepare(`
    UPDATE features SET
      feature_name = ?, vertical = ?, stakeholder_name = ?, brd_link = ?, feature_description = ?,
      request_date = ?, brd_shared_date = ?, development_start_date = ?, release_date = ?,
      release_version = ?, developer_name = ?, qa_name = ?, reviewer_name = ?, scope_changed_after_release = ?,
      feedback_notes = ?, usage_score = ?, success_rate = ?, status = ?, bugs_found = ?,
      bug_count_after_release = ?, release_type = ?, lead_time = ?
    WHERE id = ?
  `).run(
    input.feature_name ?? existing.feature_name,
    input.vertical ?? existing.vertical,
    input.stakeholder_name ?? existing.stakeholder_name,
    input.brd_link ?? existing.brd_link ?? null,
    input.feature_description ?? existing.feature_description ?? null,
    input.request_date ?? existing.request_date ?? null,
    input.brd_shared_date ?? existing.brd_shared_date ?? null,
    input.development_start_date ?? existing.development_start_date ?? null,
    input.release_date ?? existing.release_date ?? null,
    input.release_version ?? existing.release_version ?? null,
    input.developer_name ?? existing.developer_name ?? null,
    input.qa_name ?? existing.qa_name ?? null,
    input.reviewer_name ?? existing.reviewer_name ?? null,
    (input.scope_changed_after_release ?? existing.scope_changed_after_release) ? 1 : 0,
    input.feedback_notes ?? existing.feedback_notes ?? null,
    input.usage_score ?? existing.usage_score ?? null,
    successRate ?? null,
    input.status ?? existing.status,
    input.bugs_found ?? existing.bugs_found ?? null,
    input.bug_count_after_release ?? existing.bug_count_after_release ?? null,
    releaseType,
    leadTime,
    id
  );
  db.close();
  return getFeatureById(id);
}

// Users
export function getAllUsers(): User[] {
  initDb();
  const db = getDb();
  const rows = db.prepare("SELECT * FROM users ORDER BY name").all();
  db.close();
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: r.id as number,
    name: r.name as string,
    role: r.role as UserRole,
  }));
}

export function getUsersByRole(role: UserRole): User[] {
  return getAllUsers().filter((u) => u.role === role);
}

export function createUser(name: string, role: UserRole): User {
  initDb();
  const db = getDb();
  db.prepare("INSERT INTO users (name, role) VALUES (?, ?)").run(name, role);
  const id = (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id;
  db.close();
  const users = getAllUsers();
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error("Failed to create user");
  return u;
}

export function deleteUser(id: number): boolean {
  initDb();
  const db = getDb();
  const r = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  db.close();
  return r.changes > 0;
}
