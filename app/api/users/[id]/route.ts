import { NextResponse } from "next/server";
import { deleteUser } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteUser(parseInt(id, 10));
    return deleted
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
