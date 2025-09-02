import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/acl";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}