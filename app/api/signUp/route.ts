import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { signUpSchema } from "@/lib/validations/auth";
import type { SignUpResponse } from "@/types/auth";
import { getCurrentUser } from "@/lib/auth/acl";

// GET function (tidak ada perubahan)...
export async function GET() {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role_nama !== "superadmin") {
      // Sesuaikan rule Anda
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Hanya Super Admin yang boleh membuat user baru.",
        },
        { status: 403 }
      );
    }
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
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role_nama !== "superadmin") {
      // Sesuaikan rule Anda
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Hanya Super Admin yang boleh membuat user baru.",
        },
        { status: 403 }
      );
    }

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

    const { email, password, nama, nik, branch_id, position_id, role_id } =
      validationResult.data;

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Pastikan variabel ini ada di .env.local
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: existingUser } = await supabaseAdmin
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

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Langsung confirm agar user bisa login
        user_metadata: { nama }, // Opsional
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
        nik,
        email,
        created_by: currentUser.id,
      })
      .select(
        `id, branch_id, position_id, role_id, nama,nik, email, is_active, created_at`
      )
      .single();

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
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
