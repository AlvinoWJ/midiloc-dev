import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { MouApprovalSchema } from "@/lib/validations/mou";

// PATCH /api/progress/[id]/mou/approval
// - id = progress_kplt_id
// - Body hanya boleh berisi { final_status_mou: string }
// - Server akan mengisi tgl_selesai = now() ISO dan updated_at = now() ISO
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const body = await req.json().catch(() => ({}));

  // Validasi: hanya final_status_mou yang diperbolehkan
  const parsed = MouApprovalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );
  }

  // Cari target MOU yang berada dalam branch user (join bertingkat)
  const { data: target, error: findErr } = await supabase
    .from("mou")
    .select(
      `
      id,
      progress_kplt:progress_kplt!mou_progress_kplt_id_fkey!inner (
        id,
        kplt:kplt!progress_kplt_kplt_id_fkey!inner ( id, branch_id )
      )
      `
    )
    .eq("progress_kplt_id", progressId)
    .eq("progress_kplt.kplt.branch_id", user.branch_id)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json(
      { error: "Failed to find MOU", detail: findErr.message ?? findErr },
      { status: 500 }
    );
  }
  if (!target) {
    return NextResponse.json(
      { error: "MOU not found for this progress or out of scope" },
      { status: 404 }
    );
  }

  const nowIso = new Date().toISOString();

  // Set hanya field approval + timestamps dari server
  const payload = {
    final_status_mou: parsed.data.final_status_mou, // "Selesai" | "Batal"
    tgl_selesai: nowIso, // jika ingin set hanya saat status final, kondisikan di sini
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("mou")
    .update(payload)
    .eq("id", target.id)
    .select("*")
    .single();

  if (error) {
    // Jika gagal karena enum invalid, kembalikan 422
    type SupabaseError = { message?: string; code?: string };
    const supabaseError = error as SupabaseError;
    const msg = supabaseError?.message ?? "";
    const code = supabaseError?.code ?? "";
    const isEnumErr =
      code === "22P02" || /invalid input value for enum/i.test(msg);
    return NextResponse.json(
      {
        error: isEnumErr
          ? "Invalid final_status_mou value"
          : "Failed to approve MOU",
        detail: msg || error,
      },
      { status: isEnumErr ? 422 : 500 }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}
