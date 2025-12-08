import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canKplt, POSITION } from "@/lib/auth/acl";
import { buildPathByField, isUuid } from "@/lib/storage/path";
import { KpltCreatePayloadSchema } from "@/lib/validations/kplt";
import { isImageFile, isPdfFile } from "@/utils/fileChecker";

export const dynamic = "force-dynamic";

const BUCKET = "file_storage";
const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15MB

// Schema Validasi Partial untuk Form Ukur
const FormUkurUpdateSchema = KpltCreatePayloadSchema.pick({
  form_ukur: true,
  tanggal_ukur: true,
}).partial();

const stripBucketPrefix = (p: string) =>
  p.replace(new RegExp(`^${BUCKET}/`), "");

/**
 * @route PATCH /api/kplt/[id]/form_ukur
 * @description Upload/Update file Form Ukur oleh Location Manager.
 * @content multipart/form-data
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let newFilePath: string | undefined;
  const supabase = await createClient();

  try {
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canKplt("update", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (user.position_nama !== POSITION.LOCATION_MANAGER) {
      return NextResponse.json(
        { error: "Forbidden: Role must be Location Manager" },
        { status: 403 }
      );
    }

    const kpltId = (id || "").trim();
    if (!isUuid(kpltId))
      return NextResponse.json({ error: "Invalid kplt_id" }, { status: 422 });

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    // 2. Fetch Existing Data
    const { data: existing, error: existErr } = await supabase
      .from("kplt")
      .select("id, branch_id, ulok_id, form_ukur")
      .eq("id", kpltId)
      .eq("branch_id", user.branch_id)
      .single();

    if (existErr || !existing)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // 3. Parse Form Data
    const form = await req.formData().catch(() => null);
    if (!form)
      return NextResponse.json({ error: "Invalid form-data" }, { status: 400 });

    const rawPayload: Record<string, unknown> = {};
    const tanggalUkur = form.get("tanggal_ukur");
    if (typeof tanggalUkur === "string" && tanggalUkur.trim()) {
      rawPayload.tanggal_ukur = tanggalUkur.trim();
    }

    // Handle File
    const file = (form.get("form_ukur") || form.get("file")) as File | null;

    if (file instanceof File) {
      if (file.size === 0)
        return NextResponse.json({ error: "File kosong" }, { status: 400 });
      if (file.size > MAX_DOC_SIZE)
        return NextResponse.json(
          { error: "File terlalu besar (max 15MB)" },
          { status: 400 }
        );

      // Check File Type (PDF or Image)
      const isPdf = (await isPdfFile(file)).ok;
      const isImg = !isPdf && (await isImageFile(file)).ok;

      if (!isPdf && !isImg) {
        return NextResponse.json(
          { error: "Format file tidak valid (PDF/Image only)" },
          { status: 422 }
        );
      }

      // Upload Logic
      const objectPath = buildPathByField(
        String(existing.ulok_id),
        "kplt",
        "form_ukur",
        file.name,
        file.type
      );
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, file, { upsert: false, contentType: file.type });

      if (uploadErr) {
        console.error("[FORM_UKUR_UPLOAD]", uploadErr);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
      }

      newFilePath = objectPath;
      rawPayload.form_ukur = newFilePath;
    } else {
      // Validasi wajib file jika belum ada data tanggal_ukur (asumsi logic lama)
      if (!rawPayload.tanggal_ukur) {
        return NextResponse.json(
          { error: "File form_ukur wajib diupload" },
          { status: 400 }
        );
      }
    }

    // Normalisasi path
    if (typeof rawPayload.form_ukur === "string") {
      rawPayload.form_ukur = stripBucketPrefix(rawPayload.form_ukur);
    }

    // 4. Validate Payload
    const parsed = FormUkurUpdateSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (newFilePath)
        await supabase.storage
          .from(BUCKET)
          .remove([newFilePath])
          .catch(() => {});
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // 5. Update Database
    const oldPath = existing.form_ukur as string | null;
    const { data: updated, error: updateErr } = await supabase
      .from("kplt")
      .update({
        ...parsed.data,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", kpltId)
      .eq("branch_id", user.branch_id)
      .select("*")
      .single();

    if (updateErr) {
      if (newFilePath)
        await supabase.storage
          .from(BUCKET)
          .remove([newFilePath])
          .catch(() => {});
      console.error("[FORM_UKUR_DB_UPDATE]", updateErr);
      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 }
      );
    }

    // 6. Cleanup Old File
    let removedOld = false;
    if (newFilePath && oldPath && oldPath !== newFilePath) {
      await supabase.storage
        .from(BUCKET)
        .remove([oldPath])
        .then(() => (removedOld = true))
        .catch(() => {});
    }

    return NextResponse.json({
      data: updated,
      new_form_ukur: newFilePath || null,
      removedOld,
    });
  } catch (err) {
    console.error("[FORM_UKUR_PATCH] Unhandled:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
