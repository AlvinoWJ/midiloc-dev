/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import {
  ITCreateSchema,
  ITUpdateSchema,
  stripServerControlledFieldsIT,
} from "@/lib/validations/izin_tetangga";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";
import {
  checkAuthAndAccess,
  resolveUlokId,
  parseMultipartRequest,
  removeFiles,
  handleCommonError,
} from "@/lib/progress/api-helper";

export const dynamic = "force-dynamic";

const FILE_FIELDS = ["file_izin_tetangga", "file_bukti_pembayaran"] as const;

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * @route GET /api/progress/[id]/izin_tetangga
 * @description Mengambil detail data Izin Tetangga.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // Auth Check
    const authErr = await checkAuthAndAccess(supabase, user, id, "read");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // Fetch Data
    const { data, error } = await supabase.rpc("fn_it_get", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
    });

    if (error) return handleCommonError(error, "IT_GET");
    if (!data)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[IT_GET_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/progress/[id]/izin_tetangga
 * @description Membuat data Izin Tetangga baru (Multipart/JSON).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  let uploadedKeys: string[] = [];

  try {
    const user = await getCurrentUser();
    const authErr = await checkAuthAndAccess(supabase, user, id, "create");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // Validate Access
    const check = await validateProgressAccess(supabase, user, id);
    if (!check.allowed)
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );

    const ulokId = await resolveUlokId(supabase, id, user!.branch_id!);

    // Parse Multipart
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};

    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartRequest(supabase, req, {
        ulokId,
        moduleName: "izin_tetangga",
        fileFields: FILE_FIELDS,
      });
      payload = parsed.payload;
      uploadedKeys = parsed.uploadedKeys;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = ITCreateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsIT(parsed.data);
    }

    // Execute RPC
    const { data, error } = await supabase.rpc("fn_it_create", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
      p_payload: payload,
    });

    if (error) {
      await removeFiles(supabase, uploadedKeys);
      return handleCommonError(error, "IT_CREATE");
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    await removeFiles(supabase, uploadedKeys);
    return handleCommonError(err, "IT_POST_UNHANDLED");
  }
}

/**
 * @route PATCH /api/progress/[id]/izin_tetangga
 * @description Mengupdate data Izin Tetangga (Multipart/JSON).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  let uploadedKeys: string[] = [];

  try {
    //auth check
    const user = await getCurrentUser();
    const authErr = await checkAuthAndAccess(supabase, user, id, "update");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // Pre-fetch old data for cleanup
    const ulokId = await resolveUlokId(supabase, id, user!.branch_id!);

    const { data: oldRow, error: getErr } = await supabase.rpc("fn_it_get", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
    });

    if (getErr || !oldRow)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    // Parse
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};
    let fieldsToCheck: string[] = [];

    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartRequest(supabase, req, {
        ulokId,
        moduleName: "izin_tetangga",
        fileFields: FILE_FIELDS,
      });
      payload = parsed.payload;
      uploadedKeys = parsed.uploadedKeys;
      fieldsToCheck = parsed.fileFieldsFound;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = ITUpdateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsIT(parsed.data);
      fieldsToCheck = FILE_FIELDS.filter((f) =>
        Object.prototype.hasOwnProperty.call(payload, f)
      );
    }

    // Execute RPC
    const { data, error } = await supabase.rpc("fn_it_update", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
      p_payload: payload,
    });

    if (error) {
      await removeFiles(supabase, uploadedKeys);
      return handleCommonError(error, "IT_UPDATE");
    }

    // Cleanup Old Files
    const keysToDelete: string[] = [];
    for (const f of fieldsToCheck) {
      const prev = (oldRow as any)?.[f];
      const now = (payload as any)?.[f];
      if (prev && typeof prev === "string" && prev !== now)
        keysToDelete.push(prev);
    }
    await removeFiles(supabase, keysToDelete);

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    await removeFiles(supabase, uploadedKeys);
    return handleCommonError(err, "IT_PATCH_UNHANDLED");
  }
}

/**
 * @route DELETE /api/progress/[id]/izin_tetangga
 * @description Menghapus data Izin Tetangga dan file terkait.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // Auth Check
    const authErr = await checkAuthAndAccess(supabase, user, id, "delete");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // Get Old Data (for cleanup)
    const { data: oldRow, error: getErr } = await supabase.rpc("fn_it_get", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
    });

    if (getErr || !oldRow)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    // Execute Delete RPC
    const { data, error } = await supabase.rpc("fn_it_delete", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
    });

    if (error) {
      console.error("[IT_DELETE_RPC]", error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    // Cleanup Files
    const keysToDelete: string[] = [];
    for (const f of FILE_FIELDS) {
      const k = (oldRow as any)?.[f];
      if (typeof k === "string" && k) keysToDelete.push(k);
    }
    await removeFiles(supabase, keysToDelete);

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[IT_DELETE_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
