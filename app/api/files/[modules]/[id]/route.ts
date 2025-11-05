/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";

const BUCKET = "file_storage";
const ALLOWED_MODULES = [
  "kplt",
  "ulok",
  "mou",
  "perizinan",
  "notaris",
  "renovasi",
  "izin_tetangga",
  "grang_opening",
] as const;
type AllowedModule = (typeof ALLOWED_MODULES)[number];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isUuid(v: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    v
  );
}

function mimeFromExt(ext: string) {
  const e = ext.toLowerCase();
  if (e === ".pdf") return "application/pdf";
  if (e === ".xlsx")
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (e === ".xls") return "application/vnd.ms-excel";
  if (e === ".csv") return "text/csv";
  if (e === ".mp4") return "video/mp4";
  if (e === ".mov") return "video/quicktime";
  if (e === ".webm") return "video/webm";
  if (e === ".avi") return "video/x-msvideo";
  if (e === ".png") return "image/png";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".webp") return "image/webp";
  return "application/octet-stream";
}

// Resolve ulok_id dan branch scope berdasarkan modules + id
async function resolveUlokAndBranch(
  supabase: any,
  modules: AllowedModule,
  id: string
): Promise<{ ulokId: string; branchId: string | null }> {
  if (modules === "ulok") {
    const { data, error } = await supabase
      .from("ulok")
      .select("id, branch_id")
      .eq("id", id)
      .single();
    if (error || !data) throw new Error("ULOK not found");
    return { ulokId: String(data.id), branchId: data.branch_id ?? null };
  }

  if (modules === "kplt") {
    const { data, error } = await supabase
      .from("kplt")
      .select("ulok_id, branch_id")
      .eq("id", id)
      .single();
    if (error || !data?.ulok_id) throw new Error("KPLT not found");
    return { ulokId: String(data.ulok_id), branchId: data.branch_id ?? null };
  }

  // modules === "mou" | "perizinan" -> id dianggap progress_kplt_id
  const { data, error } = await supabase
    .from("progress_kplt")
    .select(
      `
      id,
      kplt:kplt!progress_kplt_kplt_id_fkey!inner (
        id,
        ulok_id,
        branch_id
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.kplt?.ulok_id) throw new Error("Progress not found");
  return {
    ulokId: String((data as any).kplt.ulok_id),
    branchId: (data as any).kplt.branch_id ?? null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { modules: string; id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const modulesFile = params.modules as AllowedModule;
  const rawId = params.id;

  if (!ALLOWED_MODULES.includes(modulesFile)) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid modules" },
      { status: 400 }
    );
  }
  if (!isUuid(rawId)) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid id" },
      { status: 400 }
    );
  }

  // Resolve ulok_id + branch scope sesuai modules
  let ulokId: string;
  let branchId: string | null = null;
  try {
    const ctx = await resolveUlokAndBranch(supabase, modulesFile, rawId);
    ulokId = ctx.ulokId;
    branchId = ctx.branchId;
  } catch (e: any) {
    const msg = e?.message || "Not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  // Validasi branch akses
  if (branchId && user.branch_id && branchId !== user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "Cross-branch access" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "redirect"; // redirect | proxy
  const forceDownload = url.searchParams.get("download") === "1";
  const expiresIn = Number(url.searchParams.get("expiresIn") || "300"); // detik (default 5 menit)

  const pathParam = url.searchParams.get("path"); // full path: "<ulok_id>/<modules>/file.ext"
  const nameParam = url.searchParams.get("name"); // filename di folder
  const fieldParam = url.searchParams.get("field"); // nama "field" (mencari nama file yang mengandung _<field>)

  const folder = `${ulokId}/${modulesFile}`;

  // 1) Prioritas: path penuh jika diberikan
  let resolvedPath: string | null = null;
  if (pathParam) {
    if (!pathParam.startsWith(`${ulokId}/${modulesFile}/`)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Path must be under this ulok_id/modules folder",
        },
        { status: 403 }
      );
    }
    resolvedPath = pathParam;
  } else if (nameParam) {
    // 2) name -> langsung konstruksi path
    resolvedPath = `${folder}/${nameParam}`;
  } else if (fieldParam) {
    // 3) field -> list, cari file terbaru yang match _<field>
    const slug = slugify(fieldParam);
    const { data: list, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list(folder, {
        limit: 1000,
        sortBy: { column: "name", order: "desc" },
      });

    if (listErr) {
      return NextResponse.json(
        { error: "Listing failed", message: listErr.message },
        { status: 500 }
      );
    }
    const found = (list ?? []).find((o) =>
      o.name.toLowerCase().includes(`_${slug}`.toLowerCase())
    );
    if (!found) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: `File for field '${fieldParam}' not found`,
        },
        { status: 404 }
      );
    }
    resolvedPath = `${folder}/${found.name}`;
  } else {
    // 4) Tanpa seleksi -> listing
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "100");
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 100;
    const offset = (safePage - 1) * safeLimit;

    const { data: list, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list(folder, {
        limit: safeLimit,
        offset,
        sortBy: { column: "name", order: "desc" },
      });

    if (listErr) {
      return NextResponse.json(
        { error: "Listing failed", message: listErr.message },
        { status: 500 }
      );
    }

    const files = (list ?? []).map((o) => {
      const filename = o.name;
      // Pola nama: 1761021305744_file_intip.png => coba tebak "field" dari bagian setelah underscore pertama (opsional)
      const m = filename.match(/^\d+_([a-z0-9_.-]+)\.[a-z0-9]+$/i);
      const guessedField = m ? m[1] : null;
      return {
        name: filename,
        field: guessedField,
        size: o.metadata?.size ?? null,
        last_modified: o.updated_at ?? null,
        href: `/api/files/${modulesFile}/${rawId}?name=${encodeURIComponent(
          filename
        )}`,
      };
    });

    return NextResponse.json(
      {
        modulesFile,
        id: rawId,
        ulok_id: ulokId,
        folder,
        page: safePage,
        limit: safeLimit,
        count: files.length,
        files,
      },
      { status: 200 }
    );
  }

  if (!resolvedPath) {
    return NextResponse.json(
      { error: "Not Found", message: "No file selected" },
      { status: 404 }
    );
  }

  // Sajikan file
  if (mode === "proxy") {
    const { data: fileData, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(resolvedPath);

    if (dlErr || !fileData) {
      return NextResponse.json(
        { error: "Download failed", message: dlErr?.message || "Not found" },
        { status: 404 }
      );
    }

    const filename = resolvedPath.split("/").pop() || "file";
    const extMatch = filename.match(/\.[a-z0-9]+$/i);
    const ct = mimeFromExt(extMatch ? extMatch[0] : "");

    return new Response(fileData, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `${
          forceDownload ? "attachment" : "inline"
        }; filename="${encodeURIComponent(filename)}"`,
      },
    });
  }

  // redirect (default signed URL)
  const downloadName = forceDownload
    ? resolvedPath.split("/").pop() || "file"
    : undefined;
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      resolvedPath,
      Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 300,
      { download: downloadName }
    );

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      {
        error: "Sign failed",
        message: signErr?.message || "Object may not exist",
      },
      { status: 404 }
    );
  }

  return NextResponse.redirect(signed.signedUrl, 302);
}
