import { NextResponse } from "next/server";
import { getAllFeatures, createFeature } from "@/lib/db";
import type { FeatureInput } from "@/lib/types";

export async function GET() {
  try {
    const features = getAllFeatures();
    return NextResponse.json(features);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch features" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeatureInput;
    const feature = createFeature(body);
    return NextResponse.json(feature);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create feature" },
      { status: 500 }
    );
  }
}
