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

// GET /api/kplt?scope=recent&search=&limitNeedInput=9&afterNeedInput=<cursor>&beforeNeedInput=<cursor>
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
  if (!user.branch_id)
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "User has no branch" },
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

  // Month/year
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

  // Limits per group
  const limitNeedInput = Number(url.searchParams.get("limitNeedInput") ?? "9");
  const limitInProgress = Number(
    url.searchParams.get("limitInProgress") ?? "9"
  );
  const limitOk = Number(url.searchParams.get("limitOk") ?? "9");
  const limitNok = Number(url.searchParams.get("limitNok") ?? "9");

  const safeNeed =
    Number.isFinite(limitNeedInput) && limitNeedInput > 0
      ? Math.min(limitNeedInput, 100)
      : 9;
  const safeProg =
    Number.isFinite(limitInProgress) && limitInProgress > 0
      ? Math.min(limitInProgress, 100)
      : 9;
  const safeOk =
    Number.isFinite(limitOk) && limitOk > 0 ? Math.min(limitOk, 100) : 9;
  const safeNok =
    Number.isFinite(limitNok) && limitNok > 0 ? Math.min(limitNok, 100) : 9;

  // Encoded cursors (per grup)
  const afterNeedInputDec = decodeCursor(
    url.searchParams.get("afterNeedInput")
  );
  const beforeNeedInputDec = decodeCursor(
    url.searchParams.get("beforeNeedInput")
  );
  const afterInProgressDec = decodeCursor(
    url.searchParams.get("afterInProgress")
  );
  const beforeInProgressDec = decodeCursor(
    url.searchParams.get("beforeInProgress")
  );
  const afterOkDec = decodeCursor(url.searchParams.get("afterOk"));
  const beforeOkDec = decodeCursor(url.searchParams.get("beforeOk"));
  const afterNokDec = decodeCursor(url.searchParams.get("afterNok"));
  const beforeNokDec = decodeCursor(url.searchParams.get("beforeNok"));

  const { data, error } = await supabase.rpc("fn_kplt_dashboard", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String((user as { position_nama?: string }).position_nama ?? "").toLowerCase(),
    p_scope: scope,
    p_search: search || null,

    p_limit_need_input: safeNeed,
    p_limit_in_progress: safeProg,
    p_limit_ok: safeOk,
    p_limit_nok: safeNok,

    p_after_needinput_created_at: afterNeedInputDec?.created_at ?? null,
    p_after_needinput_id: afterNeedInputDec?.id ?? null,
    p_before_needinput_created_at: beforeNeedInputDec?.created_at ?? null,
    p_before_needinput_id: beforeNeedInputDec?.id ?? null,

    p_after_inprogress_created_at: afterInProgressDec?.created_at ?? null,
    p_after_inprogress_id: afterInProgressDec?.id ?? null,
    p_before_inprogress_created_at: beforeInProgressDec?.created_at ?? null,
    p_before_inprogress_id: beforeInProgressDec?.id ?? null,

    p_after_ok_created_at: afterOkDec?.created_at ?? null,
    p_after_ok_id: afterOkDec?.id ?? null,
    p_before_ok_created_at: beforeOkDec?.created_at ?? null,
    p_before_ok_id: beforeOkDec?.id ?? null,

    p_after_nok_created_at: afterNokDec?.created_at ?? null,
    p_after_nok_id: afterNokDec?.id ?? null,
    p_before_nok_created_at: beforeNokDec?.created_at ?? null,
    p_before_nok_id: beforeNokDec?.id ?? null,

    p_month: month ?? null,
    p_year: year ?? null,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        detail: (error as unknown as { message?: string }).message ?? error,
      },
      { status: 500 }
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json(
      {
        success: true,
        scope,
        filters: { month: month ?? null, year: year ?? null, search },
        data: { needinput: [], inprogress: [], ok: [], nok: [] },
        pagination: {},
      },
      { status: 200 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = data;
  const paginationRaw = d.pagination || {};

  function wrapGroup(groupName: string) {
    const g = paginationRaw[groupName] || {};
    return {
      limit:
        g.limit ??
        (groupName === "needinput"
          ? safeNeed
          : groupName === "inprogress"
          ? safeProg
          : groupName === "ok"
          ? safeOk
          : safeNok),
      count: g.count ?? 0,
      total: g.total ?? 0,
      hasNextPage: !!g.hasNextPage,
      hasPrevPage: !!g.hasPrevPage,
      startCursor: encodeCursor(g.start_created_at, g.start_id),
      endCursor: encodeCursor(g.end_created_at, g.end_id),
    };
  }

  const finalPagination = {
    needinput: wrapGroup("needinput"),
    inprogress: wrapGroup("inprogress"),
    ok: wrapGroup("ok"),
    nok: wrapGroup("nok"),
  };

  return NextResponse.json(
    {
      success: true,
      scope: d.scope,
      filters: d.filters,
      data: d.data,
      pagination: finalPagination,
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
