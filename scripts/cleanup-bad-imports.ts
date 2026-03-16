/**
 * One-time script: delete features created by the broken import.
 * Removes features whose feature_name starts with "Imported - Release"
 * (the fallback name when no real feature name was found).
 *
 * Run from brds/ directory: npx tsx scripts/cleanup-bad-imports.ts
 */
import { deleteFeaturesWhereFeatureNameLike } from "../lib/db";

const deleted = deleteFeaturesWhereFeatureNameLike("Imported - Release%");
console.log(`Deleted ${deleted} features with malformed "Imported - Release..." names.`);
