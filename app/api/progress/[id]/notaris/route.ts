/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import {
  NotarisCreateSchema,
  NotarisUpdateSchema,
  stripServerControlledFieldsNotaris,
} from "@/lib/validations/notaris";
import {
  checkAuthAndAccess,
  handleCommonError,
  parseMultipartRequest,
  removeFiles,
  resolveUlokId,
} from "@/lib/progress/api-helper";

export const dynamic = "force-dynamic";
const FILE_FIELDS = ["par_online"] as const;

/**
 * @route GET /api/progress/[id]/notaris
 * @description Mengambil detail data Notaris untuk progress tertentu.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  //auth check
  const authErr = await checkAuthAndAccess(supabase, user, params.id, "read");
  if (authErr) return NextResponse.json(authErr, { status: authErr.status });

  const progressId = params?.id;

  const { data, error } = await supabase.rpc("fn_notaris_get", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) return handleCommonError(error, "NOTARIS_GET");
  if (!data)
    return NextResponse.json({ error: "Data not found" }, { status: 404 });

  return NextResponse.json({ data });
}

/**
 * @route POST /api/progress/[id]/notaris
 * @description Membuat data Notaris baru. Mendukung Multipart (dengan file) atau JSON.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  let uploadedKeys: string[] = [];

  try {
    const user = await getCurrentUser();
    // 1. Auth & Access Check
    const authErr = await checkAuthAndAccess(
      supabase,
      user,
      params.id,
      "create"
    );
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Context Resolution
    const ulokId = await resolveUlokId(supabase, params.id, user!.branch_id!);
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};

    // 3. Parse Payload (Multipart vs JSON)
    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartRequest(supabase, req, {
        ulokId,
        moduleName: "notaris",
        fileFields: FILE_FIELDS,
      });
      payload = parsed.payload;
      uploadedKeys = parsed.uploadedKeys;
    } else {
      // Validasi manual prefix jika via JSON (Security)
      const body = await req.json().catch(() => ({}));
      const parsed = NotarisCreateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsNotaris(parsed.data);
    }
    // 4. Execute RPC
    const { data, error } = await supabase.rpc("fn_notaris_create", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
      p_payload: payload,
    });

    if (error) {
      await removeFiles(supabase, uploadedKeys); // Rollback
      return handleCommonError(error, "NOTARIS_CREATE");
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    await removeFiles(supabase, uploadedKeys); // Rollback
    return handleCommonError(err, "NOTARIS_POST_UNHANDLED");
  }
}

/**
 * @route PATCH /api/progress/[id]/notaris
 * @description Mengupdate data Notaris.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  let uploadedKeys: string[] = [];

  try {
    const user = await getCurrentUser();
    // 1. Auth Check
    const authErr = await checkAuthAndAccess(
      supabase,
      user,
      params.id,
      "update"
    );
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Pre-fetch Old Data (for cleanup)
    const { data: oldRow } = await supabase.rpc("fn_notaris_get", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
    });
    if (!oldRow)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    const ulokId = await resolveUlokId(supabase, params.id, user!.branch_id!);

    // 3. Parse Payload
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};
    let fieldsToCheck: string[] = [];

    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartRequest(supabase, req, {
        ulokId,
        moduleName: "notaris",
        fileFields: FILE_FIELDS,
      });
      payload = parsed.payload;
      uploadedKeys = parsed.uploadedKeys;
      fieldsToCheck = parsed.fileFieldsFound;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = NotarisUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      }
      payload = stripServerControlledFieldsNotaris(parsed.data);
      fieldsToCheck = FILE_FIELDS.filter((f) =>
        Object.prototype.hasOwnProperty.call(payload, f)
      );

      // Validasi prefix jika update JSON menyertakan file key
      const po = (payload as any)?.par_online;
      if (typeof po === "string" && !po.startsWith(`${ulokId}/notaris/`)) {
        return NextResponse.json(
          { error: "Invalid par_online key prefix" },
          { status: 422 }
        );
      }
    }

    // 4. Execute RPC
    const { data, error } = await supabase.rpc("fn_notaris_update", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
      p_payload: payload,
    });

    if (error) {
      await removeFiles(supabase, uploadedKeys); //rollback
      return handleCommonError(error, "NOTARIS_UPDATE");
    }

    // 5. Cleanup Old Files
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
    await removeFiles(supabase, uploadedKeys); //rollback
    return handleCommonError(err, "NOTARIS_PATCH_UNHANDLED");
  }
}

/**
 * @route DELETE /api/progress/[id]/notaris
 * @description Menghapus data Notaris dan file par_online terkait.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  // 1. Auth Check
  const authErr = await checkAuthAndAccess(supabase, user, params.id, "delete");
  if (authErr) return NextResponse.json(authErr, { status: authErr.status });

  // 2. Get Old Data (for cleanup)
  const { data: oldRow } = await supabase.rpc("fn_notaris_get", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: params.id,
  });

  // 3. Execute Delete
  const { data, error } = await supabase.rpc("fn_notaris_delete", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: params.id,
  });

  if (error) return handleCommonError(error, "NOTARIS_DELETE");
  // 4. Cleanup Files
  if (oldRow) {
    const keys = FILE_FIELDS.map((f) => (oldRow as any)[f]).filter(Boolean);
    await removeFiles(supabase, keys);
  }

  return NextResponse.json({ data }, { status: 200 });
}
