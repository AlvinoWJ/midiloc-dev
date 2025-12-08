/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import {
  RenovasiCreateSchema,
  RenovasiUpdateSchema,
  stripServerControlledFieldsRenovasi,
} from "@/lib/validations/renovasi";
import {
  checkAuthAndAccess,
  handleCommonError,
  parseMultipartRequest,
  removeFiles,
  resolveUlokId,
} from "@/lib/progress/api-helper";

export const dynamic = "force-dynamic";

const FILE_FIELDS = ["file_rekom_renovasi"] as const;

/**
 * @route GET /api/progress/[id]/renovasi
 * @description Mengambil detail data Renovasi.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();
  const authErr = await checkAuthAndAccess(supabase, user, id, "read");
  if (authErr) return NextResponse.json(authErr, { status: authErr.status });

  //fetch data
  const { data, error } = await supabase.rpc("fn_renovasi_get", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: id,
  });

  if (error) return handleCommonError(error, "RENOVASI_GET");
  if (!data)
    return NextResponse.json({ error: "Data not found" }, { status: 404 });
  return NextResponse.json({ data }, { status: 200 });
}

/**
 * @route POST /api/progress/[id]/renovasi
 * @description Membuat data Renovasi baru. (Multipart/JSON)
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
    // 1. Auth Check
    const authErr = await checkAuthAndAccess(supabase, user, id, "create");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Resolve Context
    const ulokId = await resolveUlokId(supabase, id, user!.branch_id!);

    // 3. Parse Payload
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};

    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartRequest(supabase, req, {
        ulokId,
        moduleName: "renovasi",
        fileFields: FILE_FIELDS,
      });
      payload = parsed.payload;
      uploadedKeys = parsed.uploadedKeys;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = RenovasiCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      }
      payload = stripServerControlledFieldsRenovasi(parsed.data);
      // Validate prefix manually for JSON payload
      const fr = (payload as any)?.file_rekom_renovasi;
      if (typeof fr === "string" && !fr.startsWith(`${ulokId}/renovasi/`)) {
        return NextResponse.json(
          { error: "Invalid file key prefix" },
          { status: 422 }
        );
      }
    }

    // 4. Execute RPC
    const { data, error } = await supabase.rpc("fn_renovasi_create", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
      p_payload: payload,
    });

    if (error) {
      await removeFiles(supabase, uploadedKeys); // Rollback
      // Handle Renovasi-specific prerequisite error
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("prerequisite") || msg.includes("notaris")) {
        return NextResponse.json(
          { error: "Prerequisite Notaris not met" },
          { status: 422 }
        );
      }
      return handleCommonError(error, "RENOVASI_CREATE");
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    await removeFiles(supabase, uploadedKeys);
    return handleCommonError(err, "RENOVASI_POST_UNHANDLED");
  }
}

/**
 * @route PATCH /api/progress/[id]/renovasi
 * @description Mengupdate data Renovasi.
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
    // 1. Auth Check
    const authErr = await checkAuthAndAccess(supabase, user, id, "update");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Pre-fetch Old Data (cleanup purpose)
    const { data: oldRow } = await supabase.rpc("fn_renovasi_get", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
    });
    if (!oldRow)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    const ulokId = await resolveUlokId(supabase, id, user!.branch_id!);

    // 3. Parse Payload
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};
    let fieldsToCheck: string[] = [];

    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartRequest(supabase, req, {
        ulokId,
        moduleName: "renovasi",
        fileFields: FILE_FIELDS,
      });
      payload = parsed.payload;
      uploadedKeys = parsed.uploadedKeys;
      fieldsToCheck = parsed.fileFieldsFound;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = RenovasiUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      }
      payload = stripServerControlledFieldsRenovasi(parsed.data);
      fieldsToCheck = FILE_FIELDS.filter((f) =>
        Object.prototype.hasOwnProperty.call(payload, f)
      );

      const fr = (payload as any)?.file_rekom_renovasi;
      if (typeof fr === "string" && !fr.startsWith(`${ulokId}/renovasi/`)) {
        return NextResponse.json(
          { error: "Invalid file key prefix" },
          { status: 422 }
        );
      }
    }

    // 4. Execute RPC
    const { data, error } = await supabase.rpc("fn_renovasi_update", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
      p_payload: payload,
    });

    if (error) {
      await removeFiles(supabase, uploadedKeys);
      return handleCommonError(error, "RENOVASI_UPDATE");
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
    await removeFiles(supabase, uploadedKeys);
    return handleCommonError(err, "RENOVASI_PATCH_UNHANDLED");
  }
}

/**
 * @route DELETE /api/progress/[id]/renovasi
 * @description Menghapus data Renovasi.
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

  // Get Old Data
  const { data: oldRow } = await supabase.rpc("fn_renovasi_get", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: id,
  });

  // Execute Delete
  const { data, error } = await supabase.rpc("fn_renovasi_delete", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: id,
  });

  if (error) return handleCommonError(error, "RENOVASI_DELETE");

  // Cleanup File
  if (oldRow) {
    const keys = FILE_FIELDS.map((f) => (oldRow as any)[f]).filter(Boolean);
    await removeFiles(supabase, keys);
  }

  return NextResponse.json({ data }, { status: 200 });
}
