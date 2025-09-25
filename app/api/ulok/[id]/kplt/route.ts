import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { KpltCreatePayloadSchema } from "@/lib/validations/kplt";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("create", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;
  // Validasi UUID sederhana
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Invalid ulok_id" }, { status: 422 });
  }

  const json = await req.json().catch(() => null);
  const parsed = KpltCreatePayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );
  }

  // Panggil RPC
  const { data, error } = await supabase.rpc("fn_kplt_create_from_ulok", {
    p_user_id: user.id,
    p_ulok_id: id,
    p_payload: parsed.data,
  });

  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (error as any).code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "KPLT already exists for this ULOK" },
        { status: 409 }
      );
    }
    if (code === "22023") {
      return NextResponse.json(
        { error: "Invalid request", detail: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
