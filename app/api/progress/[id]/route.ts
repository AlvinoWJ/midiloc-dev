/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";

/*
  Single-query detail progress_kplt dengan embed:
    - kplt (ringkas + ulok ringkas)
    - izin_tetangga.final_status_it (melalui FK izin_tetangga.progress_kplt_id -> progress_kplt.id)

  GET /api/progress_kplt/[id]

  Response contoh:
  {
    success: true,
    data: {
      progress: {
        id,
        kplt_id,
        status,
        created_at,
        updated_at,
        kplt: { id, nama_kplt, branch_id, ulok_id, ulok: { id, nama_ulok } }
      },
      final_status_it: "DONE" | null
    }
  }

  Catatan:
  - Jika relasi FK unik (one-to-one) akan dikembalikan sebagai object tunggal oleh PostgREST.
  - Jika relasi tidak unik (one-to-many) maka izin_tetangga akan berupa array; kode di bawah menormalisasi keduanya.
  - Pastikan di Supabase sudah ada foreign key:
      ALTER TABLE public.izin_tetangga
        ADD CONSTRAINT izin_tetangga_progress_kplt_id_fkey
        FOREIGN KEY (progress_kplt_id) REFERENCES public.progress_kplt(id) ON DELETE CASCADE;
    (dan opsional unique constraint jika memang satu baris per progress_kplt)
*/

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!canProgressKplt("read", user)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }
  if (!user.branch_id) {
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const progressId = params?.id;
  if (!progressId) {
    return NextResponse.json(
      { success: false, error: "Bad Request", message: "Missing progress id" },
      { status: 422 }
    );
  }

  // Kolom progress_kplt yang ingin diambil (tambahkan jika perlu)
  const progressColumns = [
    "id",
    "kplt_id",
    "status",
    "created_at",
    "updated_at",
    // Tambah kolom lain jika ada misal: "note","started_at","completed_at"
  ].join(",");

  // Single query dengan embed:
  // - kplt:kplt_id(...) termasuk ulok:ulok_id(...)
  // - izin_tetangga(final_status_it) berdasarkan FK progress_kplt_id
  // Jika Supabase butuh nama constraint khusus untuk embed gunakan:
  // "izin_tetangga:izin_tetangga_progress_kplt_id_fkey(final_status_it)"
  const { data, error } = await supabase
    .from("progress_kplt")
    .select(
      [
        progressColumns,
        "kplt:kplt_id (*)",
        "izin_tetangga(final_status_it)",
      ].join(",")
    )
    .eq("id", progressId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch progress_kplt",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  if (!data || typeof data !== "object" || !("id" in data)) {
    return NextResponse.json(
      { success: false, error: "Not Found", message: "Progress not found" },
      { status: 404 }
    );
  }

  // Scope branch (opsional jika sudah dijaga oleh RLS)
  const branchId = (data as any)?.kplt?.branch_id;
  if (branchId && branchId !== user.branch_id) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden",
        message: "Progress out of branch scope",
      },
      { status: 403 }
    );
  }

  // Normalisasi izin_tetangga embed (object atau array)
  let finalStatusIt: string | null = null;
  const izinEmbed = (data as any).izin_tetangga;

  if (izinEmbed) {
    if (Array.isArray(izinEmbed)) {
      // Ambil baris pertama kalau banyak
      finalStatusIt = izinEmbed.length
        ? izinEmbed[0]?.final_status_it ?? null
        : null;
    } else {
      // Object tunggal
      finalStatusIt = izinEmbed.final_status_it ?? null;
    }
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        progress: {
          id: (data as any).id,
          kplt_id: (data as any).kplt_id,
          status: (data as any).status,
          created_at: (data as any).created_at,
          updated_at: (data as any).updated_at,
          kplt: (data as any).kplt,
        },
        final_status_it: finalStatusIt,
      },
    },
    { status: 200 }
  );
}
