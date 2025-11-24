import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canUlokEksternal, getCurrentUser } from "@/lib/auth/acl";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Ambil ulok_eksternal milik user eksternal ini
    const { data: ulokEks, error: ulokErr } = await supabase
      .from("ulok_eksternal")
      .select("id, users_eksternal_id, foto_lokasi")
      .eq("id", params.id)
      .maybeSingle();

    if (ulokErr) {
      return NextResponse.json({ error: ulokErr.message }, { status: 400 });
    }
    if (!ulokEks) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!ulokEks.foto_lokasi) {
      return NextResponse.json(
        { error: "Not Found", message: "foto_lokasi belum tersedia" },
        { status: 404 }
      );
    }

    const path = ulokEks.foto_lokasi as string;
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "redirect"; // redirect | proxy
    const forceDownload = url.searchParams.get("download") === "1";
    const expiresIn = Number(url.searchParams.get("expiresIn") || "300");

    if (mode === "proxy") {
      const { data: fileData, error: dlErr } = await supabase.storage
        .from(BUCKET)
        .download(path);

      if (dlErr || !fileData) {
        return NextResponse.json(
          {
            error: "Download failed",
            message: dlErr?.message || "File not found",
          },
          { status: 404 }
        );
      }

      const filename = path.split("/").pop() || "file";
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

    // Mode redirect → create signed URL
    const downloadName = forceDownload
      ? path.split("/").pop() || "file"
      : undefined;
    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(
        path,
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
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
