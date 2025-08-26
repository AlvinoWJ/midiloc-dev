import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validations/auth";
import type { SignUpResponse } from "@/types/auth";

// GET function (tidak ada perubahan)...
export async function GET() {
  try {
    const supabase = await createClient();
    const [branchesResult, positionsResult, rolesResult] = await Promise.all([
      supabase
        .from("branch")
        .select("id, nama")
        .eq("is_active", true)
        .order("nama", { ascending: true }),
      supabase
        .from("position")
        .select("id, nama")
        .eq("is_active", true)
        .order("nama", { ascending: true }),
      supabase
        .from("role")
        .select("id, nama")
        .eq("is_active", true)
        .order("nama", { ascending: true }),
    ]);

    if (branchesResult.error) throw new Error("Gagal mengambil data branch");
    if (positionsResult.error) throw new Error("Gagal mengambil data posisi");
    if (rolesResult.error) throw new Error("Gagal mengambil data role");

    return NextResponse.json({
      success: true,
      message: "Data options berhasil diambil",
      data: {
        branches: branchesResult.data || [],
        positions: positionsResult.data || [],
        roles: rolesResult.data || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data options",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Untuk proses signup
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.entries(fieldErrors)
        .map(
          ([field, errors]) =>
            `${field.replace("_id", "")}: ${errors?.join(", ")}`
        )
        .join("\n");
      return NextResponse.json<SignUpResponse>(
        { success: false, message: "Data tidak valid", error: errorMessage },
        { status: 400 }
      );
    }

    const { email, password, nama, branch_id, position_id, role_id } =
      validationResult.data;

    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();
    if (existingUser) {
      return NextResponse.json<SignUpResponse>(
        {
          success: false,
          message: "Email sudah terdaftar",
          error: "Email already exists",
        },
        { status: 409 }
      );
    }

    // --- PERUBAHAN UTAMA: Pengecekan berurutan ---
    console.log(`[SERVER LOG] Memvalidasi Branch ID: ${branch_id}`);
    const { error: branchError } = await supabase
      .from("branch")
      .select("id")
      .eq("id", branch_id)
      .single();
    if (branchError) {
      console.error("[SERVER LOG] Validasi Branch Gagal:", branchError);
      return NextResponse.json<SignUpResponse>(
        { success: false, message: "Branch ID tidak valid" },
        { status: 400 }
      );
    }
    console.log("[SERVER LOG] Validasi Branch Berhasil.");
    console.log("TESTTTTTTTTTTTTTTTTTT");

    console.log(`[SERVER LOG] Memvalidasi Position ID: ${position_id}`);
    const { error: positionError } = await supabase
      .from("position")
      .select("id")
      .eq("id", position_id)
      .single();
    if (positionError) {
      console.error("[SERVER LOG] Validasi Posisi Gagal:", positionError);
      return NextResponse.json<SignUpResponse>(
        { success: false, message: "Position ID tidak valid" },
        { status: 400 }
      );
    }
    console.log("[SERVER LOG] Validasi Posisi Berhasil.");

    console.log(`[SERVER LOG] Memvalidasi Role ID: ${role_id}`);
    const { error: roleError } = await supabase
      .from("role")
      .select("id")
      .eq("id", role_id)
      .single();
    if (roleError) {
      console.error("[SERVER LOG] Validasi Role Gagal:", roleError);
      return NextResponse.json<SignUpResponse>(
        { success: false, message: "Role ID tidak valid" },
        { status: 400 }
      );
    }
    console.log("[SERVER LOG] Validasi Role Berhasil.");
    // --- AKHIR DARI PERUBAHAN ---

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError)
      return NextResponse.json<SignUpResponse>(
        { success: false, message: authError.message },
        { status: 400 }
      );
    if (!authData.user)
      return NextResponse.json<SignUpResponse>(
        { success: false, message: "Gagal membuat user auth" },
        { status: 400 }
      );

    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        branch_id,
        position_id,
        role_id,
        nama,
        email,
        created_by: authData.user.id,
      })
      .select(
        `id, branch_id, position_id, role_id, nama, email, is_active, created_at`
      )
      .single();

    if (userError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json<SignUpResponse>(
        {
          success: false,
          message: "Gagal menyimpan data user ke database",
          error: userError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<SignUpResponse>(
      { success: true, message: "Akun berhasil dibuat!", user: userData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json<SignUpResponse>(
      {
        success: false,
        message: "Terjadi kesalahan server internal",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
