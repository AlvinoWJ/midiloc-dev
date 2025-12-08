import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import {
  checkAuthAndAccess,
  handleCommonError,
} from "@/lib/progress/api-helper";
export const dynamic = "force-dynamic";

/**
 * @route GET /api/progress/[id]/perizinan/history
 * @description Mengambil riwayat perubahan (history) data Perizinan.
 * Menggunakan RPC `fn_perizinan_history_list`.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth & Access Check
    const authErr = await checkAuthAndAccess(supabase, user, id, "read");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Fetch History Data via RPC
    const { data, error } = await supabase.rpc("fn_perizinan_history_list", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
    });

    if (error) {
      return handleCommonError(error, "PERIZINAN_HISTORY_GET");
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return handleCommonError(err, "PERIZINAN_HISTORY_UNHANDLED");
  }
}
