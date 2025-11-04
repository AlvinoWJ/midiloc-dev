import { NextRequest, NextResponse } from "next/server";

// Redirect helper: /api/ulok/:id/form_ulok
// - Jika query punya ?name=..., pakai name (file spesifik).
// - Jika tidak ada name, pakai ?field=form_ulok (ambil file terbaru yang mengandung _form_ulok di namanya).
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const mode = url.searchParams.get("mode"); // opsional: proxy/redirect
  const download = url.searchParams.get("download"); // opsional: 1
  const expiresIn = url.searchParams.get("expiresIn"); // opsional: detik

  const target = new URL(`/api/files/ulok/${params.id}`, req.url);

  if (name && name.trim() !== "") {
    target.searchParams.set("name", name);
  } else {
    target.searchParams.set("field", "form_ulok");
  }

  if (mode) target.searchParams.set("mode", mode);
  if (download) target.searchParams.set("download", download);
  if (expiresIn) target.searchParams.set("expiresIn", expiresIn);

  return NextResponse.redirect(target, 307);
}
