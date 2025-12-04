"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LogoutButton
 * ------------
 * Tombol untuk melakukan proses logout menggunakan Supabase Auth.
 *
 * Props:
 * - isCollapsed: boolean  → menentukan apakah sidebar sedang dalam keadaan collapsed.
 *   Jika collapsed: tombol hanya menampilkan ikon.
 *   Jika expanded: tombol menampilkan ikon + teks.
 */
export function LogoutButton({ isCollapsed }: { isCollapsed: boolean }) {
  /**
   * logout()
   * --------
   * Fungsi yang dipanggil saat tombol ditekan.
   * - Membuat instance Supabase Client
   * - Menjalankan proses signOut()
   * - Redirect user ke halaman login
   */
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login"; // hard redirect agar state ter-reset
  };

  return (
    <button
      onClick={logout}
      className={cn(
        // Layout button
        "flex justify-center items-center w-full rounded",

        // Warna default & hover
        "text-gray-700 hover:bg-red-600 hover:text-white",
        "transition-colors duration-200",

        // Padding berubah sesuai kondisi collapse
        // - collapsed: tombol hanya ikon → padding lebih kecil
        // - expanded: ikon + teks → padding lebih luas
        isCollapsed ? "p-3" : "px-4 py-2 gap-2"
      )}
    >
      {/* Ikon Logout */}
      <LogOut className="w-4 h-4 flex-shrink-0" />

      {/* Teks "Log Out" yang fade-in/out saat sidebar collapse */}
      <span
        className={cn(
          "whitespace-nowrap overflow-hidden",
          "transition-[width,opacity] duration-200",

          // collapsed → sembunyikan teks
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 delay-100" // muncul sedikit terlambat agar smooth
        )}
      >
        Log Out
      </span>
    </button>
  );
}
