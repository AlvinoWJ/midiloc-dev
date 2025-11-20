"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSWRConfig } from "swr";

export function LogoutButton({ isCollapsed }: { isCollapsed: boolean }) {
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <button
      onClick={logout}
      className={cn(
        "flex justify-center items-center w-full rounded",
        "text-gray-700 hover:bg-red-600 hover:text-white",
        "transition-colors duration-200",
        // Padding & posisi adaptif
        isCollapsed ? "p-3" : "px-4 py-2 gap-2"
      )}
    >
      <LogOut className="w-4 h-4 flex-shrink-0" />

      {/* Teks dengan animasi opacity + delay */}
      <span
        className={cn(
          "whitespace-nowrap overflow-hidden",
          "transition-[width,opacity] duration-200",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 delay-100"
        )}
      >
        Log Out
      </span>
    </button>
  );
}
