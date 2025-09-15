// (Ini versi ringkas tanpa ETag, tinggal pakai langsung)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: ulok, error } = await supabase
    .from("ulok")
    .select("id, users_id, branch_id, file_intip")
    .eq("id", params.id)
    .single();

  if (error || !ulok)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (!ulok.file_intip)
    return NextResponse.json({ error: "No file_intip" }, { status: 404 });

  const mode = new URL(req.url).searchParams.get("mode") || "redirect";
  const path = ulok.file_intip.replace(/^file_intip\//, "");

  if (mode === "proxy") {
    // PROXY MODE
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("file_intip")
      .download(path);
    if (dlErr || !fileData)
      return NextResponse.json({ error: "Download failed" }, { status: 500 });

    // Sederhana saja (bisa tambahkan detect mime)
    return new Response(fileData, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          path.split("/").pop() || "file"
        )}"`,
      },
    });
  }

  // REDIRECT MODE (default)
  const { data: signed, error: signErr } = await supabase.storage
    .from("file_intip")
    .createSignedUrl(path, 60 * 5);

  if (signErr || !signed?.signedUrl)
    return NextResponse.json({ error: "Sign failed" }, { status: 500 });

  return NextResponse.redirect(signed.signedUrl, 302);
}
