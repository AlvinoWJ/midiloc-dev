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
import {
  isPdfFile,
  isExcelFile,
  isVideoFile,
  isImageFile,
} from "@/utils/fileChecker";

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

function decodeCursor(
  encoded?: string | null
): { created_at: string; id: string } | null {
  if (!encoded) return null;
  try {
    const base = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      base.length % 4 === 0 ? base : base + "=".repeat(4 - (base.length % 4));
    const raw = Buffer.from(pad, "base64").toString("utf8");
    const obj = JSON.parse(raw);
    if (obj.created_at && obj.id)
      return { created_at: obj.created_at, id: obj.id };
  } catch {}
  return null;
}

function encodeCursor(
  created_at?: string | null,
  id?: string | null
): string | null {
  if (!created_at || !id) return null;
  const json = JSON.stringify({ created_at, id });
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

// GET /api/kplt?scope=recent&limit=100&after=<cursor>&before=<cursor>
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  if (!canKplt("read", user))
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );

  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "recent").toLowerCase() as
    | "recent"
    | "history";
  const search = (
    url.searchParams.get("search") ||
    url.searchParams.get("q") ||
    ""
  ).trim();

  const monthRaw =
    url.searchParams.get("month") ?? url.searchParams.get("bulan");
  const yearRaw = url.searchParams.get("year") ?? url.searchParams.get("tahun");
  const month = monthRaw ? Number(monthRaw) : undefined;
  const year = yearRaw ? Number(yearRaw) : undefined;
  const validMonth = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12;
  const validYear = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1970 && (v as number) <= 2100;
  if ((monthRaw && !validMonth(month)) || (yearRaw && !validYear(year))) {
    return NextResponse.json(
      {
        success: false,
        error: "Bad Request",
        message: "Invalid month/year. month=1..12 year=1970..2100",
      },
      { status: 422 }
    );
  }

  const limitRaw = Number(url.searchParams.get("limit") ?? "90");
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 300) : 90;

  const afterDecoded = decodeCursor(url.searchParams.get("after"));
  const beforeDecoded = decodeCursor(url.searchParams.get("before"));

  const { data, error } = await supabase.rpc("fn_kplt_dashboard", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String(
      (user as { position_nama?: string }).position_nama ?? ""
    ).toLowerCase(),
    p_scope: scope,
    p_search: search || null,
    p_limit: limit,
    p_after_created_at: afterDecoded?.created_at ?? null,
    p_after_id: afterDecoded?.id ?? null,
    p_before_created_at: beforeDecoded?.created_at ?? null,
    p_before_id: beforeDecoded?.id ?? null,
    p_month: month ?? null,
    p_year: year ?? null,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        detail: error.message ?? String(error),
      },
      { status: 500 }
    );
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      {
        success: true,
        scope,
        filters: { month: month ?? null, year: year ?? null, search },
        data: {},
        pagination: {},
      },
      { status: 200 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = data;
  const pag = d.pagination || {};
  const pagination: Record<string, unknown> = {};

  if (scope === "recent" && pag.recent) {
    const r = pag.recent;
    pagination.recent = {
      limit: r.limit,
      count_needinput: r.count_needinput,
      count_inprogress: r.count_inprogress,
      count_waitingforum: r.count_waitingforum,
      total: r.total,
      hasNextPage: r.hasNextPage,
      hasPrevPage: r.hasPrevPage,
      startCursor: encodeCursor(r.start_created_at, r.start_id),
      endCursor: encodeCursor(r.end_created_at, r.end_id),
    };
  }

  if (scope === "history" && pag.oknok) {
    const h = pag.oknok;
    pagination.oknok = {
      limit: h.limit,
      count_ok: h.count_ok,
      count_nok: h.count_nok,
      total: h.total,
      hasNextPage: h.hasNextPage,
      hasPrevPage: h.hasPrevPage,
      startCursor: encodeCursor(h.start_created_at, h.start_id),
      endCursor: encodeCursor(h.end_created_at, h.end_id),
    };
  }

  return NextResponse.json(
    {
      success: d.success,
      scope: d.scope,
      filters: d.filters,
      data: d.data,
      pagination,
    },
    { status: 200 }
  );
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

      // PDFs (.pdf)
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

          const pdfCheck = await isPdfFile(entry);
          if (!pdfCheck.ok) {
            return NextResponse.json(
              { error: `File ${field} tidak valid: ${pdfCheck.reason}` },
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

      // Excel (.xlsx, .xls)
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

          const excelCheck = await isExcelFile(entry);
          if (!excelCheck.ok) {
            return NextResponse.json(
              { error: `File ${field} tidak valid: ${excelCheck.reason}` },
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

      // Videos (.png, .jpg, .jpeg, .webp)
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

          const videoCheck = await isVideoFile(entry);
          if (!videoCheck.ok) {
            return NextResponse.json(
              { error: `File ${field} tidak valid: ${videoCheck.reason}` },
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

      // Images (.mp4, .mov, .avi, .webm)
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

          const imageCheck = await isImageFile(entry);
          if (!imageCheck.ok) {
            return NextResponse.json(
              { error: `File ${field} tidak valid: ${imageCheck.reason}` },
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
