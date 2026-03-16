import { NextResponse } from "next/server";
import { getFeaturesByDeveloper } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const decoded = decodeURIComponent(name);
    const features = getFeaturesByDeveloper(decoded);
    return NextResponse.json(features);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch developer features" },
      { status: 500 }
    );
  }
}
