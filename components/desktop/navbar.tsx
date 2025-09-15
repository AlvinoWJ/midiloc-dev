"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebarcontext";
import { useUser } from "@/hooks/useUser";

export default function Navbar() {
  const { user, loadingUser, userError } = useUser();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="w-full bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* tombol collapse */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded hover:bg-primary-foreground/10 transition"
          >
            <Menu size={24} />
          </button>

          <div className="flex flex-col">
            <span className="text-lg">Selamat Datang,</span>
            {loadingUser ? (
              <span className="font-bold text-lg">Loading...</span>
            ) : userError ? (
              <span className="text-red-400 font-bold text-lg">
                Gagal memuat data
              </span>
            ) : (
              <>
                <span className="font-bold text-lg capitalize">
                  {user?.nama}
                </span>
              </>
            )}
          </div>
        </div>

        <div>
          {loadingUser ? (
            <span className="text-lg font-medium">Loading branch...</span>
          ) : userError ? (
            <span className="text-lg font-medium text-red-400">
              Error branch
            </span>
          ) : (
            <span className="text-lg font-medium capitalize">
              Branch {user?.branch_nama}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
