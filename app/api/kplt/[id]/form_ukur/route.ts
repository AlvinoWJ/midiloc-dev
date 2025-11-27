import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { buildPathByField,  isUuid } from "@/lib/storage/path";
import { KpltCreatePayloadSchema } from "@/lib/validations/kplt";
import { isImageFile, isPdfFile } from "@/utils/fileChecker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "file_storage";
const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15MB

// Hanya field LM yang diizinkan di endpoint ini
const FormUkurUpdateSchema = KpltCreatePayloadSchema.pick({
  form_ukur: true,
  tanggal_ukur: true,
}).partial();

// Normalisasi: pastikan yang disimpan hanya object path relatif (tanpa "file_storage/")
const stripBucketPrefix = (p: string) =>
  p.replace(new RegExp(`^${BUCKET}/`), "");

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (String(user.position_nama).toLowerCase() !== "location manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const kpltId = (params?.id || "").trim();
  if (!isUuid(kpltId)) {
    return NextResponse.json({ error: "Invalid kplt_id" }, { status: 422 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json(
      { error: "Gunakan multipart/form-data untuk upload form_ukur" },
      { status: 400 }
    );
  }

  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden: user tidak memiliki branch" },
      { status: 403 }
    );
  }

  const { data: existing, error: existErr } = await supabase
    .from("kplt")
    .select("id, branch_id, ulok_id, form_ukur")
    .eq("id", kpltId)
    .eq("branch_id", user.branch_id)
    .single();

  if (existErr || !existing) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  if (!form)
    return NextResponse.json({ error: "Invalid form-data" }, { status: 400 });

  // Kumpulkan key untuk debug jika file tidak terbaca
  const receivedKeys: string[] = [];
  for (const [k] of form.entries()) receivedKeys.push(k);

  // Non-file fields
  const rawPayload: Record<string, unknown> = {};
  const tanggalUkur = form.get("tanggal_ukur");
  if (typeof tanggalUkur === "string" && tanggalUkur.trim()) {
    rawPayload.tanggal_ukur = tanggalUkur.trim();
  }

  // Ambil file pada key "form_ukur" atau fallback "file"
  let file: File | null = null;
  const candidates = ["form_ukur", "file"];
  for (const key of candidates) {
    const v = form.get(key);
    if (v instanceof File) {
      file = v;
      break;
    }
  }

  let newFilePath: string | undefined;

  if (file) {
    if (file.size === 0) {
      return NextResponse.json(
        { error: "File form_ukur kosong" },
        { status: 400 }
      );
    }
    if (file.size > MAX_DOC_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar (maks 15MB)" },
        { status: 400 }
      );
    }
    let isFileValid = false;
    let errorReason = "Format file tidak dikenali";

    // Cek apakah PDF?
    const pdfCheck = await isPdfFile(file);
    if (pdfCheck.ok) {
      isFileValid = true;
    } else {
      // Jika bukan PDF, Cek apakah Image?
      const imgCheck = await isImageFile(file);
      if (imgCheck.ok) {
        isFileValid = true;
      } else {
        errorReason = "File bukan PDF atau Gambar valid (Signature mismatch)";
      }
    }

    if (!isFileValid) {
      return NextResponse.json(
        { error: "Invalid File", detail: errorReason },
        { status: 422 }
      );
    }

    // <ulok_id>/kplt/<ts>_form_ukur.<ext>
    const objectPath = buildPathByField(
      String(existing.ulok_id),
      "kplt",
      "form_ukur",
      file.name,
      file.type
    );

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: "Upload failed", detail: uploadErr.message },
        { status: 500 }
      );
    }

    newFilePath = objectPath;
    rawPayload.form_ukur = newFilePath;
  } else {
    if (!rawPayload.tanggal_ukur) {
      return NextResponse.json(
        {
          error: "No file provided",
          message: "Kirim field form_ukur (type File) di form-data.",
          receivedKeys,
        },
        { status: 400 }
      );
    }
  }

  // Normalisasi: jangan simpan prefix bucket
  if (typeof rawPayload.form_ukur === "string") {
    rawPayload.form_ukur = stripBucketPrefix(rawPayload.form_ukur);
  }

  // Validasi
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

  const payloadToUpdate = { ...parsed.data };

  const oldPath = (existing.form_ukur as string | null) || null;
  const { data: updated, error: updateErr } = await supabase
    .from("kplt")
    .update({
      ...payloadToUpdate,
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
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

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
    old_form_ukur: oldPath,
    receivedKeys,
  });
}
