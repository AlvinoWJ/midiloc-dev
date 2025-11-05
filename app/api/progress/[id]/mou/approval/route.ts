import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { MouApprovalSchema } from "@/lib/validations/mou";

// PATCH /api/progress/[id]/mou/approval
// - id = progress_kplt_id
// - Body hanya boleh berisi { final_status_mou: string }
// - Server akan mengisi tgl_selesai = now() ISO dan updated_at = now() ISO

const REQUIRED_FIELDS_FOR_APPROVAL = [
  "tanggal_mou",
  "nama_pemilik_final",
  "periode_sewa",
  "nilai_sewa",
  "status_pajak",
  "pembayaran_pph",
  "cara_pembayaran",
  "grace_period",
  "harga_final",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findMissingRequiredFields(mou: Record<string, any>) {
  const missing: string[] = [];
  for (const key of REQUIRED_FIELDS_FOR_APPROVAL) {
    const val = mou?.[key];
    if (
      val === null ||
      val === undefined ||
      (typeof val === "string" && val.trim() === "")
    ) {
      missing.push(key);
    }
  }
  return missing;
}

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

  // Ambil MOU dalam scope cabang user + field yang dibutuhkan untuk verifikasi completeness
  const { data: target, error: findErr } = await supabase
    .from("mou")
    .select(
      `
      id,
      final_status_mou,
      tanggal_mou,
      nama_pemilik_final,
      periode_sewa,
      nilai_sewa,
      status_pajak,
      pembayaran_pph,
      cara_pembayaran,
      grace_period,
      harga_final,
      keterangan,
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
  if (target.final_status_mou && target.final_status_mou !== "Belum") {
    return NextResponse.json(
      { error: "MOU already finalized", status: target.final_status_mou },
      { status: 409 }
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const missing = findMissingRequiredFields(target as any);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Cannot approve: required fields are missing",
        missing_fields: missing,
      },
      { status: 422 }
    );
  }

  const nowIso = new Date().toISOString();

  // Set hanya field approval + timestamps dari server
  const payload = {
    final_status_mou: parsed.data.final_status_mou, // "Selesai" | "Batal"
    tgl_selesai_mou: nowIso, // jika ingin set hanya saat status final, kondisikan di sini
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
