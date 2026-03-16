/**
 * Safe cleanup script: fix developer/QA mapping from Excel imports.
 *
 * TWO PHASES:
 * 1. PREVIEW (default): Scan and report planned changes — NO database writes.
 * 2. EXECUTE: Only after user types "yes" to confirm.
 *
 * Run from brds/ directory: npx tsx scripts/cleanup-import-mapping-safe.ts
 *
 * DO NOT modify: feature names, release dates, verticals, status, success %, dashboard metrics.
 */
import * as readline from "readline";
import {
  deleteUser,
  getFeatureById,
  getAllFeatures,
  getAllUsers,
  moveQAToReviewer,
  updateDeveloperByDate,
  updateFeature,
  updateFeaturesDeveloperName,
  updateFeaturesQAName,
} from "../lib/db";
import { ALLOWED_QA_NAMES, splitMultipleDevelopers } from "../lib/import-mapping";

const GAURAV_CUTOFF = "2025-01-25";
const OLD_GAURAV = "Gaurav";
const NEW_GAURAV = "Gaurav (Intern)";

type Preview = {
  developerFixes: Array<{ from: string; to: string; count: number }>;
  qaFixes: Array<{ from: string; to: string; count: number }>;
  invalidQA: Array<{ name: string; count: number }>;
  multiDeveloper: Array<{ featureId: number; featureName: string; developers: string[] }>;
  usersToDelete: string[];
  gauravSplit: { before: number; after: number } | null;
};

function collectPreview(): Preview {
  const features = getAllFeatures();
  const users = getAllUsers();

  const developerFixes: Preview["developerFixes"] = [];
  const qaFixes: Preview["qaFixes"] = [];
  const invalidQA: Preview["invalidQA"] = [];
  const multiDeveloper: Preview["multiDeveloper"] = [];
  const usersToDelete: string[] = [];
  let gauravSplit: Preview["gauravSplit"] = null;

  const devMaps: [string, string][] = [
    ["Abhishek", "Abhishek Raj"],
    ["Navdeep", "Navdeep Rana"],
  ];

  for (const [from, to] of devMaps) {
    const count = features.filter((f) => f.developer_name === from).length;
    if (count > 0) developerFixes.push({ from, to, count });
  }

  const gauravFeatures = features.filter((f) => f.developer_name === "Gaurav");
  if (gauravFeatures.length > 0) {
    const before = gauravFeatures.filter(
      (f) => f.release_date && f.release_date < GAURAV_CUTOFF
    ).length;
    const after = gauravFeatures.filter(
      (f) => !f.release_date || f.release_date >= GAURAV_CUTOFF
    ).length;
    gauravSplit = { before, after };
  }

  const qaAbhishekCount = features.filter((f) => f.qa_name === "Abhishek").length;
  if (qaAbhishekCount > 0) {
    qaFixes.push({ from: "Abhishek", to: "Abhishek Pandey", count: qaAbhishekCount });
  }

  const qaNames = new Map<string, number>();
  for (const f of features) {
    if (!f.qa_name) continue;
    const allowed = ALLOWED_QA_NAMES.some((a) => a.toLowerCase() === f.qa_name?.toLowerCase());
    if (!allowed) {
      qaNames.set(f.qa_name, (qaNames.get(f.qa_name) ?? 0) + 1);
    }
  }
  for (const [name, count] of qaNames) {
    invalidQA.push({ name, count });
  }

  for (const f of features) {
    if (!f.developer_name) continue;
    const parts = splitMultipleDevelopers(f.developer_name);
    if (parts.length > 1) {
      multiDeveloper.push({ featureId: f.id, featureName: f.feature_name, developers: parts });
    }
  }

  for (const u of users) {
    if (u.role !== "Developer") continue;
    const name = u.name;
    if (name === "Abhishek" || name === "Navdeep") {
      if (developerFixes.some((d) => d.from === name)) {
        usersToDelete.push(name);
      } else {
        const featureCount = features.filter((f) => f.developer_name === name).length;
        if (featureCount === 0) usersToDelete.push(name);
      }
    }
  }

  return {
    developerFixes,
    qaFixes,
    invalidQA,
    multiDeveloper,
    usersToDelete,
    gauravSplit,
  };
}

function printPreview(p: Preview): void {
  console.log("\nDeveloper Fixes");
  console.log("----------------");
  if (p.developerFixes.length === 0 && !p.gauravSplit) {
    console.log("(none)");
  } else {
    for (const { from, to, count } of p.developerFixes) {
      console.log(`${from} → ${to} (${count} features will move)`);
    }
    if (p.gauravSplit && (p.gauravSplit.before > 0 || p.gauravSplit.after > 0)) {
      console.log(
        `Gaurav → split: ${p.gauravSplit.before} to ${OLD_GAURAV} (before ${GAURAV_CUTOFF}), ${p.gauravSplit.after} to ${NEW_GAURAV}`
      );
    }
  }

  console.log("\nQA Fixes");
  console.log("--------");
  if (p.qaFixes.length === 0) {
    console.log("(none)");
  } else {
    for (const { from, to, count } of p.qaFixes) {
      console.log(`${from} → ${to} (${count} features)`);
    }
  }

  console.log("\nInvalid QA Users Found");
  console.log("----------------------");
  if (p.invalidQA.length === 0) {
    console.log("(none)");
  } else {
    for (const { name, count } of p.invalidQA) {
      console.log(`${name} (${count} features) → will move to reviewer_name`);
    }
  }

  console.log("\nMultiple Developer Assignments");
  console.log("------------------------------");
  if (p.multiDeveloper.length === 0) {
    console.log("(none)");
  } else {
    for (const { featureName, developers } of p.multiDeveloper) {
      console.log(`Feature: "${featureName}"`);
      console.log(`  Developers detected: ${developers.join(", ")}`);
      console.log(`  Feature will be assigned to both developers (comma-separated).`);
    }
  }

  console.log("\nOld Users To Be Deleted");
  console.log("-----------------------");
  if (p.usersToDelete.length === 0) {
    console.log("(none)");
  } else {
    for (const name of p.usersToDelete) {
      console.log(name);
    }
  }
}

function hasChanges(p: Preview): boolean {
  return (
    p.developerFixes.length > 0 ||
    (p.gauravSplit !== null &&
      p.gauravSplit !== undefined &&
      (p.gauravSplit.before > 0 || p.gauravSplit.after > 0)) ||
    p.qaFixes.length > 0 ||
    p.invalidQA.length > 0 ||
    p.usersToDelete.length > 0 ||
    p.multiDeveloper.length > 0
  );
}

function execute(p: Preview): void {
  for (const { from, to } of p.developerFixes) {
    const n = updateFeaturesDeveloperName(from, to);
    if (n > 0) console.log(`[Dev] Remapped "${from}" → "${to}": ${n} features`);
  }

  if (p.gauravSplit && (p.gauravSplit.before > 0 || p.gauravSplit.after > 0)) {
    const result = updateDeveloperByDate("Gaurav", GAURAV_CUTOFF, OLD_GAURAV, NEW_GAURAV);
    console.log(
      `[Gaurav] Split: ${result.before} → ${OLD_GAURAV}, ${result.after} → ${NEW_GAURAV}`
    );
  }

  for (const { from, to } of p.qaFixes) {
    const n = updateFeaturesQAName(from, to);
    if (n > 0) console.log(`[QA] Remapped "${from}" → "${to}": ${n} features`);
  }

  for (const { name } of p.invalidQA) {
    const n = moveQAToReviewer(name);
    if (n > 0) console.log(`[QA] Moved "${name}" to reviewer_name: ${n} features`);
  }

  for (const { featureId, developers } of p.multiDeveloper) {
    const feature = getFeatureById(featureId);
    if (!feature) continue;
    const resolved = developers.map((d) => {
      const firstName = d.split(/\s+/)[0] ?? d;
      if (firstName.toLowerCase() === "gaurav") {
        if (feature.release_date && feature.release_date >= GAURAV_CUTOFF)
          return NEW_GAURAV;
        return OLD_GAURAV;
      }
      if (firstName === "Abhishek") return "Abhishek Raj";
      if (firstName === "Navdeep") return "Navdeep Rana";
      return d;
    });
    const newDev = [...new Set(resolved)].join(", ");
    if (newDev !== feature.developer_name) {
      updateFeature(feature.id, { developer_name: newDev });
      console.log(`[Multi] "${feature.feature_name}": ${feature.developer_name} → ${newDev}`);
    }
  }

  const users = getAllUsers();
  const featuresAfter = getAllFeatures();
  for (const name of p.usersToDelete) {
    const u = users.find((u) => u.name === name && u.role === "Developer");
    if (!u) continue;
    const stillUsed = featuresAfter.some((f) => f.developer_name === name);
    if (!stillUsed && deleteUser(u.id)) {
      console.log(`[User] Deleted duplicate user: ${name}`);
    }
  }
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "yes");
    });
  });
}

async function main() {
  console.log("=== Cleanup Import Mapping (Safe Mode) ===\n");
  console.log("Phase 1: PREVIEW — scanning database (no changes made)\n");

  const preview = collectPreview();
  printPreview(preview);

  if (!hasChanges(preview)) {
    console.log("\nNo changes needed. Database is already clean.");
    return;
  }

  console.log("\n------------------------------------------");
  const ok = await confirm("\nApply these changes? (yes/no): ");

  if (!ok) {
    console.log("\nAborted. No changes were made.");
    return;
  }

  console.log("\nPhase 2: EXECUTING changes...\n");
  execute(preview);
  console.log("\nDone.");
}

main().catch(console.error);
