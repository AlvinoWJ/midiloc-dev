"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Home, MapPin, FileText, User } from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "@/components/ui/logout-button";
import { useSidebar } from "@/hooks/useSidebar";
import { useUser } from "@/hooks/useUser";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
  { name: "Usulan Lokasi", href: "/usulan_lokasi", icon: <MapPin size={20} /> },
  { name: "Form KPLT", href: "/form_kplt", icon: <FileText size={20} /> },
];

export default function MobileSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { user, loadingUser, userError } = useUser();
  const isOpen = !isCollapsed;
  const onClose = () => setIsCollapsed(true);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="relative flex items-center justify-between p-4 ">
          <Image
            src="/alfamidi-logo.png"
            alt="Alfamidi Logo"
            width={120}
            height={35}
            className="h-8 w-auto"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile Section */}
        <div className="p-6 flex-shrink-0">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-red-200 bg">
              <User size={24} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              {/* 7. Ganti variabel props dengan yang dari hook */}
              {loadingUser ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
              ) : userError ? (
                <p className="text-red-600 text-sm font-medium">
                  Error loading data
                </p>
              ) : (
                <>
                  <p className="font-semibold text-foreground text-center whitespace-nowrap overflow-hidden">
                    {user?.nama || "User"}
                  </p>
                  <p className="font-medium text-gray-700 text-sm text-center whitespace-nowrap overflow-hidden">
                    {user?.position_nama || "Position"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 flex-1">
          {menu.map((item) => {
            const isActive =
              pathname.startsWith(item.href) &&
              (pathname.length === item.href.length ||
                pathname.charAt(item.href.length) === "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded text-sm font-medium
                  transition-colors duration-200 
                  ${
                    isActive
                      ? "bg-red-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 flex-shrink-0">
          <div className="flex justify-center">
            <LogoutButton isCollapsed={false} />
          </div>
        </div>
      </aside>
    </>
  );
}
