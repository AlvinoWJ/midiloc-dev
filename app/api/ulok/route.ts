import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { UlokCreateSchema } from "@/lib/validations/ulok";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";


// GET /api/ulok?page=1&limit=10
export async function GET(request: Request) {

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Wajib punya branch_id agar bisa lihat data per-branch
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden: user has no branch" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Bangun query dengan filter branch
  let query = supabase
    .from("ulok")
    .select("*", { count: "exact" })
    .eq("branch_id", user.branch_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  // Jika role adalah location specialist, tambahkan filter created_by=dirinya
  if (user.position_nama === "location specialist") {
    query = query.eq("users_id", user.id);
  }

  const { data, error, count } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    user,
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

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("create", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
