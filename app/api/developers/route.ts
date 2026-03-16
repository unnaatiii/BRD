import { NextResponse } from "next/server";
import { getAllFeatures, getUsersByRole } from "@/lib/db";

export async function GET() {
  try {
    const features = getAllFeatures();
    const fromFeatures = new Set<string>();
    features.forEach((f) => {
      (f.developer_name ?? "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((n) => fromFeatures.add(n));
    });
    getUsersByRole("Developer").forEach((u) => fromFeatures.add(u.name));
    const developers = [...fromFeatures].sort();
    return NextResponse.json(developers);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch developers" },
      { status: 500 }
    );
  }
}
