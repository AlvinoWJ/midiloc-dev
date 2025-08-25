import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validations/auth";
import type { SignUpResponse } from "@/types/auth";

// GET - Untuk mengambil data options (branch, position, role)
export async function GET() {
  try {
    const supabase = await createClient();
    // Fetch semua data aktif dari tables seeder
    const [branchesResult, positionsResult, rolesResult] = await Promise.all([
      supabase
        .from("branch")
        .select("id, nama, alamat, latitude, longitude, is_active")
        .eq("is_active", true)
        .order("nama", { ascending: true }),

      supabase
        .from("position")
        .select("id, nama, is_active, created_at")
        .eq("is_active", true)
        .order("nama", { ascending: true }),

      supabase
        .from("role")
        .select("id, nama, is_active, created_at")
        .eq("is_active", true)
        .order("nama", { ascending: true }),
    ]);

    // Check for errors
    if (branchesResult.error) {
      console.error("Error fetching branches:", branchesResult.error);
      throw new Error("Failed to fetch branches");
    }

    if (positionsResult.error) {
      console.error("Error fetching positions:", positionsResult.error);
      throw new Error("Failed to fetch positions");
    }

    if (rolesResult.error) {
      console.error("Error fetching roles:", rolesResult.error);
      throw new Error("Failed to fetch roles");
    }

    return NextResponse.json({
      success: true,
      message: "Data options berhasil diambil",
      data: {
        branches: branchesResult.data || [],
        positions: positionsResult.data || [],
        roles: rolesResult.data || [],
      },
      meta: {
        branches_count: branchesResult.data?.length || 0,
        positions_count: positionsResult.data?.length || 0,
        roles_count: rolesResult.data?.length || 0,
        fetched_at: new Date().toISOString(),
        fetched_by: "signup-api",
      },
    });
  } catch (error) {
    console.error("Error fetching signup options:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data options",
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          branches: [],
          positions: [],
          roles: [],
        },
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

    // Validate input data
    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<SignUpResponse>(
        {
          success: false,
          message: "Data tidak valid",
          error: validationResult.error.message,
        },
        { status: 400 }
      );
    }

    const { email, password, nama, branch_id, position_id, role_id } =
      validationResult.data;

    // Check if user already exists
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

    // Validate foreign keys exist in database
    const [branchCheck, positionCheck, roleCheck] = await Promise.all([
      supabase
        .from("branch")
        .select("id, nama")
        .eq("id", branch_id)
        .eq("is_active", true)
        .single(),
      supabase
        .from("position")
        .select("id, nama")
        .eq("id", position_id)
        .eq("is_active", true)
        .single(),
      supabase
        .from("role")
        .select("id, nama")
        .eq("id", role_id)
        .eq("is_active", true)
        .single(),
    ]);

    if (branchCheck.error) {
      return NextResponse.json<SignUpResponse>(
        {
          success: false,
          message: "Branch yang dipilih tidak valid atau tidak aktif",
          error: "Invalid branch_id",
        },
        { status: 400 }
      );
    }

    if (positionCheck.error) {
      return NextResponse.json<SignUpResponse>(
        {
          success: false,
          message: "Position yang dipilih tidak valid atau tidak aktif",
          error: "Invalid position_id",
        },
        { status: 400 }
      );
    }

    if (roleCheck.error) {
      return NextResponse.json<SignUpResponse>(
        {
          success: false,
          message: "Role yang dipilih tidak valid atau tidak aktif",
          error: "Invalid role_id",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama: nama,
          branch_name: branchCheck.data.nama,
          position_name: positionCheck.data.nama,
          role_name: roleCheck.data.nama,
        },
      },
    });

    if (authError) {
      return NextResponse.json<SignUpResponse>(
        {
          success: false,
          message: "Gagal membuat akun auth",
          error: authError.message,
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json<SignUpResponse>(
        {
          success: false,
          message: "Gagal membuat user auth",
          error: "Failed to create auth user",
        },
        { status: 400 }
      );
    }

    // Insert user data into users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        branch_id,
        position_id,
        role_id,
        nama,
        email,
        password: hashedPassword,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: authData.user.id,
      })
      .select(
        `
        id,
        branch_id,
        position_id,
        role_id,
        nama,
        email,
        is_active,
        created_at
      `
      )
      .single();

    if (userError) {
      // If user insertion fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);

      console.error("User insertion error:", userError);
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
      {
        success: true,
        message: "Akun berhasil dibuat",
        user: userData,
      },
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
