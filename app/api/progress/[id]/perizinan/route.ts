/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import {
  PerizinanCreateSchema,
  PerizinanUpdateSchema,
  stripServerControlledFieldsPerizinan,
} from "@/lib/validations/perizinan";
import {
  checkAuthAndAccess,
  handleCommonError,
  parseMultipartRequest,
  removeFiles,
  resolveUlokId,
} from "@/lib/progress/api-helper";
export const dynamic = "force-dynamic";

// Daftar kolom file_* di tabel perizinan
const FILE_FIELDS = [
  "file_sph",
  "file_bukti_st",
  "file_denah",
  "file_spk",
  "file_rekom_notaris",
] as const;

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * @route GET /api/progress/[id]/perizinan
 * @description Mengambil detail data Perizinan.
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
    const { data, error } = await supabase.rpc("fn_perizinan_get", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
    });

    if (error) return handleCommonError(error, "PERIZINAN_GET");
    if (!data)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[PERIZINAN_GET_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/progress/[id]/perizinan
 * @description Membuat data Perizinan baru (Multipart/JSON).
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

    // Auth Check
    const authErr = await checkAuthAndAccess(supabase, user, id, "create");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    const ulokId = await resolveUlokId(supabase, id, user!.branch_id!);
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};

    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartRequest(supabase, req, {
        ulokId,
        moduleName: "perizinan",
        fileFields: FILE_FIELDS,
      });
      payload = parsed.payload;
      uploadedKeys = parsed.uploadedKeys;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = PerizinanCreateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsPerizinan(parsed.data);
    }

    // Execute RPC
    const { data, error } = await supabase.rpc("fn_perizinan_create", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
      p_payload: payload,
    });

    if (error) {
      await removeFiles(supabase, uploadedKeys);
      return handleCommonError(error, "PERIZINAN_CREATE");
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    await removeFiles(supabase, uploadedKeys); // Rollback
    console.error("[PERIZINAN_POST_UNHANDLED]", err);
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route PATCH /api/progress/[id]/perizinan
 * @description Mengupdate data Perizinan (Multipart/JSON).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  let uploadedKeys: string[] = [];

  try {
    const user = await getCurrentUser();

    // Auth Check
    const authErr = await checkAuthAndAccess(supabase, user, id, "update");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // Resolve Context & Old Data
    const ulokId = await resolveUlokId(supabase, id, user!.branch_id!);

    const { data: oldRow, error: getErr } = await supabase.rpc(
      "fn_perizinan_get",
      {
        p_user_id: user!.id,
        p_branch_id: user!.branch_id,
        p_progress_kplt_id: id,
      }
    );

    if (getErr || !oldRow)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    // Parse Body
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};
    let fieldsToCheck: string[] = [];

    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartRequest(supabase, req, {
        ulokId,
        moduleName: "perizinan",
        fileFields: FILE_FIELDS,
      });
      payload = parsed.payload;
      uploadedKeys = parsed.uploadedKeys;
      fieldsToCheck = parsed.fileFieldsFound;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = PerizinanUpdateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsPerizinan(parsed.data);
      fieldsToCheck = FILE_FIELDS.filter((f) =>
        Object.prototype.hasOwnProperty.call(payload, f)
      );
    }

    // Execute RPC
    const { data, error } = await supabase.rpc("fn_perizinan_update", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
      p_payload: payload,
    });

    if (error) {
      await removeFiles(supabase, uploadedKeys);
      return handleCommonError(error, "PERIZINAN_UPDATE");
    }
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
    await removeFiles(supabase, uploadedKeys); // Rollback upload baru
    console.error("[PERIZINAN_PATCH_UNHANDLED]", err);
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route DELETE /api/progress/[id]/perizinan
 * @description Menghapus data Perizinan.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const authErr = await checkAuthAndAccess(supabase, user, id, "delete");
  if (authErr) return NextResponse.json(authErr, { status: authErr.status });

  const { data, error } = await supabase.rpc("fn_perizinan_delete", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: id,
  });

  if (error) return handleCommonError(error, "PERIZINAN_DELETE");

  return NextResponse.json({ data }, { status: 200 });
}
