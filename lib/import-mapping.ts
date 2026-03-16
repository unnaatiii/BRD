/**
 * Developer and QA name mapping for Excel imports.
 * - First-name matching (Abhishek → Abhishek Raj)
 * - Two Gauravs: before 25 Jan 2025 → old, after → new intern
 * - QA restricted to Bhavesh, Unnati, Abhishek Pandey
 */

/** Pure date pattern: DD/MM/YYYY or D/M/YYYY */
export const DATE_ONLY_REGEX = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

/** Section labels that should not be imported as feature names */
const SECTION_LABELS = ["Next Release", "Release", "Production Push"];

export function isDateOnlyFeatureName(name: string): boolean {
  return DATE_ONLY_REGEX.test(String(name).trim());
}

export function isSectionLabel(name: string): boolean {
  const n = String(name).trim();
  return SECTION_LABELS.some((label) => n.toLowerCase() === label.toLowerCase());
}

export function shouldSkipFeatureName(name: string): boolean {
  const n = String(name).trim();
  return !n || isDateOnlyFeatureName(n) || isSectionLabel(n);
}

/** QA users allowed in the system. Others stored as reviewer_name only. */
export const ALLOWED_QA_NAMES = ["Bhavesh", "Unnati", "Abhishek Pandey"] as const;

/** Developer first-name → canonical full name */
const DEVELOPER_FIRST_NAME_MAP: Record<string, string> = {
  Abhishek: "Abhishek Raj",
  Navdeep: "Navdeep Rana",
  Vedansh: "Vedansh",
  Gaurav: "Gaurav", // Default; Two Gauravs resolved by date below
};

/** Old Gaurav (before 25 Jan 2025) vs new intern Gaurav (on/after 25 Jan 2025) */
const GAURAV_CUTOFF = "2025-01-25";
const OLD_GAURAV = "Gaurav";
const NEW_GAURAV = "Gaurav (Intern)";

/**
 * Split "Gaurav and Vedansh" or "Gaurav, Vedansh" into individual names.
 */
export function splitMultipleDevelopers(raw: string): string[] {
  const s = raw
    .trim()
    .split(/[\s,]+and[\s,]+|,\s*|\s+and\s+/i)
    .map((n) => n.trim())
    .filter(Boolean);
  return [...new Set(s)];
}

/**
 * Resolve Excel developer name to canonical system name.
 * - First name matching
 * - Two Gauravs: use release_date
 */
export function resolveDeveloperName(excelName: string, releaseDate: string | null): string {
  const trimmed = excelName.trim();
  if (!trimmed) return trimmed;

  const first = splitMultipleDevelopers(trimmed);
  if (first.length === 0) return trimmed;

  const resolved = first.map((name) => {
    const firstName = name.split(/\s+/)[0] ?? name;
    if (firstName.toLowerCase() === "gaurav") {
      if (releaseDate && releaseDate >= GAURAV_CUTOFF) return NEW_GAURAV;
      return OLD_GAURAV;
    }
    return DEVELOPER_FIRST_NAME_MAP[firstName] ?? name;
  });

  return resolved.join(", ");
}

/**
 * Resolve Excel QA name.
 * - "Abhishek" in QA column → Abhishek Pandey
 * - Only Bhavesh, Unnati, Abhishek Pandey are allowed as qa_name.
 * - Others: return qa_name=null, reviewer_name=original
 */
export function resolveQAName(
  excelName: string
): { qa_name: string | null; reviewer_name: string | null } {
  const trimmed = excelName.trim();
  if (!trimmed) return { qa_name: null, reviewer_name: null };

  const canonical =
    trimmed.toLowerCase() === "abhishek" ? "Abhishek Pandey" : trimmed;

  const allowed = ALLOWED_QA_NAMES.find((a) => a.toLowerCase() === canonical.toLowerCase());
  if (allowed) {
    return { qa_name: allowed, reviewer_name: null };
  }
  return { qa_name: null, reviewer_name: trimmed };
}
