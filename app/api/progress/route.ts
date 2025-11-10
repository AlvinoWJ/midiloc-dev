import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";

// GET /api/progress?page=1&per_page=10
export async function GET(req: Request) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canProgressKplt("read", user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const pageParam = searchParams.get("page");
  const perPageParam = searchParams.get("per_page");

  let page = Number(pageParam ?? 1);
  let per_page = Number(perPageParam ?? 10);

  // Normalisasi pagination
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(per_page) || per_page < 1) per_page = 10;
  if (per_page > 100) per_page = 100;

  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  // Ambil data progress_kplt dengan join kplt (ambil nama), dibatasi branch user
  // Ganti kplt(nama) jika nama kolomnya berbeda di tabel kplt Anda
  const { data, error, count } = await supabase
    .from("progress_kplt")
    .select(
      `
      id,
      created_at,
      updated_at,
      status,
      kplt_id (id,nama_kplt,latitude,longitude,alamat)
      `,
      { count: "exact" }
    )
    .eq("kplt_id.branch_id", user.branch_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load progress_kplt", detail: error.message ?? error },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  const total_pages = total > 0 ? Math.ceil(total / per_page) : 0;

  type ProgressRow = {
    id: string;
    created_at: string | null;
    updated_at: string | null;
    status: string | null;
    kplt_id: {
      id: string;
      nama_kplt: string | null;
    }[]; // kplt_id is an array due to Supabase join
  };

  const payload = (data ?? []).map((row: ProgressRow) => {
    // Supabase returns joined kplt_id as array, so extract first element if present
    const kpltObj =
      Array.isArray(row.kplt_id) && row.kplt_id.length > 0
        ? row.kplt_id[0]
        : null;
    return {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.status,
      kplt_id: row.kplt_id,
      kplt_nama: kpltObj?.nama_kplt ?? null,
    };
  });

  const res = NextResponse.json(
    {
      data: payload,
      meta: {
        page,
        per_page,
        total,
        total_pages,
      },
    },
    { status: 200 }
  );

  // Header pagination ala PostgREST/Supabase
  // Content-Range: "<from>-<to>/<total>"
  const last = total === 0 ? 0 : Math.min(to, total - 1);
  res.headers.set("X-Total-Count", String(total));
  res.headers.set("Content-Range", `${from}-${last}/${total}`);
  res.headers.set("Accept-Ranges", "items");

  return res;
}
