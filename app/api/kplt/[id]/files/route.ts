import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";

const BUCKET = "file_storage";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const kpltId = params.id;
  if (!isUuid(kpltId)) {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid id" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "redirect"; // redirect | proxy
  const forceDownload = url.searchParams.get("download") === "1";
  const expiresIn = Number(url.searchParams.get("expiresIn") || "300"); // detik (default 5 menit)

  const pathParam = url.searchParams.get("path"); // full path: "<ulok_id>/kplt/ts_field.ext"
  const nameParam = url.searchParams.get("name"); // filename di folder
  const fieldParam = url.searchParams.get("field"); // nama field (ambil terbaru)

  // Ambil ulok_id dan branch_id via SELECT ringan
  const { data: kpltRow, error: kpltErr } = await supabase
    .from("kplt")
    .select("ulok_id, branch_id")
    .eq("id", kpltId)
    .single();

  if (kpltErr || !kpltRow?.ulok_id) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  // Validasi branch akses
  if (
    kpltRow.branch_id &&
    user.branch_id &&
    kpltRow.branch_id !== user.branch_id
  ) {
    return NextResponse.json(
      { error: "Forbidden", message: "Cross-branch access" },
      { status: 403 }
    );
  }

  const ulokId = String(kpltRow.ulok_id);
  const folder = `${ulokId}/kplt`;

  // 1) Prioritas: path penuh dari tabel (paling hemat — tanpa list)
  let resolvedPath: string | null = null;
  if (pathParam) {
    // pastikan path sesuai ulokId ini
    if (!pathParam.startsWith(`${ulokId}/kplt/`)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Path must be under this ulok_id/kplt folder",
        },
        { status: 403 }
      );
    }
    resolvedPath = pathParam;
  } else if (nameParam) {
    // 2) name -> langsung konstruksi path (tanpa list)
    resolvedPath = `${folder}/${nameParam}`;
  } else if (fieldParam) {
    // 3) field -> perlu list untuk mencari file terbaru yang match _<field>
    const slug = slugify(fieldParam);
    const { data: list, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list(folder, {
        limit: 1000,
        sortBy: { column: "name", order: "desc" }, // ts terbesar biasanya muncul dulu
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
    // 4) Tidak ada seleksi -> kembalikan daftar (boleh dipaginasi)
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
      const m = filename.match(/^\d+_([a-z0-9_.-]+)\.[a-z0-9]+$/i);
      const guessedField = m ? m[1] : null;
      return {
        name: filename,
        field: guessedField,
        size: o.metadata?.size ?? null,
        last_modified: o.updated_at ?? null,
        href: `/api/kplt/${kpltId}/files?name=${encodeURIComponent(filename)}`,
      };
    });

    return NextResponse.json(
      {
        kplt_id: kpltId,
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

  // redirect (default)
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
