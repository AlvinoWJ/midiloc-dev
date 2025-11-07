/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";

// GET /api/progress/[id]
// Mengembalikan detail KPLT dari progress_kplt.id (beserta ringkas branch & ulok)
// Response:
// {
//   data: {
//     kplt: {...},        // detail kplt
//     branch?: {...},     // ringkas
//     ulok?: {...},       // ringkas
//     meta: { progress_id, kplt_id }
//   }
// }
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const progressId = params?.id;
  if (!progressId) {
    return NextResponse.json(
      { error: "Invalid id", message: "Missing progress id" },
      { status: 422 }
    );
  }

  // Ambil progress -> kplt_id + branch scope
  const { data, error } = await supabase
    .from("progress_kplt")
    .select("id,kplt_id(*)")
    .eq("id", progressId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch progress_kplt", detail: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Not Found", message: "Progress not found" },
      { status: 404 }
    );
  }

  const kpltData = Array.isArray(data.kplt_id) ? data.kplt_id[0] : data.kplt_id;
  const kpltId: string | undefined = kpltData?.id;
  const branchId: string | undefined = kpltData?.branch_id;

  // Validasi scope cabang
  if (!branchId || branchId !== (user as any).branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "Progress out of branch scope" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      data: {
        data,
        meta: {
          progress_id: data.id,
          kplt_id: kpltId,
        },
      },
    },
    { status: 200 }
  );
}
