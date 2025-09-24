import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth/acl";

// Always fetch fresh data (optional)
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

    // Optional filters: ?year=2024&branch_id=<id>
    const yearParam = req.nextUrl.searchParams.get("year");
    const branchParam = req.nextUrl.searchParams.get("branch_id");

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

    // If param branch_id diberikan, gunakan itu; jika tidak, fallback ke user.branch_id
    // Catatan:
    // - Jika kolom branch_id di DB bertipe UUID: pastikan RPC didefinisikan p_branch_id uuid, dan kirim string UUID.
    // - Jika kolom branch_id di DB bertipe INT: kirim number.
    let p_branch_id: string | number | null =
      branchParam && branchParam.trim() !== ""
        ? branchParam.trim()
        : (user.branch_id as string | number);

    // Validasi ringan: jika berupa digit saja, kirim sebagai number (untuk skema INT); jika bukan, kirim string (untuk UUID).
    if (typeof p_branch_id === "string") {
      const onlyDigits = /^\d+$/.test(p_branch_id);
      if (onlyDigits) {
        // Kandidat INT
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
        // Kandidat UUID, validasi sederhana
        const uuidLike =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            p_branch_id
          );
        if (!uuidLike && branchParam) {
          // Jika bukan digit-only dan bukan UUID, tolak agar tidak mengirim tipe salah ke RPC
          return NextResponse.json(
            { error: "bad_request", message: "Invalid 'branch_id' format" },
            { status: 400 }
          );
        }
      }
    }

    // Panggil RPC dengan filter
    const { data, error } = await supabase.rpc("fn_dashboard_ulok_kplt", {
      p_year,
      p_branch_id,
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

/*
Usage:
- GET /api/dashboard
- GET /api/dashboard?year=2024
- GET /api/dashboard?branch_id=5          // jika branch_id di DB bertipe INT
- GET /api/dashboard?branch_id=<uuid>      // jika branch_id di DB bertipe UUID

Pastikan signature RPC sesuai tipe branch_id Anda:
  -- INT
  create or replace function rpc_dashboard(p_year int default null, p_branch_id int default null) returns jsonb ...

  -- UUID
  create or replace function rpc_dashboard(p_year int default null, p_branch_id uuid default null) returns jsonb ...
*/
