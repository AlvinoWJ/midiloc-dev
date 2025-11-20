import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

const BUCKET = "file_storage";
const MAX_FILE = 200 * 1024 * 1024; // 200MB video max

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

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", message: "User must login" },
      { status: 401 }
    );
  }
  if (!canKplt("read", user)) {
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "Access denied" },
      { status: 403 }
    );
  }
  if (!user.branch_id) {
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "recent").toLowerCase() as
    | "recent"
    | "history";
  const q = (
    url.searchParams.get("q") ||
    url.searchParams.get("search") ||
    ""
  ).trim();

  // Filters
  const mRaw = url.searchParams.get("month") ?? url.searchParams.get("bulan");
  const yRaw = url.searchParams.get("year") ?? url.searchParams.get("tahun");
  const month = mRaw ? Number(mRaw) : undefined;
  const year = yRaw ? Number(yRaw) : undefined;
  const isValidMonth = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12;
  const isValidYear = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1970 && (v as number) <= 2100;
  if ((mRaw && !isValidMonth(month)) || (yRaw && !isValidYear(year))) {
    return NextResponse.json(
      {
        success: false,
        error: "Bad Request",
        message: "Invalid month/year. month=1..12, year=1970..2100",
      },
      { status: 422 }
    );
  }

  // Recent cursors
  const limitNeedInput = Number(url.searchParams.get("limit") ?? "9");
  const afterNeedInputAt = url.searchParams.get("afterNeedInputAt");
  const afterNeedInputId = url.searchParams.get("afterNeedInputId");

  const limitInProgress = Number(url.searchParams.get("limit") ?? "9");
  const afterInProgressAt = url.searchParams.get("afterInProgressAt");
  const afterInProgressId = url.searchParams.get("afterInProgressId");

  // History cursors
  const limitOk = Number(url.searchParams.get("limit") ?? "9");
  const afterOkAt = url.searchParams.get("afterOkAt");
  const afterOkId = url.searchParams.get("afterOkId");

  const limitNok = Number(url.searchParams.get("limit") ?? "9");
  const afterNokAt = url.searchParams.get("afterNokAt");
  const afterNokId = url.searchParams.get("afterNokId");

  try {
    const { data, error } = await supabase.rpc("fn_kplt_dashboard", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_position: String((user as any).position_nama ?? "").toLowerCase(),
      p_scope: scope,
      p_search: q || null,

      p_limit_need_input: limitNeedInput,
      p_after_need_input_created_at: afterNeedInputAt
        ? new Date(afterNeedInputAt).toISOString()
        : null,
      p_after_need_input_id: afterNeedInputId || null,

      p_limit_in_progress: limitInProgress,
      p_after_in_progress_created_at: afterInProgressAt
        ? new Date(afterInProgressAt).toISOString()
        : null,
      p_after_in_progress_id: afterInProgressId || null,

      p_limit_ok: limitOk,
      p_after_ok_created_at: afterOkAt
        ? new Date(afterOkAt).toISOString()
        : null,
      p_after_ok_id: afterOkId || null,

      p_limit_nok: limitNok,
      p_after_nok_created_at: afterNokAt
        ? new Date(afterNokAt).toISOString()
        : null,
      p_after_nok_id: afterNokId || null,

      p_month: month ?? null,
      p_year: year ?? null,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch data",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          detail: (error as any).message ?? error,
        },
        { status: 500 }
      );
    }

    // Data dari fungsi sudah final sesuai format baru: tanpa start_at/start_id/end_at/end_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (data as any) || {};

    // Normalisasi supaya selalu ada 4 grup di bawah "data"
    const dataBlock =
      d.data && typeof d.data === "object"
        ? d.data
        : {
            needinput: d.needinput ?? [],
            inprogress: d.inprogress ?? [],
            ok: d.ok ?? [],
            nok: d.nok ?? [],
          };

    const ordered = {
      success: Boolean(d.success),
      scope: d.scope ?? (url.searchParams.get("scope") || "recent"),
      filters: d.filters ?? { month: null, year: null, search: null },
      data: {
        needinput: dataBlock.needinput ?? [],
        inprogress: dataBlock.inprogress ?? [],
        ok: dataBlock.ok ?? [],
        nok: dataBlock.nok ?? [],
      },
      pagination: d.pagination ?? {
        needinput: {
          limit: 9,
          cursor: {
            hasNextPage: false,
            hasPrevPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
        inprogress: {
          limit: 9,
          cursor: {
            hasNextPage: false,
            hasPrevPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
        ok: {
          limit: 9,
          cursor: {
            hasNextPage: false,
            hasPrevPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
        nok: {
          limit: 9,
          cursor: {
            hasNextPage: false,
            hasPrevPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      },
    };

    return NextResponse.json(ordered, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server internal",
        error:
          process.env.NODE_ENV === "development"
            ? e?.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
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

    const uploadedPaths: string[] = [];
    let ulokId = "";
    let payload: Record<string, unknown> = {};

    if (isMultipart) {
      const form = await req.formData().catch(() => null);
      if (!form) {
        return NextResponse.json(
          { error: "Bad Request", message: "Invalid multipart form" },
          { status: 400 }
        );
      }

      ulokId = String(form.get("ulok_id") ?? "").trim();
      if (!isUuid(ulokId)) {
        return NextResponse.json({ error: "Invalid ulok_id" }, { status: 422 });
      }

      // Plain fields
      for (const [k, v] of form.entries()) {
        if (k === "ulok_id") continue;
        if (v instanceof File) continue;
        if (typeof v === "string") payload[k] = v;
      }

      if (payload.progress_toko === "") payload.progress_toko = null;

      const ensureSize = (f: File, max: number) => {
        if (f.size === 0) throw new Error("Empty file");
        if (f.size > max)
          throw new Error(
            `File too large (max ${Math.round(max / (1024 * 1024))}MB)`
          );
      };

      // PDFs
      for (const field of PDF_FIELDS) {
        const entry = form.get(field);
        if (entry && entry instanceof File) {
          ensureSize(entry, 20 * 1024 * 1024);
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
          uploadedPaths.push(path);
          payload[field] = path;
        }
      }

      // Excel
      for (const field of EXCEL_FIELDS) {
        const entry = form.get(field);
        if (entry && entry instanceof File) {
          ensureSize(entry, 20 * 1024 * 1024);
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
          uploadedPaths.push(path);
          payload[field] = path;
        }
      }

      // Videos
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
          uploadedPaths.push(path);
          payload[field] = path;
        }
      }

      // Images
      for (const field of IMAGE_FIELDS) {
        const entry = form.get(field);
        if (entry && entry instanceof File) {
          ensureSize(entry, 20 * 1024 * 1024);
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
          uploadedPaths.push(path);
          payload[field] = path;
        }
      }
    } else {
      // JSON mode
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

    const { data, error } = await supabase.rpc("fn_kplt_create_from_ulok", {
      p_user_id: user.id,
      p_ulok_id: ulokId,
      p_payload: parsed.data,
    });

    if (error) {
      if (uploadedPaths.length) {
        await supabase.storage
          .from(BUCKET)
          .remove(uploadedPaths)
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

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Server Error", message },
      { status: 500 }
    );
  }
}
