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

    // Parse year (optional)
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

    // Branch: jika tidak diberikan, default ke branch user
    // Sesuaikan tipe: jika branch_id di DB UUID, kirim string; jika INT, parse number.
    let p_branch_id: string | number | null =
      branchParam && branchParam.trim() !== ""
        ? branchParam.trim()
        : (user.branch_id as string | number);

    if (typeof p_branch_id === "string") {
      const onlyDigits = /^\d+$/.test(p_branch_id);
      if (onlyDigits) {
        const asNum = Number(p_branch_id);
        if (!Number.isFinite(asNum)) {
          return NextResponse.json(
            {
              error: "bad_request",
              message: "Invalid 'branch_id' query param",
            },
            { status: 400 }
          );
        }
        p_branch_id = asNum;
      } else {
        // UUID ok, no-op
      }
    }

    // Location specialist filter (UUID expected)
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

    // Call RPC with filters; sesuaikan signature RPC Anda:
    // rpc_dashboard(p_user_id uuid, p_year int, p_branch_filter uuid, p_ls_id uuid)
    const { data, error } = await supabase.rpc("rpc_dashboard", {
      p_user_id: user.id,
      p_year,
      p_branch_filter: typeof p_branch_id === "string" ? p_branch_id : null, // jika UUID
      // Jika di DB branch_id bertipe INT, ubah signature RPC agar menerima INT, lalu kirim p_branch_filter: p_branch_id
      p_ls_id,
    });

    if (error) {
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
