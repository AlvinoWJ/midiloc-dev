"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebarcontext";

type User = {
  nama: string;
  branch_nama: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const res = await fetch("http://localhost:3000/api/me");
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Fetch error:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

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
            {isLoading ? (
              <span className="font-bold text-lg">Loading...</span>
            ) : isError ? (
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
          {isLoading ? (
            <span className="text-lg font-medium">Loading branch...</span>
          ) : isError ? (
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
