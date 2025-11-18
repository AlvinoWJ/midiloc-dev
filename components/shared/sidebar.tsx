"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  MapPin,
  FileText,
  User,
  X,
  TimerIcon,
  MapPinned,
} from "lucide-react"; // Tambahkan ikon X
import Image from "next/image";
import { LogoutButton } from "../ui/logout-button"; // Sesuaikan path jika perlu
import { useSidebar } from "@/hooks/useSidebar";
import { useUser } from "@/hooks/useUser";

// Definisikan menu sekali saja
const menu = [
  { name: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
  {
    name: "Usulan Lokasi Eksternal",
    href: "/ulok_eksternal",
    icon: <MapPinned size={20} />,
  },
  { name: "Usulan Lokasi", href: "/usulan_lokasi", icon: <MapPin size={20} /> },
  { name: "Form KPLT", href: "/form_kplt", icon: <FileText size={20} /> },
  {
    name: "Progress KPLT",
    href: "/progress_kplt",
    icon: <TimerIcon size={20} />,
  },
];

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();
  const { user, loadingUser, userError } = useUser();

  const [isMobile, setIsMobile] = useState(false);

  const isOpen = !isCollapsed;
  const onClose = () => setIsCollapsed(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, isMobile]);

  return (
    <>
      {/* =================================
        ==      SIDEBAR DESKTOP        ==
        =================================
        - Tampil di layar besar (lg) dan ke atas.
        - Sembunyi di layar kecil.
        - Menggunakan class: `hidden lg:flex`
      */}
      <aside
        className={`
          hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-primary-foreground shadow-[1px_1px_6px_rgba(0,0,0,0.25)]
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-[270px]"}
        `}
      >
        {/* Logo */}
        <div className="relative flex items-center justify-center h-[91px]">
          <Image
            src="/alfamidi-logo.png"
            alt="Logo"
            width={160}
            height={47}
            priority
            className={`transition-opacity duration-300 ease-in-out ${
              isCollapsed ? "opacity-0" : "opacity-100"
            }`}
          />
          <Image
            src="/alfamidi-logo-mini.png"
            alt="Logo Mini"
            width={40}
            height={40}
            priority
            className={`absolute transition-opacity duration-300 ease-in-out ${
              isCollapsed ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center pt-6 gap-2 px-4">
          <User className="h-12 w-12 rounded-full border p-2 flex-shrink-0" />
          {!isCollapsed && (
            <div
              className={`flex flex-col items-center transition-opacity duration-200
                ${isCollapsed ? "opacity-0 w-0 h-0" : "opacity-100 delay-100"}
              `}
            >
              {loadingUser ? (
                <p className="text-foreground font-semibold">Loading...</p>
              ) : userError ? (
                <p className="text-primary text-sm">Gagal memuat data</p>
              ) : (
                <>
                  <p className="font-semibold text-foreground text-center whitespace-nowrap overflow-hidden capitalize">
                    {user?.nama}
                  </p>
                  <p className="font-medium text-gray-700 text-sm text-center whitespace-nowrap overflow-hidden capitalize">
                    {user?.position_nama}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="absolute left-4 right-4 top-[240px] space-y-2 mt-2">
          {menu.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href) &&
                pathname.charAt(item.href.length) === "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className={`flex items-center rounded text-sm font-medium transition duration-200
                  ${isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3"}
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <div className="flex-shrink-0 w-5">{item.icon}</div>
                {!isCollapsed && (
                  <span className="whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 mt-auto">
          <LogoutButton isCollapsed={isCollapsed} />
        </div>
      </aside>

      {/* =================================
        ==       SIDEBAR MOBILE        ==
        =================================
        - Hanya tampil di layar kecil (di bawah lg).
        - Sembunyi di layar besar.
        - Menggunakan class: `lg:hidden`
      */}
      <div className="lg:hidden">
        {/* Tampilkan backdrop dan menu hanya jika isOpen (atau !isCollapsed) */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={onClose}
            />

            {/* Sidebar Mobile Content */}
            <aside
              className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto flex flex-col"
              data-state={isOpen ? "open" : "closed"}
            >
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
              <nav className="p-4 space-y-2 flex-1 ">
                {menu.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose} // Tutup sidebar saat menu di-klik
                      className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors duration-200
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground"
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
        )}
      </div>
    </>
  );
}
