import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";

const UlokIdSchema = z.string().trim().uuid();

export async function GET(_request: NextRequest) {
  // 1. Ambil raw param & trim
  const rawParam = _request.nextUrl.searchParams.get("ulok_id") ?? "";
  const trimmed = rawParam.trim();

  // 2. Validasi UUID
  const parsed = UlokIdSchema.safeParse(trimmed);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid ulok_id",
        received: rawParam,
        detail: parsed.error.issues,
        debug_chars: [...rawParam].map((c) => `${c}(${c.charCodeAt(0)})`),
      },
      { status: 422 }
    );
  }
  const ulokId = parsed.data;

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("fn_kplt_prefill", {
    p_ulok_id: ulokId,
  });
  if (error) {
    return NextResponse.json(
      { error: "Prefill failed", detail: error.message },
      { status: 500 }
    );
  }
  if (!data || !data.base) {
    return NextResponse.json(
      { error: "ULOK not found", ulok_id: ulokId },
      { status: 404 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
