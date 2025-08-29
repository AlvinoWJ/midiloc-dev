"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebarcontext"; // pakai context

export default function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const { toggleSidebar } = useSidebar(); // ambil dari context

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) {
        setUserName(data.user.user_metadata?.full_name || data.user.email);
      }
    });
  }, []);

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
            <span className="font-bold text-lg">
              {userName ?? "Loading..."}
            </span>
          </div>
        </div>

        <div>
          <span className="text-lg font-medium">Branch Bitung</span>
        </div>
      </div>
    </header>
  );
}
