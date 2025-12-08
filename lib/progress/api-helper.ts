/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { canProgressKplt } from "@/lib/auth/acl";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";
import { makeFieldKey, isValidPrefixKey } from "@/lib/storage/naming";
import { isPdfFile, isImageFile } from "@/utils/fileChecker";

const BUCKET = "file_storage";
const DEFAULT_MAX_SIZE = 15 * 1024 * 1024; // 15MB

// =============================================================================
// AUTH & ACCESS HELPER
// =============================================================================

export async function checkAuthAndAccess(
  supabase: any,
  user: any,
  progressId: string,
  permission: "read" | "create" | "update" | "delete"
) {
  if (!user) return { error: "Unauthorized", status: 401 };
  if (!canProgressKplt(permission, user))
    return { error: "Forbidden", status: 403 };
  if (!user.branch_id) return { error: "Forbidden: No branch", status: 403 };

  const check = await validateProgressAccess(supabase, user, progressId);
  if (!check.allowed) return { error: check.error, status: check.status };

  return null; // Access Granted
}

export async function resolveUlokId(
  supabase: any,
  progressId: string,
  branchId: string
) {
  const { data, error } = await supabase
    .from("progress_kplt")
    .select(
      "id, kplt:kplt!progress_kplt_kplt_id_fkey!inner ( id, branch_id, ulok_id )"
    )
    .eq("id", progressId)
    .eq("kplt.branch_id", branchId)
    .maybeSingle();

  if (error || !data?.kplt?.ulok_id)
    throw new Error("Progress out of scope or not found");
  return data.kplt.ulok_id as string;
}

// =============================================================================
// STORAGE HELPER
// =============================================================================

export async function uploadFile(
  supabase: any,
  ulokId: string,
  moduleName: string,
  field: string,
  file: File
) {
  const key = makeFieldKey(ulokId, moduleName, field, file);
  const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
  });
  if (error) throw new Error(`Upload failed for ${field}: ${error.message}`);
  return key;
}

export async function removeFiles(supabase: any, keys: string[]) {
  if (keys.length > 0) await supabase.storage.from(BUCKET).remove(keys);
}

// =============================================================================
// MULTIPART PARSER HELPER
// =============================================================================

type MultipartResult = {
  payload: Record<string, unknown>;
  uploadedKeys: string[];
  fileFieldsFound: string[];
};

export async function parseMultipartRequest(
  supabase: any,
  req: Request,
  config: {
    ulokId: string;
    moduleName: string;
    fileFields: readonly string[];
    maxSize?: number;
  }
): Promise<MultipartResult> {
  const form = await req.formData();
  const payload: Record<string, unknown> = {};
  const uploadedKeys: string[] = [];
  const fileFieldsFound: string[] = [];
  const maxSize = config.maxSize ?? DEFAULT_MAX_SIZE;

  // 1. Process Files
  for (const field of config.fileFields) {
    const entry = form.get(field);

    if (entry instanceof File && entry.size > 0) {
      if (entry.size > maxSize) {
        throw new Error(
          `File ${field} terlalu besar (Maks ${maxSize / 1024 / 1024}MB)`
        );
      }

      // Strict Validation using utils/fileChecker
      const pdfCheck = await isPdfFile(entry);
      const imgCheck = await isImageFile(entry);
      if (!pdfCheck.ok && !imgCheck.ok) {
        throw new Error(`File tidak valid: Harus PDF atau Gambar.`);
      }

      // Upload
      const key = await uploadFile(
        supabase,
        config.ulokId,
        config.moduleName,
        field,
        entry
      );
      payload[field] = key;
      uploadedKeys.push(key);
      fileFieldsFound.push(field);
    } else if (typeof entry === "string" && entry.trim() !== "") {
      // Retain existing file key
      if (!isValidPrefixKey(config.ulokId, config.moduleName, entry.trim())) {
        throw new Error(`Invalid file key prefix for ${field}`);
      }
      payload[field] = entry.trim();
      fileFieldsFound.push(field);
    }
  }

  // 2. Process Text Fields
  for (const [key, value] of form.entries()) {
    if (
      !config.fileFields.includes(key) &&
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      payload[key] = value.trim();
    }
  }

  return { payload, uploadedKeys, fileFieldsFound };
}

// =============================================================================
// ERROR HANDLER (UPDATED)
// =============================================================================

export function handleCommonError(error: any, context: string) {
  // 1. Log error asli ke server console untuk debugging
  console.error(`[${context}] Error:`, error);

  const msg = (error?.message || "").toLowerCase();
  const code = error?.code;

  // 2. Handle Database Conflicts
  if (code === "23505" || msg.includes("already exists")) {
    return NextResponse.json(
      { error: "Conflict: Data already exists" },
      { status: 409 }
    );
  }

  // 3. Handle Business Logic / Preconditions
  if (msg.includes("already finalized")) {
    return NextResponse.json(
      { error: "Conflict: Already finalized", message: error.message },
      { status: 409 }
    );
  }
  if (msg.includes("prerequisites") || msg.includes("missing")) {
    return NextResponse.json(
      { error: "Unprocessable Entity", message: error.message },
      { status: 422 }
    );
  }
  if (msg.includes("not found")) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // 4.Handle Validation Errors (File size, type, prefix)s
  if (
    msg.includes("terlalu besar") ||
    msg.includes("tidak valid") ||
    msg.includes("invalid file key") ||
    msg.includes("invalid payload")
  ) {
    return NextResponse.json(
      { error: "Bad Request", message: error.message },
      { status: 400 }
    );
  }

  // 5. Default Server Error (Hanya jika benar-benar tidak terduga)
  return NextResponse.json({ error}, { status: 500 });
}
