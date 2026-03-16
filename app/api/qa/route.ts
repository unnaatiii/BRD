import { NextResponse } from "next/server";
import { getAllFeatures, getUsersByRole } from "@/lib/db";
import { ALLOWED_QA_NAMES } from "@/lib/import-mapping";

export async function GET() {
  try {
    const features = getAllFeatures();
    const fromFeatures = new Set(features.map((f) => f.qa_name).filter(Boolean)) as Set<string>;
    getUsersByRole("QA").forEach((u) => fromFeatures.add(u.name));
    const allowed = new Set(ALLOWED_QA_NAMES.map((n) => n.toLowerCase()));
    const qaNames = [...fromFeatures]
      .filter((name) => allowed.has(name.toLowerCase()))
      .sort();
    return NextResponse.json(qaNames);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch QA list" },
      { status: 500 }
    );
  }
}
