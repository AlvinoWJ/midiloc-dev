import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  canUlok,
  type CurrentUser,
  POSITION,
} from "@/lib/auth/acl";
import { UlokUpdateSchema } from "@/lib/validations/ulok";
import { buildPathByField } from "@/lib/storage/path";
import { isPdfFile } from "@/utils/fileChecker";

// =============================================================================
// KONFIGURASI & KONSTANTA
// =============================================================================
const BUCKET = "file_storage";
const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15MB
const FINAL_STATUSES = new Set(["OK", "NOK"]);

const LS_FORBIDDEN_KEYS = [
  "id",
  "users_id",
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "is_active",
  "branch_id",
  "approved_at",
  "approved_by",
  "approval_status",
] as const;

// Field wajib sebelum status berubah jadi OK
const REQUIRED_FIELDS_BEFORE_APPROVAL = [
  "nama_ulok",
  "latitude",
  "longitude",
  "desa_kelurahan",
  "kecamatan",
  "kabupaten",
  "provinsi",
  "alamat",
  "format_store",
  "bentuk_objek",
  "alas_hak",
  "jumlah_lantai",
  "lebar_depan",
  "panjang",
  "luas",
  "harga_sewa",
  "nama_pemilik",
  "kontak_pemilik",
  "form_ulok",
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isUuid(v: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    v
  );
}

function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> {
  const out = { ...obj } as T;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(out, k)) {
      delete out[k];
    }
  }
  return out as Omit<T, K>;
}

// =============================================================================
// LOGIKA UTAMA HANDLER
// =============================================================================

/**
 * Handle Approval Logic (Location Manager)
 * Menggunakan application/json
 */
async function handleApprovalUpdate(
  req: Request,
  id: string,
  user: CurrentUser,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.startsWith("application/json")) {
    return NextResponse.json(
      {
        error:
          "Use application/json for ULOK approval update (you're using LM)",
      },
      { status: 400 }
    );
  }

  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden: user has no branch" },
      { status: 403 }
    );
  }

  // 1. Ambil Data Existing
  const { data: existing, error: existErr } = await supabase
    .from("ulok")
    .select("*")
    .eq("id", id)
    .eq("branch_id", user.branch_id)
    .maybeSingle();

  if (existErr || !existing) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // 2. Cek Final Status
  const currentStatus = String(existing.approval_status ?? "").toUpperCase();
  if (FINAL_STATUSES.has(currentStatus)) {
    return NextResponse.json(
      {
        error: "Conflict",
        message: `ULOK already finalized (${currentStatus}), status cannot be changed`,
      },
      { status: 409 }
    );
  }

  // 3. Parse Body
  const bodyUnknown = await req.json().catch(() => null);
  if (!bodyUnknown || typeof bodyUnknown !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 4. Filter & Validasi Payload
  const payload = bodyUnknown as Record<string, unknown>;
  if (!payload.approval_status) {
    return NextResponse.json(
      { error: "No approval_status provided" },
      { status: 400 }
    );
  }

  const validationResult = UlokUpdateSchema.pick({ approval_status: true })
    .strict()
    .safeParse({ approval_status: payload.approval_status });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    const errorMessage = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
      .join("; ");
    return NextResponse.json(
      { error: "Validation failed", details: errorMessage, fieldErrors },
      { status: 422 }
    );
  }

  // 5. Cek Kelengkapan Data jika Status OK
  const targetStatus = String(
    validationResult.data.approval_status
  ).toUpperCase();
  if (targetStatus === "OK") {
    const missingFields: string[] = [];
    for (const field of REQUIRED_FIELDS_BEFORE_APPROVAL) {
      const value = existing[field];
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "number" && isNaN(value));

      if (isEmpty) missingFields.push(String(field));
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "ULOK data incomplete",
          message: "Tidak bisa approval OK, masih ada kolom yang wajib diisi.",
          missingFields,
        },
        { status: 409 }
      );
    }
  }

  // 6. Update Database
  const { data: updated, error: updateError } = await supabase
    .from("ulok")
    .update({
      approval_status: validationResult.data.approval_status,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("branch_id", user.branch_id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: updated });
}

/**
 * Handle Submission Update Logic (Location Specialist)
 * Menggunakan multipart/form-data
 */
async function handleSubmissionUpdate(
  req: Request,
  id: string,
  user: CurrentUser,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json(
      {
        error:
          "Use multipart/form-data. You can send form_ulok (File) and non-file fields together.",
      },
      { status: 400 }
    );
  }

  // 1. Cek Kepemilikan Data
  const { data: existing, error: existErr } = await supabase
    .from("ulok")
    .select("id, users_id, branch_id, form_ulok")
    .eq("id", id)
    .eq("users_id", user.id)
    .eq("branch_id", user.branch_id)
    .single();

  if (existErr || !existing) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // 2. Parse Form Data
  const form = await req.formData().catch(() => null);
  if (!form)
    return NextResponse.json({ error: "Invalid form-data" }, { status: 400 });

  // 3. Handle File Upload
  const file = form.get("form_ulok");
  let newPath: string | undefined;
  const oldPath = existing.form_ulok as string | null;

  if (file instanceof File) {
    if (file.size === 0)
      return NextResponse.json(
        { error: "Empty form_ulok file" },
        { status: 422 }
      );
    if (file.size > MAX_PDF_SIZE)
      return NextResponse.json(
        { error: "form_ulok file too large (max 15MB)" },
        { status: 422 }
      );

    const pdfCheck = await isPdfFile(file);
    if (!pdfCheck.ok) {
      return NextResponse.json(
        { error: "File bukan PDF valid", detail: pdfCheck.reason },
        { status: 422 }
      );
    }

    newPath = buildPathByField(id, "ulok", "form_ulok", file.name, file.type);
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, file, { upsert: false, contentType: "application/pdf" });

    if (uploadErr) {
      return NextResponse.json(
        { error: "Upload form_ulok failed: " + uploadErr.message },
        { status: 500 }
      );
    }
  }

  // 4. Handle Text Fields
  const bodyText: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) {
    if (k === "form_ulok") continue;
    if (v instanceof File) continue;
    if (typeof v === "string") bodyText[k] = v;
  }

  const allowedPayload = omit(bodyText, LS_FORBIDDEN_KEYS);

  // 5. Validasi Text Payload
  if (Object.keys(allowedPayload).length > 0) {
    const validationResult = UlokUpdateSchema.safeParse(allowedPayload);
    if (!validationResult.success) {
      // Rollback upload jika validasi gagal
      if (newPath)
        await supabase.storage
          .from(BUCKET)
          .remove([newPath])
          .catch(() => {});

      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");

      return NextResponse.json(
        { error: "Validation failed", details: errorMessage, fieldErrors },
        { status: 422 }
      );
    }
  }

  // 6. Update Database
  const updatePayload = {
    ...allowedPayload,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
    ...(newPath ? { form_ulok: newPath } : {}),
  };

  const { data: updated, error: updErr } = await supabase
    .from("ulok")
    .update(updatePayload)
    .eq("id", id)
    .eq("users_id", user.id)
    .eq("branch_id", user.branch_id)
    .select("*")
    .single();

  if (updErr) {
    if (newPath)
      await supabase.storage
        .from(BUCKET)
        .remove([newPath])
        .catch(() => {});
    return NextResponse.json(
      { error: "Update DB failed", detail: updErr.message },
      { status: 500 }
    );
  }

  // 7. Cleanup File Lama
  let removedOld = false;
  if (newPath && oldPath && oldPath !== newPath) {
    await supabase.storage
      .from(BUCKET)
      .remove([oldPath])
      .then(() => {
        removedOld = true;
      })
      .catch(() => {});
  }

  return NextResponse.json({
    data: updated,
    new_form_ulok: newPath || null,
    removed_old: removedOld,
    old_form_ulok: oldPath,
  });
}

// =============================================================================
// API ROUTE HANDLERS
// =============================================================================

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // QUERY
  let query = supabase
    .from("ulok")
    .select(
      "*, users!ulok_users_id_fkey(nama, no_telp), approved_by (nama), updated_by (nama), branch_id( nama)"
    )
    .eq("id", id);

  if (user.position_nama === POSITION.LOCATION_SPECIALIST) {
    query = query.eq("users_id", user.id).eq("branch_id", user.branch_id);
  } else if (canUlok("read", user)) {
    if (!user.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: user has no branch" },
        { status: 403 }
      );
    }
    query = query.eq("branch_id", user.branch_id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isUuid(id))
    return NextResponse.json({ error: "Invalid ulok_id" }, { status: 422 });

  // Branching Logic berdasarkan Permission User
  // 1. Jika User adalah APPROVER (Location Manager)
  if (canUlok("approve", user)) {
    return handleApprovalUpdate(req, id, user, supabase);
  }

  // 2. Jika User adalah SUBMITTER (Location Specialist)
  if (canUlok("update", user)) {
    return handleSubmissionUpdate(req, id, user, supabase);
  }

  return NextResponse.json(
    { error: "Forbidden for your role" },
    { status: 403 }
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("delete", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (user.position_nama === POSITION.LOCATION_SPECIALIST) {
    const { data, error } = await supabase
      .from("ulok")
      .delete()
      .eq("id", id)
      .eq("users_id", user.id)
      .eq("branch_id", user.branch_id)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted_id: data?.id ?? id });
  }

  return NextResponse.json(
    { error: "Forbidden for your role" },
    { status: 403 }
  );
}
