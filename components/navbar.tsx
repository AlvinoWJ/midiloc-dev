"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useUser } from "@/hooks/useUser";

export default function Navbar() {
  const { user, loadingUser, userError } = useUser();
  const { toggleSidebar } = useSidebar();

  return (
    // Gunakan styling mobile sebagai dasar, lalu override untuk desktop (lg:)
    <header className="w-full bg-primary text-primary-foreground shadow-md sticky top-0 z-10 lg:relative">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Tombol Menu (Hamburger) */}
          {/* Fungsinya sama untuk membuka sidebar mobile dan collapse sidebar desktop */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Welcome Message */}
          <div className="flex flex-col">
            <span className="text-xs lg:text-lg opacity-90 lg:opacity-100">
              Selamat Datang,
            </span>

            {loadingUser ? (
              <span className="font-semibold lg:font-bold text-sm lg:text-lg">
                Loading...
              </span>
            ) : userError ? (
              <span className="text-red-300 font-semibold lg:font-bold text-sm lg:text-lg">
                Gagal memuat data
              </span>
            ) : (
              <span className="font-semibold lg:font-bold text-sm lg:text-lg capitalize truncate max-w-[150px] lg:max-w-none">
                {user?.nama}
              </span>
            )}
          </div>
        </div>

        {/* Branch Info */}
        <div>
          {loadingUser ? (
            <span className="text-xs lg:text-lg font-medium">
              Loading branch...
            </span>
          ) : userError ? (
            <span className="text-xs lg:text-lg font-medium text-red-300">
              Error branch
            </span>
          ) : (
            <span className="text-xs lg:text-lg font-medium capitalize truncate max-w-[120px] lg:max-w-none">
              Branch {user?.branch_nama}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
