import { NextResponse } from "next/server";
import type { FeatureInput, FeatureStatus, ReleaseType, Vertical } from "@/lib/types";
import { createFeature, findFeatureIdByBrdLink, findFeatureIdByName, updateFeature } from "@/lib/db";
import {
  resolveDeveloperName,
  resolveQAName,
  shouldSkipFeatureName,
} from "@/lib/import-mapping";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type ImportRow = {
  developer_name?: string;
  qa_name?: string;
  release_date?: string;
  brd_link?: string;
  feature_name?: string;
  vertical?: string;
  release_type_col?: string;
};


/** Extract URL from text. Handles: [https://...] or raw https://... */
function extractUrlFromText(text: string): { url: string; cleanText: string } | null {
  const raw = trimOrEmpty(text);
  if (!raw) return null;

  // Pattern: [https://...] or [http://...]
  const bracketed = raw.match(/\[(https?:\/\/[^\]]+)\]/i);
  if (bracketed) {
    const url = bracketed[1].trim();
    const cleanText = raw.replace(bracketed[0], "").trim().replace(/\s{2,}/g, " ").trim();
    return { url, cleanText: cleanText || raw };
  }

  // Pattern: raw https://... or http://... (standalone URL in text)
  const nakedUrl = raw.match(/(https?:\/\/[^\s\]\[]+)/i);
  if (nakedUrl) {
    const url = nakedUrl[1].replace(/[)\]]+$/, "").trim();
    const cleanText = raw.replace(nakedUrl[1], "").trim().replace(/\s{2,}/g, " ").trim();
    return { url, cleanText: cleanText || raw };
  }

  return null;
}

/** Map Excel vertical values to system verticals. Handles typos (operatons→Operations, etc.). */
function normalizeVertical(raw: string): Vertical {
  const lower = raw.trim().toLowerCase();
  if (/^sales?$/i.test(lower)) return "Sales";
  if (/^ops?$|^operat(i)?ons?$/i.test(lower) || /^operat/i.test(lower)) return "Operations";
  if (/^finance$/i.test(lower)) return "Finance";
  if (/^market/i.test(lower)) return "Marketing";
  return "Operations"; // default
}

function normHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[_\-]+/g, " ");
}

function trimOrEmpty(v: unknown): string {
  return String(v ?? "").trim();
}

function isValidISODate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function formatDateToISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function excelSerialToDate(serial: number): Date {
  // Excel serial date: days since 1899-12-30
  const epoch = Date.UTC(1899, 11, 30);
  return new Date(epoch + serial * 24 * 60 * 60 * 1000);
}

function parseDateString(raw: string): string | null {
  if (!raw) return null;
  if (isValidISODate(raw)) return raw;
  const m = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const y = parseInt(m[3].length === 2 ? `20${m[3]}` : m[3], 10);
    const day = a > 12 ? a : b > 12 ? b : a;
    const month = a > 12 ? b : b > 12 ? a : b;
    const d = new Date(y, month - 1, day);
    if (!Number.isNaN(d.getTime())) return formatDateToISO(d);
  }
  return null;
}

/** Scan all values in a row for date. Handles "Date : 30/01/2026" section headers. */
function extractDateFromAnyCell(row: Record<string, unknown>): string | null {
  for (const v of Object.values(row)) {
    if (v == null || v === "") continue;
    if (typeof v === "number" && Number.isFinite(v)) {
      const d = excelSerialToDate(v);
      return formatDateToISO(d);
    }
    const raw = String(v).trim();
    const m = raw.match(/date\s*:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (m) return parseDateString(m[1]);
    const parsed = parseDateString(raw);
    if (parsed) return parsed;
  }
  return null;
}

function parseDateCell(v: unknown): { ok: true; value: string } | { ok: false; reason: string } {
  if (v == null || v === "") return { ok: false, reason: "Missing date" };

  if (typeof v === "number" && Number.isFinite(v)) {
    const d = excelSerialToDate(v);
    return { ok: true, value: formatDateToISO(d) };
  }

  const raw = trimOrEmpty(v);
  if (!raw) return { ok: false, reason: "Missing date" };
  if (isValidISODate(raw)) return { ok: true, value: raw };

  // Try common formats: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, etc.
  const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const y = parseInt(m[3].length === 2 ? `20${m[3]}` : m[3], 10);
    // Heuristic: if a > 12 => DD/MM. else if b > 12 => MM/DD. else assume DD/MM.
    const day = a > 12 ? a : b > 12 ? b : a;
    const month = a > 12 ? b : b > 12 ? a : b;
    const d = new Date(y, month - 1, day);
    if (!Number.isNaN(d.getTime())) return { ok: true, value: formatDateToISO(d) };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return { ok: true, value: formatDateToISO(parsed) };
  return { ok: false, reason: `Invalid date: ${raw}` };
}

function normalizeLink(v: unknown): string | undefined {
  const raw = trimOrEmpty(v);
  if (!raw) return undefined;
  try {
    // Allow plain domains by prefixing https
    const url = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    // Validate
    // eslint-disable-next-line no-new
    new URL(url);
    return url;
  } catch {
    return raw; // store as-is; UI will still render it as href, user can fix later
  }
}

function isHotFix(text: string): boolean {
  const lower = text.toLowerCase().replace(/\s+/g, " ");
  return /hotfix|hot fix|hot_fix/i.test(lower);
}

function detectReleaseType(r: ImportRow): ReleaseType {
  const raw = trimOrEmpty(r.release_type_col ?? "").replace(/[[\]]/g, "").toLowerCase();
  if (raw && /hot[\s\-_]?fix/i.test(raw)) return "HOT_FIX";
  const combined = [r.feature_name, r.release_type_col].filter(Boolean).join(" ");
  return isHotFix(combined) ? "HOT_FIX" : "NORMAL_RELEASE";
}

/**
 * Resolve feature_name and brd_link from row.
 * - If link is in separate column, use it.
 * - If link is embedded in feature text (e.g. "DNP handling [https://...]"), extract both.
 */
function resolveFeatureAndLink(r: ImportRow): { feature_name: string; brd_link: string | undefined } {
  const explicitLink = normalizeLink(r.brd_link);
  let featureText = trimOrEmpty(r.feature_name);

  // Try to extract URL from feature text (embedded link)
  const extracted = extractUrlFromText(featureText);
  const link = explicitLink ?? (extracted ? normalizeLink(extracted.url) : undefined);
  const cleanFeatureName = extracted?.cleanText ?? featureText;

  const name = cleanFeatureName
    ? cleanFeatureName.replace(/^\d+\.\s*/, "").trim() // remove leading "1. " etc.
    : "";

  return {
    feature_name: name,
    brd_link: link,
  };
}

function guessNameFallback({
  brd_link,
  developer_name,
  qa_name,
  release_date,
}: {
  brd_link?: string;
  developer_name: string;
  qa_name: string;
  release_date?: string;
}): string {
  const link = trimOrEmpty(brd_link ?? "");
  if (link) {
    try {
      const u = new URL(link.startsWith("http") ? link : `https://${link}`);
      const pathParts = u.pathname.split("/").filter(Boolean);
      // Jira/Atlassian: .../browse/PROJ-123 → use PROJ-123
      const browseIdx = pathParts.findIndex((p) => p.toLowerCase() === "browse");
      if (browseIdx >= 0 && pathParts[browseIdx + 1])
        return pathParts[browseIdx + 1].trim();
      const last = decodeURIComponent(pathParts.pop() ?? "");
      if (last) return last.replace(/\.(pdf|docx?|xlsx?)$/i, "").trim();
    } catch {
      // ignore
    }
  }
  const parts = [
    release_date ? `Release ${release_date}` : "Release",
    developer_name ? developer_name : "",
    qa_name ? qa_name : "",
  ].filter(Boolean);
  return `Imported - ${parts.join(" ")}`.trim();
}

/**
 * When feature_name from column mapping is empty, scan raw row for any cell
 * that looks like a feature description (long text, possibly with [URL]).
 * Excludes dates, short values, and section headers like "Date : ...".
 */
function extractFeatureFromRawRow(rawRow: Record<string, unknown>): { feature_name: string; brd_link: string | undefined } {
  let best = { feature_name: "", brd_link: undefined as string | undefined };
  let bestLen = 0;

  for (const v of Object.values(rawRow)) {
    if (v == null || v === "") continue;
    const raw = String(v).trim();
    if (raw.length < 15) continue; // too short to be a real description
    if (/^(date|release)\s*:/i.test(raw) || /^\d{4}-\d{2}-\d{2}$/.test(raw)) continue; // date header or ISO date
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(raw)) continue; // date format

    const extracted = extractUrlFromText(raw);
    const cleanText = extracted?.cleanText ?? raw;
    const link = extracted ? normalizeLink(extracted.url) : undefined;

    // Strip trailing QA status metadata: " ... QA Approved", " ... QA Partially Done"
    const name = cleanText
      .replace(/\s+QA\s+(Approved|Partially Done|Done|In Progress|Rejected)\s*$/i, "")
      .trim();

    if (name.length > bestLen && !name.startsWith("Imported - ")) {
      bestLen = name.length;
      best = {
        feature_name: name.replace(/^\d+\.\s*/, "").trim(),
        brd_link: link ?? best.brd_link,
      };
    }
  }
  return best;
}

function resolveFeatureName(
  r: ImportRow,
  resolved: { feature_name: string; brd_link: string | undefined },
  rawRow: Record<string, unknown>,
  release_date: string
): string {
  let name = trimOrEmpty(resolved.feature_name);
  let link = resolved.brd_link;

  if (!name && rawRow && Object.keys(rawRow).length > 0) {
    const fromRaw = extractFeatureFromRawRow(rawRow);
    if (fromRaw.feature_name) {
      name = fromRaw.feature_name;
      if (fromRaw.brd_link) link = fromRaw.brd_link;
    }
  }

  if (name) return name;
  return guessNameFallback({
    brd_link: link,
    developer_name: trimOrEmpty(r.developer_name),
    qa_name: trimOrEmpty(r.qa_name),
    release_date,
  });
}

function extractRowsFromSheet(records: Record<string, unknown>[]): { row: ImportRow; raw: Record<string, unknown> }[] {
  if (!Array.isArray(records)) return [];

  return records.map((r) => {
    const entries = Object.entries(r);
    const getByHeaders = (candidates: string[]) => {
      for (const [k, v] of entries) {
        const nk = normHeader(k);
        if (candidates.includes(nk)) return v;
      }
      return undefined;
    };

    return {
      row: {
        developer_name: trimOrEmpty(getByHeaders(["dev", "developer", "developer name"])),
        qa_name: trimOrEmpty(getByHeaders(["qa", "qa?", "qa name"])),
        release_date: trimOrEmpty(getByHeaders(["date", "release date", "production date"])),
        brd_link: trimOrEmpty(getByHeaders(["link", "brd", "brd link", "document link"])),
        feature_name: trimOrEmpty(getByHeaders(["feature", "feature list", "feature name", "feature_name", "name", "description", "details", "ticket", "title", "summary", "item", "requirements"])),
        vertical: trimOrEmpty(getByHeaders(["vertical", "verticel", "verticale", "verticle", "team"])),
        release_type_col: trimOrEmpty(getByHeaders(["release type", "type", "release_type"])),
      },
      raw: r,
    };
  });
}

async function parseFile(file: File): Promise<
  { ok: true; rows: ImportRow[]; rawRecords: Record<string, unknown>[] } | { ok: false; error: string }
> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".csv")) {
    const text = buf.toString("utf8");
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: "greedy",
    });
    if (parsed.errors?.length) {
      return { ok: false, error: parsed.errors[0]?.message ?? "Failed to parse CSV" };
    }
    const data = Array.isArray(parsed.data) ? parsed.data : [];
    const extracted = extractRowsFromSheet(data);
    return { ok: true, rows: extracted.map((x) => x.row), rawRecords: extracted.map((x) => x.raw) };
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const wb = XLSX.read(buf, { type: "buffer" });
    const firstSheetName = wb.SheetNames[0];
    if (!firstSheetName) return { ok: false, error: "No sheets found in Excel file" };
    const sheet = wb.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const extracted = extractRowsFromSheet(json);
    return { ok: true, rows: extracted.map((x) => x.row), rawRecords: extracted.map((x) => x.raw) };
  }

  return { ok: false, error: "Unsupported file type. Upload .xlsx or .csv" };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const updateReleaseTypesOnly = form.get("updateReleaseTypesOnly") === "true";

    const parsed = await parseFile(file);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const errors: Array<{ row: number; reason: string }> = [];
    let inserted = 0;
    let updated = 0;
    let notFound = 0;
    let skippedDuplicates = 0;
    let skippedEmpty = 0;
    let lastValidDate: string | null = null;
    let lastValidDeveloper: string | null = null;
    let lastValidQA: string | null = null;
    const rawRecords = parsed.rawRecords ?? parsed.rows.map(() => ({}));

    if (updateReleaseTypesOnly) {
      // Update-only mode: match by feature_name, update release_type. No creates.
      for (let i = 0; i < parsed.rows.length; i++) {
        const rowNumber = i + 2;
        const r = parsed.rows[i];
        const rawRow = rawRecords[i] ?? {};
        const resolved = resolveFeatureAndLink(r);
        if (!resolved.feature_name && rawRow && Object.keys(rawRow).length > 0) {
          const fromRaw = extractFeatureFromRawRow(rawRow);
          if (fromRaw.feature_name) resolved.feature_name = fromRaw.feature_name;
        }
        const feature_name = trimOrEmpty(resolved.feature_name);
        if (!feature_name) {
          skippedEmpty++;
          continue;
        }
        const release_type: ReleaseType = detectReleaseType(r);
        const existingId = findFeatureIdByName(feature_name);
        if (existingId) {
          const updatedFeature = updateFeature(existingId, { release_type });
          if (updatedFeature) updated++;
        } else {
          notFound++;
        }
      }
      return NextResponse.json({
        updated,
        notFound,
        skippedEmpty,
        mode: "updateReleaseTypes",
      });
    }

    // Row numbers are 2-based because row 1 is header.
    for (let i = 0; i < parsed.rows.length; i++) {
      const rowNumber = i + 2;
      const r = parsed.rows[i];
      const rawRow = rawRecords[i] ?? {};

      let dev = trimOrEmpty(r.developer_name);
      let qa = trimOrEmpty(r.qa_name);
      if (dev) lastValidDeveloper = dev;
      else if (lastValidDeveloper) dev = lastValidDeveloper;
      if (qa) lastValidQA = qa;
      else if (lastValidQA) qa = lastValidQA;
      const resolved = resolveFeatureAndLink(r);
      if (!resolved.feature_name && rawRow && Object.keys(rawRow).length > 0) {
        const fromRaw = extractFeatureFromRawRow(rawRow);
        if (fromRaw.feature_name) resolved.feature_name = fromRaw.feature_name;
        if (fromRaw.brd_link) resolved.brd_link = fromRaw.brd_link;
      }
      const link = resolved.brd_link;

      const dateFromColumn = parseDateCell(r.release_date);
      const dateFromAnyCell = extractDateFromAnyCell(rawRow);
      if (dateFromAnyCell) lastValidDate = dateFromAnyCell;

      const hasContent = dev || qa || r.release_date || link || resolved.feature_name || r.feature_name;
      if (!hasContent) {
        skippedEmpty++;
        continue;
      }
      let release_date: string;
      if (dateFromColumn.ok) {
        release_date = dateFromColumn.value;
        lastValidDate = release_date;
      } else if (dateFromAnyCell) {
        release_date = dateFromAnyCell;
        lastValidDate = release_date;
      } else if (lastValidDate) {
        release_date = lastValidDate;
      } else {
        release_date = formatDateToISO(new Date());
      }
      const feature_name = resolveFeatureName(r, resolved, rawRow, release_date);

      // Skip invalid feature names: date-only, section labels, empty
      if (shouldSkipFeatureName(feature_name)) {
        skippedEmpty++;
        continue;
      }

      // Map developer and QA names (first-name matching, Two Gauravs, allowed QA only)
      const devResolved = resolveDeveloperName(dev, release_date);
      const qaResolved = resolveQAName(qa);

      // Deduping: prefer brd_link if present; else by feature_name
      if (link) {
        const existingId = findFeatureIdByBrdLink(link);
        if (existingId) {
          skippedDuplicates++;
          continue;
        }
      } else {
        const existingId = findFeatureIdByName(feature_name);
        if (existingId) {
          skippedDuplicates++;
          continue;
        }
      }

      const vertical = r.vertical ? normalizeVertical(r.vertical) : ("Operations" as Vertical);

      const input: FeatureInput = {
        feature_name,
        vertical,
        stakeholder_name: "Imported",
        developer_name: devResolved || undefined,
        qa_name: qaResolved.qa_name ?? undefined,
        reviewer_name: qaResolved.reviewer_name ?? undefined,
        release_date,
        brd_link: link,
        status: "Released" as FeatureStatus,
        release_type: detectReleaseType(r),
      };

      try {
        createFeature(input);
        inserted++;
      } catch (e) {
        errors.push({
          row: rowNumber,
          reason: e instanceof Error ? e.message : "Failed to insert row",
        });
      }
    }

    return NextResponse.json({
      inserted,
      skippedDuplicates,
      skippedEmpty,
      errors,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}

