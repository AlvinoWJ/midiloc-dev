import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth/acl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "unauthorized", message: "User must login" },
        { status: 401 }
      );
    }
    if (!user.branch_id) {
      return NextResponse.json(
        { error: "forbidden", message: "User has no branch" },
        { status: 403 }
      );
    }

    const yearParam = req.nextUrl.searchParams.get("year");
    const branchParam = req.nextUrl.searchParams.get("branch_id");
    const lsParam = req.nextUrl.searchParams.get("ls_id");

    // year (opsional)
    let p_year: number | null = null;
    if (yearParam && yearParam.trim() !== "") {
      const parsed = Number(yearParam);
      if (!Number.isInteger(parsed)) {
        return NextResponse.json(
          { error: "bad_request", message: "Invalid 'year' query param" },
          { status: 400 }
        );
      }
      p_year = parsed;
    }

    // HANYA kirim p_branch_filter jika user mem-pass ?branch_id=
    // Jangan default ke user.branch_id (inilah penyebab GM/RM hanya lihat 1 cabang).
    let p_branch_filter: string | null = null;
    if (branchParam && branchParam.trim() !== "") {
      const val = branchParam.trim();
      // Jika kolom branch_id di DB bertipe UUID, validasi format UUID (opsional)
      const uuidLike =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          val
        );
      if (!uuidLike) {
        return NextResponse.json(
          { error: "bad_request", message: "Invalid 'branch_id' format" },
          { status: 400 }
        );
      }
      p_branch_filter = val;
    }

    // Location specialist filter (UUID expected; untuk GM/RM akan ditolak oleh RPC)
    let p_ls_id: string | null = null;
    if (lsParam && lsParam.trim() !== "") {
      const ls = lsParam.trim();
      const uuidLike =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          ls
        );
      if (!uuidLike) {
        return NextResponse.json(
          { error: "bad_request", message: "Invalid 'ls_id' format" },
          { status: 400 }
        );
      }
      p_ls_id = ls;
    }

    // Panggil RPC
    // Signature: rpc_dashboard(p_user_id uuid, p_year int, p_branch_filter uuid, p_ls_id uuid)
    const { data, error } = await supabase.rpc("rpc_dashboard", {
      p_user_id: user.id,
      p_year,
      p_branch_filter, // null jika tidak ada query param -> GM semua cabang, RM semua cabang di region
      p_ls_id,
    });

    if (error) {
      // Map error validasi dari function (errcode '22023') ke HTTP 400
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pgErr = error as any;
      if (pgErr?.code === "22023") {
        return NextResponse.json(
          { error: "bad_request", message: error.message },
          { status: 400 }
        );
      }
      console.error("Supabase RPC Error:", error);
      return NextResponse.json(
        { error: "rpc_error", message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "not_found", message: "Data not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
