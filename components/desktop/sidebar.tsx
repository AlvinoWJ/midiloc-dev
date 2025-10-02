"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, FileText, User } from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "../ui/logout-button";
import { useSidebar } from "@/hooks/useSidebar";
import { useUser } from "@/hooks/useUser";

export default function Sidebar() {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const { user, loadingUser, userError } = useUser();

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
    {
      name: "Usulan Lokasi",
      href: "/usulan_lokasi",
      icon: <MapPin size={20} />,
    },
    {
      name: "Form KPLT",
      href: "/form_kplt",
      icon: <FileText size={20} />,
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] flex flex-col 
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

        {loadingUser ? (
          <p className="text-foreground font-semibold">Loading...</p>
        ) : userError ? (
          <p className="text-primary text-sm">Gagal memuat data</p>
        ) : (
          <div
            className={`flex flex-col items-center transition-opacity duration-200
              ${isCollapsed ? "opacity-0 w-0" : "opacity-100 delay-100"}
            `}
          >
            <p className="font-semibold text-foreground text-center whitespace-nowrap overflow-hidden capitalize">
              {user?.nama}
            </p>
            <p className="font-medium text-gray-700 text-sm text-center whitespace-nowrap overflow-hidden capitalize">
              {user?.position_nama}
            </p>
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
              prefetch={false} // supaya gak double render saat klik cepat
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
  );
}
