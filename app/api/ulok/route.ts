import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { UlokCreateSchema } from "@/lib/validations/ulok";
// import crypto from "crypto";

// GET /api/ulok?page=1&limit=10
export async function GET(request: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("ulok")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  });
}

// POST /api/ulok
export async function POST(request: Request) {
  const supabase = await createClient();

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationResult = UlokCreateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.issues },
      { status: 422 }
    );
  }

  // Ambil user sesi (RLS akan menegakkan policy sebagai user)
  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData?.user?.id ?? null;

//   const id = crypto.randomUUID();

  const insertData = {
    // id,
    ...validationResult.data,
    // Opsional: jika Anda ingin created_by diisi otomatis dengan auth user id
    // pastikan mapping id auth == users.id Anda
    created_by: validationResult.data.created_by ?? authUserId ?? null,
  };

  const { data, error } = await supabase
    .from("ulok")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
