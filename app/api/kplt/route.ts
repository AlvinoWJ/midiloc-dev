/* eslint-disable @typescript-eslint/no-explicit-any */
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
const MAX_FILE = 200 * 1024 * 1024; // 200MB video max

type SupaClient = Awaited<ReturnType<typeof createClient>>;

function parseMonthYear(url: URL) {
  const mRaw = url.searchParams.get("month") ?? url.searchParams.get("bulan");
  const yRaw = url.searchParams.get("year") ?? url.searchParams.get("tahun");

  const month = mRaw ? Number(mRaw) : undefined;
  const year = yRaw ? Number(yRaw) : undefined;

  const isValidMonth = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12;
  const isValidYear = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1970 && (v as number) <= 2100;

  if ((mRaw && !isValidMonth(month)) || (yRaw && !isValidYear(year))) {
    return { error: "Invalid month/year. month=1..12, year=1970..2100" };
  }
  return { month, year };
}

function normalizeView(v: string | null): ViewMode {
  const k = (v || "all").toLowerCase();
  return (["all", "ulok_ok", "existing"] as const).includes(k as ViewMode)
    ? (k as ViewMode)
    : "all";
}

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

/**
 * POST /api/kplt
 * Create KPLT from an approved ULOK (multipart or JSON)
 */
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

/**
 * GET /api/kplt
 * Query params:
 *  - view=all|ulok_ok|existing
 *  - q / search = string (case-insensitive)
 *  - page_ulok_ok, limit_ulok_ok
 *  - page_existing, limit_existing
 *  - (fallback page & limit if specific ones missing)
 */
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
  const view = normalizeView(url.searchParams.get("view"));
  const q = (
    url.searchParams.get("q") ||
    url.searchParams.get("search") ||
    ""
  ).trim();

  // Month / Year parsing
  const {
    month,
    year,
    error: timeError,
  } = parseMonthYear(url) as {
    month?: number;
    year?: number;
    error?: string;
  };
  if (timeError) {
    return NextResponse.json(
      { success: false, error: "Bad Request", message: timeError },
      { status: 422 }
    );
  }

  const pageGeneral = Number(url.searchParams.get("page") ?? "1");
  const limitGeneral = Number(url.searchParams.get("limit") ?? "10");

  const pageUlokOk = Number(
    url.searchParams.get("page_ulok_ok") ?? pageGeneral
  );
  const limitUlokOk = Number(
    url.searchParams.get("limit_ulok_ok") ?? limitGeneral
  );
  const pageExisting = Number(
    url.searchParams.get("page_existing") ?? pageGeneral
  );
  const limitExisting = Number(
    url.searchParams.get("limit_existing") ?? limitGeneral
  );

  const safePageUlokOk =
    Number.isFinite(pageUlokOk) && pageUlokOk > 0 ? pageUlokOk : 1;
  const safeLimitUlokOk =
    Number.isFinite(limitUlokOk) && limitUlokOk > 0
      ? Math.min(limitUlokOk, 500)
      : 10;

  const safePageExisting =
    Number.isFinite(pageExisting) && pageExisting > 0 ? pageExisting : 1;
  const safeLimitExisting =
    Number.isFinite(limitExisting) && limitExisting > 0
      ? Math.min(limitExisting, 500)
      : 10;

  const { data, error } = await supabase.rpc("fn_kplt_dashboard", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String((user as any).position_nama ?? "").toLowerCase(),
    p_view: view,
    p_search: q || null,
    p_page_ulok_ok: safePageUlokOk,
    p_limit_ulok_ok: safeLimitUlokOk,
    p_page_existing: safePageExisting,
    p_limit_existing: safeLimitExisting,
    p_month: month ?? null,
    p_year: year ?? null,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        detail: (error as any).message ?? error,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      view,
      search: q || undefined,
      ...(data as Record<string, unknown>),
    },
    { status: 200 }
  );
}
