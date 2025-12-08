import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { KpltIdParamSchema } from "@/lib/validations/kplt-approval";

// Memastikan route ini selalu dieksekusi secara dinamis (tidak di-cache)
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * @route GET /api/kplt/[id]
 * @description Mengambil detail data KPLT (Komitmen Penggunaan Lahan Toko) menggunakan RPC database.
 * @access Private (Memerlukan login, branch, dan permission 'read')
 * @param {string} id - UUID dari KPLT
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth & Permission Check
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Harap login terlebih dahulu" },
        { status: 401 }
      );
    }

    if (!canKplt("read", user)) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki hak akses" },
        { status: 403 }
      );
    }

    if (!user.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: User tidak terasosiasi dengan cabang mana pun" },
        { status: 403 }
      );
    }

    // 2. Validate Params (UUID Check)
    const parsed = KpltIdParamSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid ID format", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // 3. Execute RPC (Stored Procedure)
    // Logika query dipertahankan menggunakan RPC sesuai kebutuhan bisnis
    const { data, error } = await supabase.rpc("fn_kplt_detail", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_kplt_id: parsed.data.id,
    });

    if (error) {
      console.error("[API_KPLT_DETAIL] RPC Error:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan internal saat mengambil data KPLT" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Data KPLT tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[API_KPLT_DETAIL] Unhandled Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
