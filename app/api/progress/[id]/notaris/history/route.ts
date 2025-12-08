import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import {
  checkAuthAndAccess,
  handleCommonError,
} from "@/lib/progress/api-helper";

export const dynamic = "force-dynamic";

/**
 * @route GET /api/progress/[id]/notaris/history
 * @description Mengambil riwayat perubahan (history) data Notaris.
 * Menggunakan RPC `fn_notaris_history_list`.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth & Access Check
    // Permission 'read' cukup untuk melihat history
    const authErr = await checkAuthAndAccess(supabase, user, params.id, "read");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Fetch History Data via RPC
    const { data, error } = await supabase.rpc("fn_notaris_history_list", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
    });

    if (error) {
      // Spesifik handling untuk error code RPC jika ada
      return handleCommonError(error, "NOTARIS_HISTORY_GET");
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return handleCommonError(err, "NOTARIS_HISTORY_UNHANDLED");
  }
}
