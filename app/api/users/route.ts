import { NextResponse } from "next/server";
import { getAllUsers, createUser } from "@/lib/db";
import type { UserRole } from "@/lib/types";

export async function GET() {
  try {
    const users = getAllUsers();
    return NextResponse.json(users);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name: string; role: UserRole };
    if (!body.name?.trim() || !body.role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
    }
    const user = createUser(body.name.trim(), body.role);
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create user" },
      { status: 500 }
    );
  }
}
