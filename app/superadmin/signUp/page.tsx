import { SuperAdminSignUpForm } from "@/components/superadmin-signup-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();

  // 1. Dapatkan data pengguna yang sedang otentikasi
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    redirect("/auth/login");
  }

  // 2. Gunakan ID pengguna untuk query ke tabel 'users' dan join dengan 'role'
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(
      `
      id,
      role:role_id ( nama )
    `
    )
    .eq("id", authData.user.id)
    .single();

  // 3. Periksa apakah peran pengguna adalah 'Superadmin'
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (userError || !userData || userData.role?.nama !== "Superadmin") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-muted-foreground">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      </div>
    );
  }

  // Jika lolos pengecekan, tampilkan form
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SuperAdminSignUpForm />
      </div>
    </div>
  );
}
