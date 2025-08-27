import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { UlokUpdateSchema } from "@/lib/validations/ulok";

// GET /api/ulok/:id
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;

  const { data, error } = await supabase
    .from("ulok")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/ulok/:id
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationResult = UlokUpdateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.issues },
      { status: 422 }
    );
  }

  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData?.user?.id ?? null;

  const updateData = {
    ...validationResult.data, // sudah normalisasi tanggal/timestamp via schema
    updated_at: new Date().toISOString(),
    updated_by: validationResult.data.updated_by ?? authUserId ?? null,
  };

  const { data, error } = await supabase
    .from("ulok")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/ulok/:id
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;

  const { error } = await supabase.from("ulok").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
