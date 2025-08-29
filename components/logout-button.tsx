"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({ isCollapsed }: { isCollapsed: boolean }) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <button
      onClick={logout}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded text-gray-700 w-full justify-center",
        "hover:bg-red-600 hover:text-white transition-colors duration-200"
      )}
    >
      <LogOut className="w-4 h-4" />
      {!isCollapsed && <span>Log Out</span>}
    </button>
  );
}
