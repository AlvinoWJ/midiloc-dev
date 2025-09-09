import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isApi = request.nextUrl.pathname.startsWith("/api");

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  // Gate umum: blokir jika belum login, kecuali rute login/auth tertentu
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api/login")
  ) {
    if (isApi) {
      // Untuk API, balas JSON 401 agar klien tidak dilempar ke halaman HTML
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Cek role superadmin untuk halaman signup
  if (request.nextUrl.pathname.startsWith("/api/signUp") && user) {
    // Opsi A (aman terhadap sinkronisasi role): baca dari DB (join role_id -> role.nama)
    const { data: userRow, error } = await supabase
      .from("users")
      .select("role:role_id (nama)")
      .eq("id", user.id)
      .maybeSingle();

    //NOTE: TYPESCRIPT PROBLEM SOLVE Property 'nama' does not exist on type '{ nama: any; }[]'.
    const userRole = userRow?.role as { nama: string } | undefined;
    const roleName = userRole?.nama?.toLowerCase() ?? "";

    // return NextResponse.json({
    //   source: "Middleware Debug",
    //   timestamp: new Date().toISOString(),
    //   debugData: {
    //     userRow: roleName,
    //     error: error,
    //   },
    // });

    if (error || roleName !== "superadmin") {
      if (isApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return supabaseResponse;
}
