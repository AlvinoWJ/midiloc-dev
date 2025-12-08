import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect Helper: /api/ulok/:id/form-ulok
 * Route ini bertindak sebagai proxy/shortcut URL untuk mengakses file.
 * * Logic:
 * - Jika query ?name=... ada, arahkan ke file spesifik tersebut.
 * - Jika tidak ada, arahkan ke ?field=form_ulok (default file utama).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);

  // Ambil parameter dari query string asli
  const name = url.searchParams.get("name");
  const mode = url.searchParams.get("mode"); // opsional: proxy/redirect
  const download = url.searchParams.get("download"); // opsional: 1
  const expiresIn = url.searchParams.get("expiresIn"); // opsional: detik

  // Construct target URL ke endpoint general file handler
  const target = new URL(`/api/files/ulok/${id}`, req.url);

  if (name && name.trim() !== "") {
    target.searchParams.set("name", name);
  } else {
    // Default fallback ke field 'form_ulok'
    target.searchParams.set("field", "form_ulok");
  }

  // Forward optional params
  if (mode) target.searchParams.set("mode", mode);
  if (download) target.searchParams.set("download", download);
  if (expiresIn) target.searchParams.set("expiresIn", expiresIn);

  // Lakukan redirect 307 (Temporary Redirect) agar method/body tetap terjaga jika diperlukan
  return NextResponse.redirect(target, 307);
}
