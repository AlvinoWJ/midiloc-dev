import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";
import { UlokUpdateSchema } from "@/lib/validations/ulok";
import { buildPathByField } from "@/lib/storage/path";
import { MIME } from "@/lib/storage/path";

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

// Kolom yang boleh diubah oleh Location Manager
const LM_FIELDS = [
  "approval_intip",
  "tanggal_approval_intip",
  "file_intip",
  "approval_status",
  "approved_at",
  "approved_by",
] as const;

const LM_FIELDS_SET = new Set<string>(LM_FIELDS as unknown as string[]);

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

  //validate query by position
  if (user.position_nama === "location specialist") {
    query = query.eq("users_id", user.id).eq("branch_id", user.branch_id);
  }
  //validate query by branch
  else if (user.position_nama === "location manager") {
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

  // ========= BRANCH: LOCATION MANAGER (Mode B multipart) =========
  if (user.position_nama === "location manager") {
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "Use multipart/form-data for uploading file_intip" },
        { status: 400 }
      );
    }

    // Pastikan row ada, cocok branch
    if (!user.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: user has no branch" },
        { status: 403 }
      );
    }

    const { data: existing, error: existErr } = await supabase
      .from("ulok")
      .select("id, branch_id, file_intip")
      .eq("id", id)
      .eq("branch_id", user.branch_id)
      .single();

    if (existErr || !existing) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid form-data" }, { status: 400 });
    }

    // Kumpulkan field LM (string) selain file
    const rawManagerFields: Record<string, unknown> = {};
    form.forEach((val, key) => {
      if (key === "file_intip") return;
      if (typeof val === "string" && LM_FIELDS_SET.has(key)) {
        rawManagerFields[key] = val;
      }
    });

    // Ambil file (optional)
    const file = form.get("file_intip");
    let newFilePath: string | undefined;

    if (file instanceof File) {
      if (file.size === 0) {
        return NextResponse.json(
          { error: "Empty file_intip uploaded" },
          { status: 400 }
        );
      }
      if (file.size > MAX_PDF_SIZE) {
        return NextResponse.json(
          { error: "File too large (max 15MB)" },
          { status: 400 }
        );
      }

      // Validasi PDF
      // Validasi PDF atau Image
      const isAllowed = Object.values(MIME).some((arr) =>
        arr.includes(file.type)
      );

      if (!isAllowed) {
        return NextResponse.json(
          {
            error: "File harus PDF atau gambar (JPEG/PNG/JPG)",
            detail: `Tipe: ${file.type}`,
          },
          { status: 422 }
        );
      }

      if (file.type === "application/pdf") {
        const pdfCheck = await isPdfFile(file, true);
        if (!pdfCheck.ok) {
          return NextResponse.json(
            { error: "File bukan PDF valid", detail: pdfCheck.reason },
            { status: 422 }
          );
        }
      }

      // Path seragam: <ulokId>/ulok/<ts>_file_intip.pdf
      const path = buildPathByField(
        id,
        "ulok",
        "file_intip",
        file.name,
        file.type
      );

      // Upload file baru
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: "application/pdf",
        });

      if (uploadErr) {
        return NextResponse.json(
          { error: "Upload failed", detail: uploadErr.message },
          { status: 500 }
        );
      }

      newFilePath = path;
    }

    // Susun payload yang akan divalidasi
    const allowedPayload: Record<string, unknown> = {
      ...rawManagerFields,
    };
    if (newFilePath) {
      allowedPayload.file_intip = newFilePath;
    }

    if (Object.keys(allowedPayload).length === 0) {
      return NextResponse.json(
        { error: "No manager fields provided" },
        { status: 400 }
      );
    }

    // Validasi payload
    const validationResult = UlokUpdateSchema.safeParse(allowedPayload);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");
      // Rollback file baru bila validasi gagal
      if (newFilePath) {
        await supabase.storage
          .from(BUCKET)
          .remove([newFilePath])
          .catch(() => {});
      }
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errorMessage,
          fieldErrors,
        },
        { status: 422 }
      );
    }

    const validatedPayload = validationResult.data as AnyObj;

    // Approval stamping jika menyentuh field approval
    const touchingApproval =
      "approval_status" in validatedPayload ||
      "approval_intip" in validatedPayload ||
      "approved_by" in validatedPayload ||
      "approved_at" in validatedPayload;

    if (touchingApproval) {
      if (!validatedPayload.approved_by) {
        validatedPayload.approved_by = user.id;
      }
      if (!validatedPayload.approved_at) {
        validatedPayload.approved_at = new Date().toISOString();
      }
    }

    // Update DB
    const oldPath = (existing.file_intip as string | null) || null;
    const { data: updated, error: updateError } = await supabase
      .from("ulok")
      .update({
        ...validatedPayload,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("branch_id", user.branch_id)
      .select("*")
      .single();

    if (updateError) {
      // Rollback file baru jika ada
      if (newFilePath) {
        await supabase.storage
          .from(BUCKET)
          .remove([newFilePath])
          .catch(() => {});
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Hapus file lama hanya setelah DB update sukses dan ada file baru
    let removedOld = false;
    if (newFilePath && oldPath && oldPath !== newFilePath) {
      await supabase.storage
        .from(BUCKET)
        .remove([oldPath])
        .then(() => {
          removedOld = true;
        })
        .catch(() => {
          // best-effort: abaikan error hapus
        });
    }

    return NextResponse.json({
      data: updated,
      new_file_intip: newFilePath,
      removedOld,
      old_file_intip: oldPath,
    });
  }

  // ========= LOCATION SPECIALIST =========
  if (user.position_nama === "location specialist") {
    // ----- LS MULTIPART (form_ulok replace) -----
    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData().catch(() => null);
      if (!form) {
        return NextResponse.json(
          { error: "Invalid form-data" },
          { status: 400 }
        );
      }

      // Pastikan row milik LS
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

      const file = form.get("form_ulok");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "form_ulok file is required in multipart" },
          { status: 422 }
        );
      }
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
          {
            error: "File bukan PDF valid",
            detail: pdfCheck.reason,
          },
          { status: 422 }
        );
      }

      const newPath = buildPathByField(
        id,
        "ulok",
        "form_ulok",
        file.name,
        file.type
      );
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

      let removedOld = false;
      const oldPath = existing.form_ulok as string | null;
      if (oldPath && oldPath !== newPath) {
        await supabase.storage
          .from(BUCKET)
          .remove([oldPath])
          .then(() => {
            removedOld = true;
          })
          .catch(() => {});
      }

      const { data: updated, error: updErr } = await supabase
        .from("ulok")
        .update({
          form_ulok: newPath,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("users_id", user.id)
        .eq("branch_id", user.branch_id)
        .select("*")
        .single();

      if (updErr) {
        // rollback file baru jika DB update gagal
        await supabase.storage
          .from(BUCKET)
          .remove([newPath])
          .catch(() => {});
        return NextResponse.json(
          { error: "Update DB failed", detail: updErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: updated,
        new_form_ulok: newPath,
        removed_old: removedOld,
        old_form_ulok: oldPath,
      });
    }

    // ----- LS JSON (field non-file) -----
    if (!contentType.startsWith("application/json")) {
      return NextResponse.json(
        { error: "Use application/json or multipart/form-data" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => null)) as AnyObj | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // LS dilarang ubah LM fields & file/form kolom langsung
    const forbiddenLM = (LM_FIELDS as unknown as string[]).filter((k) =>
      Object.prototype.hasOwnProperty.call(body, k)
    );
    if (forbiddenLM.length > 0) {
      return NextResponse.json(
        { error: "LS is not allowed to modify manager fields" },
        { status: 400 }
      );
    }
    if ("form_ulok" in body) delete body.form_ulok;
    if ("file_intip" in body) delete body.file_intip;

    const forbiddenKeys = [
      "id",
      "users_id",
      "created_at",
      "created_by",
      "updated_at",
      "updated_by",
      "is_active",
      "branch_id",
      "file_intip",
      "form_ulok",
      "approved_at",
      "approved_by",
      "approval_status",
      "approval_intip",
      "tanggal_approval_intip",
    ] as const;

    const allowedPayload = omit(
      body,
      forbiddenKeys as unknown as readonly (keyof typeof body)[]
    );

    if (Object.keys(allowedPayload).length === 0) {
      return NextResponse.json(
        { error: "No permitted fields to update for your role" },
        { status: 400 }
      );
    }

    const validationResult = UlokUpdateSchema.safeParse(allowedPayload);
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

    const validatedPayload = validationResult.data;

    const { data: updated, error: updateError } = await supabase
      .from("ulok")
      .update({
        ...validatedPayload,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("users_id", user.id)
      .eq("branch_id", user.branch_id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
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
