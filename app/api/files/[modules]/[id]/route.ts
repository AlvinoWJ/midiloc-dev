/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  "grand_opening",
] as const;

type AllowedModule = (typeof ALLOWED_MODULES)[number];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

/**
 * Menyelesaikan Context (Ulok ID, Branch ID, Owner ID) berdasarkan Module & ID resource.
 * Digunakan untuk validasi hak akses folder.
 */
async function resolveContext(
  supabase: any,
  modules: AllowedModule,
  id: string
): Promise<{
  ulokId: string;
  branchId: string | null;
  ownerId: string | null;
}> {
  // 1. Context: ULOK
  if (modules === "ulok") {
    const { data, error } = await supabase
      .from("ulok")
      .select("id, branch_id, users_id") // [FIX] Ambil users_id
      .eq("id", id)
      .single();
    if (error || !data) throw new Error("ULOK not found");
    return {
      ulokId: String(data.id),
      branchId: data.branch_id ?? null,
      ownerId: data.users_id ?? null,
    };
  }

  // 2. Context: KPLT
  if (modules === "kplt") {
    const { data, error } = await supabase
      .from("kplt")
      .select("ulok_id, ulok:ulok_id ( branch_id, users_id )") // [FIX] Join ke ulok ambil users_id
      .eq("id", id)
      .single();
    if (error || !data?.ulok_id) throw new Error("KPLT not found");

    const ulok = data.ulok as any;
    return {
      ulokId: String(data.ulok_id),
      branchId: ulok?.branch_id ?? null,
      ownerId: ulok?.users_id ?? null,
    };
  }

  // 3. Context: PROGRESS (MOU,Perizinan, dll)
  // Semua module progress terhubung ke tabel `progress_kplt` via `progress_kplt_id`
  // Param `id` di sini adalah ID dari `progress_kplt` itu sendiri (sesuai pola API progress).
  // API Route progress memanggil ini dengan ID progress.
  const { data, error } = await supabase
    .from("progress_kplt")
    .select(
      `
      id,
      kplt:kplt!progress_kplt_kplt_id_fkey!inner (
        id,
        ulok_id,
        ulok:ulok_id ( branch_id, users_id )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.kplt?.ulok_id) throw new Error("Progress not found");

  const kplt = (data as any).kplt;
  const ulok = kplt?.ulok;

  return {
    ulokId: String(kplt.ulok_id),
    branchId: ulok?.branch_id ?? null,
    ownerId: ulok?.users_id ?? null,
  };
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ modules: string; id: string }> }
) {
  try {
    const { id, modules } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Menggunakan canKplt('read') sebagai gatekeeper umum file system
    if (!canKplt("read", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden: No branch" },
        { status: 403 }
      );

    const moduleName = modules as AllowedModule;
    const resourceId = id;

    // 2. Input Validation
    if (!ALLOWED_MODULES.includes(moduleName)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }
    if (!isUuid(resourceId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 3. Resolve Context & Access Control
    let ctx;
    try {
      ctx = await resolveContext(supabase, moduleName, resourceId);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || "Not Found" },
        { status: 404 }
      );
    }

    const { ulokId, branchId, ownerId } = ctx;
    const position = (user.position_nama || "").toLowerCase();
    const isSuperUser = ["regional manager", "general manager"].includes(
      position
    );

    // Rule A: Location Specialist hanya boleh akses file miliknya (Anti-Intip)
    if (position === "location specialist") {
      if (ownerId && ownerId !== user.id) {
        return NextResponse.json(
          { error: "Forbidden: Dokumen ini bukan milik Anda" },
          { status: 403 }
        );
      }
    }

    // Rule B: Cross-Branch Check (Kecuali Super User)
    if (!isSuperUser) {
      if (branchId && user.branch_id && branchId !== user.branch_id) {
        return NextResponse.json(
          { error: "Forbidden: Akses lintas cabang ditolak" },
          { status: 403 }
        );
      }
    }

    // 4. Determine Operation (List vs Signed URL)
    const url = new URL(req.url);
    const pathParam = url.searchParams.get("path");
    const nameParam = url.searchParams.get("name");
    const fieldParam = url.searchParams.get("field");

    const folderPath = `${ulokId}/${moduleName}`; // Standard Folder Structure

    // --- MODE A: LISTING FILES ---
    if (!pathParam && !nameParam && !fieldParam) {
      const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
      const limit = Math.max(
        1,
        Math.min(100, Number(url.searchParams.get("limit") || "100"))
      );
      const offset = (page - 1) * limit;

      const { data: list, error: listErr } = await supabase.storage
        .from(BUCKET)
        .list(folderPath, {
          limit,
          offset,
          sortBy: { column: "name", order: "desc" },
        });

      if (listErr) {
        console.error("[FILES_LIST]", listErr);
        return NextResponse.json({ error: "Listing failed" }, { status: 500 });
      }

      const files = (list || []).map((f) => {
        const match = f.name.match(/^\d+_([a-z0-9_.-]+)\.[a-z0-9]+$/i);
        return {
          name: f.name,
          field: match ? match[1] : null, // Guess field name from filename pattern
          size: f.metadata?.size ?? null,
          last_modified: f.updated_at ?? null,
          href: `/api/files/${moduleName}/${resourceId}?name=${encodeURIComponent(
            f.name
          )}`,
        };
      });

      return NextResponse.json({
        module: moduleName,
        id: resourceId,
        folder: folderPath,
        pagination: { page, limit, count: files.length },
        files,
      });
    }

    // --- MODE B: GENERATE SIGNED URL (REDIRECT) ---
    let targetPath: string | null = null;

    if (pathParam) {
      // Security: Cegah Path Traversal (../)
      if (!pathParam.startsWith(folderPath + "/")) {
        return NextResponse.json({ error: "Forbidden Path" }, { status: 403 });
      }
      targetPath = pathParam;
    } else if (nameParam) {
      targetPath = `${folderPath}/${nameParam}`;
    } else if (fieldParam) {
      // Search file by field name slug
      const slug = slugify(fieldParam);
      const { data: list } = await supabase.storage
        .from(BUCKET)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: "name", order: "desc" }, // Ambil yang terbaru
        });

      const found = (list || []).find((f) =>
        f.name.toLowerCase().includes(`_${slug}`)
      );

      if (!found)
        return NextResponse.json(
          { error: `File for field '${fieldParam}' not found` },
          { status: 404 }
        );
      targetPath = `${folderPath}/${found.name}`;
    }

    if (!targetPath)
      return NextResponse.json(
        { error: "File target could not be resolved" },
        { status: 404 }
      );

    // Generate Signed URL
    const expiresIn = Math.min(
      3600,
      Math.max(60, Number(url.searchParams.get("expiresIn") || "300"))
    );
    const forceDownload = url.searchParams.get("download") === "1";
    const downloadName = forceDownload
      ? targetPath.split("/").pop()
      : undefined;

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(targetPath, expiresIn, { download: downloadName });

    if (signErr || !signed?.signedUrl) {
      console.error("[FILES_SIGN]", signErr);
      return NextResponse.json(
        { error: "Failed to generate access link" },
        { status: 404 }
      );
    }

    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (err) {
    console.error("[FILES_GET_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
