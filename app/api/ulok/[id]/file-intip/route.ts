import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";

function normalizePath(p: string) {
  return p.startsWith("file_intip/") ? p.replace(/^file_intip\//, "") : p;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Ambil data ulok
  let query = supabase
    .from("ulok")
    .select("id, users_id, branch_id, file_intip")
    .eq("id", params.id);
  if (user.position_nama === "location specialist") {
    query = query.eq("users_id", user.id).eq("branch_id", user.branch_id);
  } else if (user.position_nama === "location manager") {
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden: no branch" },
        { status: 403 }
      );
    query = query.eq("branch_id", user.branch_id);
  }
  const { data: ulok, error } = await query.single();
  if (error || !ulok)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  if (!ulok.file_intip) {
    return NextResponse.json({ error: "No file_intip" }, { status: 404 });
  }

  const relative = normalizePath(ulok.file_intip);
  const { data: fileData, error: dlErr } = await supabase.storage
    .from("file_intip")
    .download(relative);

  if (dlErr || !fileData) {
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }

  // Deteksi content type sederhana
  let contentType = "application/octet-stream";
  if (relative.match(/\.(png|jpg|jpeg|gif)$/i))
    contentType =
      "image/" +
      (relative.split(".").pop()!.toLowerCase() === "jpg"
        ? "jpeg"
        : relative.split(".").pop()!.toLowerCase());
  else if (relative.endsWith(".pdf")) contentType = "application/pdf";

  return new Response(fileData, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${relative.split("/").pop()}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
