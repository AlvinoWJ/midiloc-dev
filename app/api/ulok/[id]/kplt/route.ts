/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { KpltCreateSchema } from "@/lib/validations/kplt";

// POST /api/ulok/:ulok_id/kplt
// Buat KPLT untuk ULOK tertentu (ulok_id dari path param)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("create", user)) {
    return NextResponse.json(
      { error: "Forbidden", message: "Access denied" },
      { status: 403 }
    );
  }
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  // Validasi ulok_id dari URL
  // ganti validasi ulok_id
  const UlokIdSchema = z.string().min(1); // jika bukan UUID
  const ulokIdParse = UlokIdSchema.safeParse(params.id);
  if (!ulokIdParse.success) {
    return NextResponse.json(
      {
        message: "Validasi gagal",
        error: [
          { path: ["ulok_id"], message: "ulok_id harus UUID yang valid" },
        ],
      },
      { status: 422 }
    );
  }
  const ulok_id = ulokIdParse.data;

  // Validasi body (opsional field-field kplt)
  const body = await request.json().catch(() => ({} as any));
  const fieldsParse = KpltCreateSchema.safeParse(body);
  if (!fieldsParse.success) {
    return NextResponse.json(
      { message: "Validasi gagal", error: fieldsParse.error.issues },
      { status: 422 }
    );
  }
  const kpltFields = fieldsParse.data;

  // 1) Cek ULOK ada, status OK, dan scope role
  let ulokRow: any | null = null;

  if (user.position_nama === "location specialist") {
    const { data, error } = await supabase
      .from("ulok")
      .select("id, approval_status, branch_id, users_id")
      .eq("id", ulok_id)
      .eq("users_id", user.id)
      .single();

    if (error || !data)
      return NextResponse.json({ error: "ULOK not found" }, { status: 404 });
    if (data.approval_status !== "OK") {
      return NextResponse.json(
        { error: "ULOK is not approved (OK)" },
        { status: 400 }
      );
    }
    ulokRow = data;
  } else if (user.position_nama === "location manager") {
    const { data, error } = await supabase
      .from("ulok")
      .select("id, approval_status, branch_id")
      .eq("id", ulok_id)
      .eq("branch_id", user.branch_id)
      .single();

    if (error || !data)
      return NextResponse.json({ error: "ULOK not found" }, { status: 404 });
    if (data.approval_status !== "OK") {
      return NextResponse.json(
        { error: "ULOK is not approved (OK)" },
        { status: 400 }
      );
    }
    ulokRow = data;
  } else {
    return NextResponse.json(
      { error: "Forbidden for your role" },
      { status: 403 }
    );
  }

  // 2) Cek KPLT existing untuk ulok
  const { data: existing, error: existErr } = await supabase
    .from("kplt")
    .select("id")
    .eq("ulok_id", ulok_id)
    .maybeSingle();

  if (existErr && (existErr as any)?.code !== "PGRST116") {
    return NextResponse.json(
      {
        error: "Failed to check existing KPLT",
        detail: existErr?.message ?? existErr,
      },
      { status: 500 }
    );
  }
  if (existing) {
    return NextResponse.json(
      { error: "KPLT already exists for this ULOK" },
      { status: 409 }
    );
  }

  // 3) Insert
  const now = new Date().toISOString();
  const insertPayload = {
    ulok_id,
    branch_id: ulokRow.branch_id ?? user.branch_id,
    kplt_approval: "In Progress",
    updated_at: now,
    updated_by: user.id,
    ...kpltFields,
    is_active: (kpltFields as any).is_active ?? true,
  };

  const { data: created, error: createErr } = await supabase
    .from("kplt")
    .insert(insertPayload)
    .select("*")
    .single();

  if (createErr) {
    if ((createErr as any)?.code === "23505") {
      return NextResponse.json(
        { error: "Conflict", message: "Duplicate KPLT" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Create KPLT failed", detail: createErr?.message ?? createErr },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { data: created, message: "Data KPLT berhasil dibuat" },
    { status: 201 }
  );
}
