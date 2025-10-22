import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";
import { UlokUpdateSchema } from "@/lib/validations/ulok";
import { buildPathByField } from "@/lib/storage/path";

const BUCKET = "file_storage";
const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15MB
function isUuid(v: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    v
  );
}

type AnyObj = Record<string, unknown>;

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

// Field yang TIDAK boleh diubah LS
const LS_FORBIDDEN_KEYS = [
  "id",
  "users_id",
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "is_active",
  "branch_id",
  // approval milik LM
  "approved_at",
  "approved_by",
  "approval_status",
] as const;

async function isPdfFile(
  file: File,
  strictSignature = true
): Promise<{ ok: boolean; reason?: string }> {
  const nameOk = file.name.toLowerCase().endsWith(".pdf");
  if (!nameOk) return { ok: false, reason: "Ekstensi harus .pdf" };
  if (file.type && file.type !== "application/pdf") {
    return {
      ok: false,
      reason: `MIME bukan application/pdf (detected: ${file.type})`,
    };
  }
  if (!strictSignature) return { ok: true };
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const sig = new TextDecoder().decode(header);
  if (!sig.startsWith("%PDF-"))
    return { ok: false, reason: "Header file bukan signature PDF (%PDF-)" };
  return { ok: true };
}

// Final states yang tidak boleh diubah lagi
const FINAL_STATUSES = new Set(["OK", "NOK"]);

// GET /api/ulok/:id
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;

  let query = supabase
    .from("ulok")
    .select(
      "*, users!ulok_users_id_fkey(nama, no_telp), approved_by (nama), updated_by (nama), branch_id( nama)"
    )
    .eq("id", id);

  if (user.position_nama === "location specialist") {
    query = query.eq("users_id", user.id).eq("branch_id", user.branch_id);
  } else if (user.position_nama === "location manager") {
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

// PATCH /api/ulok/:id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUlok("update", user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid ulok_id" }, { status: 422 });
  }

  const contentType = req.headers.get("content-type") || "";

  // ========= LOCATION MANAGER: hanya approval ULOK (JSON) =========
  if (user.position_nama === "location manager") {
    if (!contentType.startsWith("application/json")) {
      return NextResponse.json(
        { error: "Use application/json for ULOK approval update" },
        { status: 400 }
      );
    }

    if (!user.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: user has no branch" },
        { status: 403 }
      );
    }

    // Ambil approval_status saat ini
    const { data: existing, error: existErr } = await supabase
      .from("ulok")
      .select("id, branch_id, approval_status")
      .eq("id", id)
      .eq("branch_id", user.branch_id)
      .single();

    if (existErr || !existing) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // Jika sudah final (OK/NOK), tolak perubahan lebih lanjut
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

    const bodyUnknown = await req.json().catch(() => null);
    if (!bodyUnknown || typeof bodyUnknown !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const body = bodyUnknown as AnyObj;

    // Hanya izinkan approval_status dari client; abaikan approved_at/by input
    const allowedPayload: Record<string, unknown> = {};
    if (Object.prototype.hasOwnProperty.call(body, "approval_status")) {
      allowedPayload.approval_status = body.approval_status;
    }

    if (!("approval_status" in allowedPayload)) {
      return NextResponse.json(
        { error: "No approval_status provided" },
        { status: 400 }
      );
    }

    // Validasi hanya approval_status
    const validationResult = UlokUpdateSchema.pick({
      approval_status: true,
    })
      .strict()
      .safeParse(allowedPayload);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errorMessage,
          fieldErrors,
        },
        { status: 422 }
      );
    }

    // Server-only stamping: approved_by dan approved_at SELALU di-set di server
    const serverStamps = {
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await supabase
      .from("ulok")
      .update({
        approval_status: validationResult.data.approval_status,
        ...serverStamps,
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

    return NextResponse.json({ data: updated });
  }

  // ========= LOCATION SPECIALIST: SATU METODE multipart/form-data =========
  if (user.position_nama === "location specialist") {
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json(
        {
          error:
            "Use multipart/form-data. You can send form_ulok (File) and non-file fields together. (you're using LS right now)",
        },
        { status: 400 }
      );
    }

    // Pastikan row milik LS di branch yang sama
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

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid form-data" }, { status: 400 });
    }

    // 1) Proses file (opsional)
    const file = form.get("form_ulok");
    let newPath: string | undefined;
    let removedOld = false;
    const oldPath = existing.form_ulok as string | null;

    if (file instanceof File) {
      if (file.size === 0) {
        return NextResponse.json(
          { error: "Empty form_ulok file" },
          { status: 422 }
        );
      }
      if (file.size > MAX_PDF_SIZE) {
        return NextResponse.json(
          { error: "form_ulok file too large (max 15MB)" },
          { status: 422 }
        );
      }
      const pdfCheck = await isPdfFile(file, true);
      if (!pdfCheck.ok) {
        return NextResponse.json(
          { error: "File bukan PDF valid", detail: pdfCheck.reason },
          { status: 422 }
        );
      }

      newPath = buildPathByField(id, "ulok", "form_ulok", file.name, file.type);

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, file, {
          upsert: false,
          contentType: "application/pdf",
        });

      if (uploadErr) {
        return NextResponse.json(
          { error: "Upload form_ulok failed: " + uploadErr.message },
          { status: 500 }
        );
      }
    }

    // 2) Proses field non-file dari form-data (semua value string)
    //    - Filter field terlarang LS
    //    - Hapus key form_ulok (karena ditangani via upload)
    const bodyText: AnyObj = {};
    for (const [k, v] of form.entries()) {
      if (k === "form_ulok") continue;
      if (v instanceof File) continue; // jaga-jaga bila ada file lain
      if (typeof v === "string") bodyText[k] = v;
    }

    const allowedPayload = omit(
      bodyText,
      LS_FORBIDDEN_KEYS as unknown as readonly (keyof typeof bodyText)[]
    );

    // 3) Validasi payload non-file (boleh kosong jika hanya upload file)
    if (Object.keys(allowedPayload).length > 0) {
      const validationResult = UlokUpdateSchema.safeParse(allowedPayload);
      if (!validationResult.success) {
        // rollback file jika upload sudah terjadi
        if (newPath) {
          await supabase.storage
            .from(BUCKET)
            .remove([newPath])
            .catch(() => {});
        }
        const fieldErrors = validationResult.error.flatten().fieldErrors;
        const errorMessage = Object.entries(fieldErrors)
          .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
          .join("; ");
        return NextResponse.json(
          {
            error: "Validation failed",
            details: errorMessage,
            fieldErrors,
          },
          { status: 422 }
        );
      }
    }

    // 4) Update DB (gabungkan path bila ada)
    const updatePayload: AnyObj = {
      ...allowedPayload,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (newPath) updatePayload.form_ulok = newPath;

    const { data: updated, error: updErr } = await supabase
      .from("ulok")
      .update(updatePayload)
      .eq("id", id)
      .eq("users_id", user.id)
      .eq("branch_id", user.branch_id)
      .select("*")
      .single();

    if (updErr) {
      // rollback file baru jika DB update gagal
      if (newPath) {
        await supabase.storage
          .from(BUCKET)
          .remove([newPath])
          .catch(() => {});
      }
      return NextResponse.json(
        { error: "Update DB failed", detail: updErr.message },
        { status: 500 }
      );
    }

    // 5) Hapus file lama hanya setelah DB update sukses dan ada file baru
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

  return NextResponse.json(
    { error: "Forbidden for your role" },
    { status: 403 }
  );
}

// DELETE /api/ulok/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUlok("delete", user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  if (user.position_nama === "location specialist") {
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
