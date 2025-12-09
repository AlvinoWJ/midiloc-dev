import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canUlokEksternal, getCurrentUser, POSITION } from "@/lib/auth/acl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "file_storage_eksternal";

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

/**
 * @route GET /api/ulok_eksternal/[id]/files
 * @description Mengakses file `foto_lokasi` secara aman.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Pastikan ini milik user eksternal yang login
    if (!canUlokEksternal("read", user)) {
      return NextResponse.json(
        { error: "Forbidden", message: "Anda tidak berhak mengakses file ini" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // 1. Validate Access to Resource
    let query = supabase
      .from("ulok_eksternal")
      .select("id, foto_lokasi, penanggungjawab, branch_id") // Ambil field untuk validasi
      .eq("id", id)
      .limit(1);

    // Terapkan Logic "Role Filter" yang sama dengan endpoint data!
    const role = user.position_nama?.toLowerCase();

    if (role === POSITION.LOCATION_SPECIALIST) {
      query = query.eq("penanggungjawab", user.id);
    } else if (role === POSITION.LOCATION_MANAGER) {
      if (!user.branch_id)
        return NextResponse.json(
          { error: "Forbidden: No branch" },
          { status: 403 }
        );
      query = query.eq("branch_id", user.branch_id);
    }

    const { data: ulokEks, error } = await query.maybeSingle();

    if (error)
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    if (!ulokEks)
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    if (!ulokEks.foto_lokasi)
      return NextResponse.json({ error: "No file available" }, { status: 404 });

    // 2. Serve File
    const path = ulokEks.foto_lokasi as string;
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "redirect"; // redirect | proxy
    const forceDownload = url.searchParams.get("download") === "1";
    const expiresIn = Number(url.searchParams.get("expiresIn") || "300");

    if (mode === "proxy") {
      const { data: fileBlob, error: dlErr } = await supabase.storage
        .from(BUCKET)
        .download(path);
      if (dlErr || !fileBlob)
        return NextResponse.json({ error: "Download failed" }, { status: 404 });

      const filename = path.split("/").pop() || "file";
      return new Response(fileBlob, {
        headers: {
          "Content-Type": mimeFromExt(filename),
          "Content-Disposition": `${
            forceDownload ? "attachment" : "inline"
          }; filename="${encodeURIComponent(filename)}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // Default: Redirect (Signed URL)
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn, {
        download: forceDownload ? path.split("/").pop() : undefined,
      });

    if (!signed?.signedUrl)
      return NextResponse.json({ error: "Sign failed" }, { status: 500 });

    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (err) {
    console.error("[ULOK_EKS_FILES_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
