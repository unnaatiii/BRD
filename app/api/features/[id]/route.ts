import { NextResponse } from "next/server";
import { deleteFeature, getFeatureById, updateFeature } from "@/lib/db";
import type { FeatureInput } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feature = getFeatureById(parseInt(id, 10));
    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }
    return NextResponse.json(feature);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch feature" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteFeature(parseInt(id, 10));
    if (!deleted) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete feature" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<FeatureInput>;
    const feature = updateFeature(parseInt(id, 10), body);
    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }
    return NextResponse.json(feature);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update feature" },
      { status: 500 }
    );
  }
}
