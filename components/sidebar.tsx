"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, FileText, User } from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "./logout-button";
import { useSidebar } from "@/components/ui/sidebarcontext";

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
    {
      name: "Usulan Lokasi",
      href: "/usulan_lokasi",
      icon: <MapPin size={20} />,
    },
    { name: "Form KPLT", href: "/form_kplt", icon: <FileText size={20} /> },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white shadow-md flex flex-col transition-all duration-300 
        ${isCollapsed ? "w-20" : "w-[270px]"}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center py-6 px-2">
        {isCollapsed ? (
          <Image
            src="/alfamidi-logo-mini.png"
            alt="Logo"
            width={40}
            height={40}
          />
        ) : (
          <Image src="/alfamidi-logo.png" alt="Logo" width={160} height={47} />
        )}
      </div>

      {/* Profile */}
      {isCollapsed ? (
        <div className="flex justify-center py-6">
          <User className="h-10 w-10 rounded-full border p-2" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6">
          <User className="h-12 w-12 rounded-full border p-2" />
          <p className="font-semibold text-black text-center">
            Alvino Dwi Nengku Wijaya
          </p>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 px-2 space-y-4">
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`transition rounded px-4 py-3 text-sm font-medium ${
              pathname.startsWith(item.href) &&
              (pathname.length === item.href.length ||
                pathname.charAt(item.href.length) === "/")
                ? "bg-red-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            } flex ${
              isCollapsed
                ? "flex-col items-center justify-center"
                : "flex-row items-center gap-2"
            }`}
          >
            {item.icon}
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 absolute bottom-0 w-full flex justify-center">
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
