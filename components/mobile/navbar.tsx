// mobile-navbar.tsx
import { Menu, Bell } from "lucide-react";

interface MobileNavbarProps {
  user: any;
  isLoading: boolean;
  isError: boolean;
  onMenuClick: () => void;
}

export default function MobileNavbar({
  user,
  isLoading,
  isError,
  onMenuClick,
}: MobileNavbarProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="flex flex-col">
            <span className="text-xs opacity-90">Selamat Datang,</span>
            {isLoading ? (
              <span className="font-semibold text-sm">Loading...</span>
            ) : isError ? (
              <span className="text-red-200 font-semibold text-sm">Error</span>
            ) : (
              <span className="font-semibold text-sm capitalize truncate max-w-[120px]">
                {user?.nama}
              </span>
            )}
          </div>
        </div>

        <div className="text-xs font-medium capitalize truncate max-w-[100px]">
          {isLoading
            ? "Loading..."
            : isError
            ? "Error"
            : `Branch ${user?.branch_nama}`}
        </div>
      </div>
    </header>
  );
}
