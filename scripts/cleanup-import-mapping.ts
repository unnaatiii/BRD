/**
 * Cleanup script: fix developer/QA mapping and remove date-only features.
 *
 * 1. Delete features where feature_name is only a date (DD/MM/YYYY)
 * 2. Remap developers: Abhishek → Abhishek Raj, Navdeep → Navdeep Rana
 * 3. Two Gauravs: before 25 Jan 2025 → Gaurav (old), on/after → Gaurav (Intern)
 * 4. Move non-allowed QA names to reviewer_name (only Bhavesh, Unnati, Abhishek Pandey allowed)
 *
 * Run from brds/ directory: npx tsx scripts/cleanup-import-mapping.ts
 *
 * DO NOT modify: feature data, release dates, verticals, status, success %
 */
import {
  deleteDateOnlyFeatures,
  getAllFeatures,
  moveQAToReviewer,
  updateDeveloperByDate,
  updateFeaturesDeveloperName,
  updateFeaturesQAName,
  updateFeaturesReviewerToQA,
} from "../lib/db";
import { ALLOWED_QA_NAMES } from "../lib/import-mapping";

const GAURAV_CUTOFF = "2025-01-25";

function main() {
  let dateDeleted = 0;
  let devRemapped = 0;
  let qaMoved = 0;

  // 1. Delete date-only features
  dateDeleted = deleteDateOnlyFeatures();
  console.log(`[1] Deleted ${dateDeleted} date-only feature(s) (e.g. 16/01/2025)`);

  // 2. Developer remapping (first-name → canonical)
  const developerMaps: [string, string][] = [
    ["Abhishek", "Abhishek Raj"],
    ["Navdeep", "Navdeep Rana"],
  ];
  for (const [from, to] of developerMaps) {
    const n = updateFeaturesDeveloperName(from, to);
    if (n > 0) {
      console.log(`[2] Remapped developer "${from}" → "${to}": ${n} feature(s)`);
      devRemapped += n;
    }
  }

  // 3. Two Gauravs: by release_date
  const gaurav = updateDeveloperByDate("Gaurav", GAURAV_CUTOFF, "Gaurav", "Gaurav (Intern)");
  if (gaurav.before > 0 || gaurav.after > 0) {
    console.log(
      `[3] Gaurav split: ${gaurav.before} → Gaurav (before ${GAURAV_CUTOFF}), ${gaurav.after} → Gaurav (Intern)`
    );
    devRemapped += gaurav.before + gaurav.after;
  }

  // 4a. QA remap: Abhishek → Abhishek Pandey (special case)
  const qaAbhishek = updateFeaturesQAName("Abhishek", "Abhishek Pandey");
  if (qaAbhishek > 0) {
    console.log(`[4a] Remapped QA "Abhishek" → "Abhishek Pandey": ${qaAbhishek} feature(s)`);
  }

  // 4a-fix. Restore qa_name from reviewer_name when reviewer was "Abhishek" (fix-up for prior runs)
  const fixAbhishek = updateFeaturesReviewerToQA("Abhishek", "Abhishek Pandey");
  if (fixAbhishek > 0) {
    console.log(`[4a-fix] Restored QA from reviewer "Abhishek" → "Abhishek Pandey": ${fixAbhishek}`);
  }

  // 4b. QA: move non-allowed names to reviewer_name
  const features = getAllFeatures();
  const qaNames = new Set(features.map((f) => f.qa_name).filter(Boolean)) as Set<string>;
  for (const qa of qaNames) {
    if (!qa) continue;
    const allowed = ALLOWED_QA_NAMES.some(
      (a) => a.toLowerCase() === qa.toLowerCase()
    );
    if (!allowed) {
      const n = moveQAToReviewer(qa);
      if (n > 0) {
        console.log(`[4] Moved QA "${qa}" to reviewer_name: ${n} feature(s)`);
        qaMoved += n;
      }
    }
  }

  console.log("\nDone. Summary:");
  console.log(`  Date-only features deleted: ${dateDeleted}`);
  console.log(`  Developer remaps: ${devRemapped}`);
  console.log(`  QA moved to reviewer: ${qaMoved}`);
}

main();
