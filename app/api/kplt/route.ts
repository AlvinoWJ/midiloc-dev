import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { KpltCreateMultipartSchema } from "@/lib/validations/kplt";
import {
  buildPathByField,
  EXCEL_FIELDS,
  IMAGE_FIELDS,
  isDbError,
  isUuid,
  MIME,
  PDF_FIELDS,
  VIDEO_FIELDS,
} from "@/lib/storage/path";

type ViewMode = "all" | "ulok_ok" | "existing";

const BUCKET = "file_storage";
const MAX_FILE = 200 * 1024 * 1024; // 200MB max untuk video besar

type SupaClient = Awaited<ReturnType<typeof createClient>>;

async function upload(
  supabase: SupaClient,
  path: string,
  file: File,
  contentType?: string
) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: contentType || file.type || undefined,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canKplt("create", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const contentTypeHeader = req.headers.get("content-type") || "";
    const isMultipart = contentTypeHeader.startsWith("multipart/form-data");

    // Kumpulan path yang diupload untuk rollback bila perlu
    const uploaded: string[] = [];

    let ulokId = "";
    let payload: Record<string, unknown> = {};

    if (isMultipart) {
      const form = await req.formData().catch(() => null);
      if (!form) {
        return NextResponse.json(
          { error: "Bad Request", message: "Invalid multipart" },
          { status: 400 }
        );
      }

      ulokId = String(form.get("ulok_id") ?? "").trim();
      if (!isUuid(ulokId)) {
        return NextResponse.json({ error: "Invalid ulok_id" }, { status: 422 });
      }

      // Ambil field teks non-file
      for (const [k, v] of form.entries()) {
        if (k === "ulok_id") continue;
        if (v instanceof File) continue;
        if (typeof v === "string") {
          payload[k] = v;
        }
      }

      // Helper untuk ubah string jadi null
      if (payload.progress_toko === "") {
        payload.progress_toko = null;
      }

      const ensureSize = (f: File, max: number): void => {
        if (f.size === 0) throw new Error("Empty file");
        if (f.size > max)
          throw new Error(
            `File too large (max ${Math.round(max / (1024 * 1024))}MB)`
          );
      };

      // Upload PDF
      for (const field of PDF_FIELDS) {
        const entry = form.get(field);
        if (entry && entry instanceof File) {
          ensureSize(entry, 20 * 1024 * 1024); // 20MB pdf
          if (
            entry.type &&
            !MIME.pdf.includes(entry.type as (typeof MIME.pdf)[number])
          ) {
            return NextResponse.json(
              { error: `Invalid content-type for ${field}` },
              { status: 400 }
            );
          }
          const path = buildPathByField(
            ulokId,
            "kplt",
            field,
            entry.name,
            entry.type
          );
          await upload(supabase, path, entry, "application/pdf");
          uploaded.push(path);
          payload[field] = path;
        }
      }

      // Upload Excel
      for (const field of EXCEL_FIELDS) {
        const entry = form.get(field);
        if (entry && entry instanceof File) {
          ensureSize(entry, 20 * 1024 * 1024); // 20MB excel
          if (
            entry.type &&
            !MIME.excel.includes(entry.type as (typeof MIME.excel)[number])
          ) {
            return NextResponse.json(
              { error: `Invalid content-type for ${field}` },
              { status: 400 }
            );
          }
          const path = buildPathByField(
            ulokId,
            "kplt",
            field,
            entry.name,
            entry.type
          );
          await upload(
            supabase,
            path,
            entry,
            entry.type ||
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          uploaded.push(path);
          payload[field] = path;
        }
      }

      // Upload Video
      for (const field of VIDEO_FIELDS) {
        const entry = form.get(field);
        if (entry && entry instanceof File) {
          ensureSize(entry, MAX_FILE);
          if (
            entry.type &&
            !MIME.video.includes(entry.type as (typeof MIME.video)[number])
          ) {
            return NextResponse.json(
              { error: `Invalid content-type for ${field}` },
              { status: 400 }
            );
          }
          const path = buildPathByField(
            ulokId,
            "kplt",
            field,
            entry.name,
            entry.type
          );
          await upload(supabase, path, entry, entry.type || "video/mp4");
          uploaded.push(path);
          payload[field] = path;
        }
      }

      // Upload Image
      for (const field of IMAGE_FIELDS) {
        const entry = form.get(field);
        if (entry && entry instanceof File) {
          ensureSize(entry, 20 * 1024 * 1024); // 20MB image
          if (
            entry.type &&
            !MIME.image.includes(entry.type as (typeof MIME.image)[number])
          ) {
            return NextResponse.json(
              { error: `Invalid content-type for ${field}` },
              { status: 400 }
            );
          }
          const path = buildPathByField(
            ulokId,
            "kplt",
            field,
            entry.name,
            entry.type
          );
          await upload(supabase, path, entry, entry.type || "image/png");
          uploaded.push(path);
          payload[field] = path;
        }
      }
    } else {
      // JSON mode (path sudah disiapkan FE)
      const bodyUnknown = await req.json().catch(() => null);
      if (!bodyUnknown || typeof bodyUnknown !== "object") {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "Body must be JSON or use multipart/form-data",
          },
          { status: 400 }
        );
      }
      const body = bodyUnknown as Record<string, unknown>;
      ulokId = String(body.ulok_id ?? "").trim();
      if (!isUuid(ulokId)) {
        return NextResponse.json({ error: "Invalid ulok_id" }, { status: 422 });
      }
      // Hapus ulok_id dari payload
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ulok_id: _ignore, ...rest } = body;
      payload = rest;
    }

    const parsed = KpltCreateMultipartSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // Simpan via RPC
    const { data, error } = await supabase.rpc("fn_kplt_create_from_ulok", {
      p_user_id: user.id,
      p_ulok_id: ulokId,
      p_payload: parsed.data,
    });

    if (error) {
      // Rollback semua file yang barusan diupload
      if (uploaded.length) {
        await supabase.storage
          .from(BUCKET)
          .remove(uploaded)
          .catch(() => undefined);
      }
      const code = isDbError(error) ? error.code : undefined;
      const detail = isDbError(error)
        ? error.message || error.hint || "Unknown error"
        : "Unknown error";

      if (code === "23505") {
        return NextResponse.json(
          {
            error: "Conflict",
            message: "KPLT already exists for this ULOK",
            detail,
          },
          { status: 409 }
        );
      }
      if (code === "23503") {
        return NextResponse.json(
          { error: "Not Found", message: "ULOK not found", detail },
          { status: 404 }
        );
      }
      if (code === "22023" || code === "22P02") {
        return NextResponse.json(
          { error: "Bad Request", message: detail, code },
          { status: 400 }
        );
      }
      if (code === "42501") {
        return NextResponse.json(
          { error: "Forbidden", message: detail },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "RPC Error", code, message: detail },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Server Error", message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canKplt("read", user)) {
    return NextResponse.json(
      { error: "Forbidden", message: "Access denied" },
      { status: 403 }
    );
  }
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const viewParam = (searchParams.get("view") ?? "all").toLowerCase();
  const view: ViewMode = (["all", "ulok_ok", "existing"] as const).includes(
    viewParam as ViewMode
  )
    ? (viewParam as ViewMode)
    : "all";

  // 1 panggilan RPC saja
  const { data, error } = await supabase.rpc("fn_kplt_dashboard", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String(user.position_nama ?? "").toLowerCase(),
    p_view: view,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch data", detail: error.message ?? error },
      { status: 500 }
    );
  }

  // data sudah berbentuk payload JSON dari DB
  return NextResponse.json(
    data ?? {
      kplt_from_ulok_ok: [],
      kplt_existing: [],
      meta: { kplt_from_ulok_ok_count: 0, kplt_existing_count: 0 },
    },
    { status: 200 }
  );
}
