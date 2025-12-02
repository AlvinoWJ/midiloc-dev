import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canKplt, POSITION } from "@/lib/auth/acl";
import { buildPathByField, isUuid } from "@/lib/storage/path";
import { KpltCreatePayloadSchema } from "@/lib/validations/kplt";
import { isImageFile, isPdfFile } from "@/utils/fileChecker";

export const dynamic = "force-dynamic";

const BUCKET = "file_storage";
const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15MB

const LMUpdateSchema = KpltCreatePayloadSchema.pick({
  approval_intip: true,
  tanggal_approval_intip: true,
  file_intip: true,
}).partial();

const stripBucketPrefix = (p: string) =>
  p.replace(new RegExp(`^${BUCKET}/`), "");

/**
 * @route PATCH /api/kplt/[id]/file_intip
 * @description Upload/Update File Intip & Approval Intip oleh Location Manager.
 * @content multipart/form-data
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const kpltId = (params?.id || "").trim();
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
      .select("id, branch_id, ulok_id, file_intip")
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

    // Handle Text Fields (support alias)
    const approvalIntip = form.get("approval_intip");
    if (typeof approvalIntip === "string" && approvalIntip.trim()) {
      rawPayload.approval_intip = approvalIntip.trim();
    }

    const tanggalApproval = form.get("tanggal_approval_intip");
    const tanggalIntip = form.get("tanggal_intip");
    if (typeof tanggalApproval === "string" && tanggalApproval.trim()) {
      rawPayload.tanggal_approval_intip = tanggalApproval.trim();
    } else if (typeof tanggalIntip === "string" && tanggalIntip.trim()) {
      rawPayload.tanggal_approval_intip = tanggalIntip.trim();
    }

    // Handle File
    const file = (form.get("file_intip") || form.get("file")) as File | null;

    if (file instanceof File) {
      if (file.size === 0)
        return NextResponse.json({ error: "File kosong" }, { status: 400 });
      if (file.size > MAX_DOC_SIZE)
        return NextResponse.json(
          { error: "File terlalu besar (max 15MB)" },
          { status: 400 }
        );

      // Validasi Tipe File
      const isPdf = (await isPdfFile(file)).ok;
      const isImg = !isPdf && (await isImageFile(file)).ok;

      if (!isPdf && !isImg) {
        return NextResponse.json(
          { error: "Format file tidak valid (PDF/Image only)" },
          { status: 422 }
        );
      }

      // Upload
      const objectPath = buildPathByField(
        String(existing.ulok_id),
        "kplt",
        "file_intip",
        file.name,
        file.type
      );
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, file, { upsert: false, contentType: file.type });

      if (uploadErr) {
        console.error("[FILE_INTIP_UPLOAD]", uploadErr);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
      }

      newFilePath = objectPath;
      rawPayload.file_intip = newFilePath;
    } else {
      // Validasi kelengkapan jika tidak ada file
      if (!rawPayload.approval_intip && !rawPayload.tanggal_approval_intip) {
        return NextResponse.json(
          { error: "File file_intip wajib diupload" },
          { status: 400 }
        );
      }
    }

    // Normalisasi path
    if (typeof rawPayload.file_intip === "string") {
      rawPayload.file_intip = stripBucketPrefix(rawPayload.file_intip);
    }

    // 4. Validate Payload
    const parsed = LMUpdateSchema.safeParse(rawPayload);
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

    // 5. Update DB
    const oldPath = existing.file_intip as string | null;
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
      console.error("[FILE_INTIP_DB]", updateErr);
      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 }
      );
    }

    // 6. Cleanup
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
      new_file_intip: newFilePath || null,
      removedOld,
    });
  } catch (err) {
    console.error("[FILE_INTIP_PATCH] Unhandled:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
