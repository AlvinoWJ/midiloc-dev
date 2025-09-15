"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, FileText, User } from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "./logout-button";
import { useSidebar } from "@/components/ui/sidebarcontext";
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
    { name: "Form KPLT", href: "/form_kplt", icon: <FileText size={20} /> },
  ];

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] flex flex-col 
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-[270px]"}
      `}
    >
      <div>
        {/* Logo */}
        <div className="relative flex items-center justify-center h-[91px]">
          <Image
            src="/alfamidi-logo.png"
            alt="Logo"
            width={160}
            height={47}
            className={`transition-opacity duration-300 ease-in-out ${
              isCollapsed ? "opacity-0" : "opacity-100"
            }`}
          />
          <Image
            src="/alfamidi-logo-mini.png"
            alt="Logo Mini"
            width={40}
            height={40}
            className={`absolute transition-opacity duration-300 ease-in-out ${
              isCollapsed ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Profile */}
        <div
          className="
            flex flex-col items-center justify-start pt-6 gap-2
            transition-all duration-300 w-full px-4   
          "
        >
          <User className="h-12 w-12 rounded-full border p-2 flex-shrink-0" />

          {loadingUser ? (
            <p className="text-foreground font-semibold">Loading...</p>
          ) : userError ? (
            <p className="text-primary text-sm">Gagal memuat data</p>
          ) : (
            <div
              className={`
                flex flex-col items-center 
                transition-opacity duration-200
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
      </div>

      {/* menu */}
      <nav
        className="
          absolute left-4 right-4 top-[240px] space-y-4 mt-2
        "
      >
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center rounded text-sm font-medium
              transition-[background-color,color] duration-200 
              ${isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3"}
              ${
                pathname.startsWith(item.href) &&
                (pathname.length === item.href.length ||
                  pathname.charAt(item.href.length) === "/")
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            <div className="flex-shrink-0" style={{ width: "20px" }}>
              {item.icon}
            </div>
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/*BAGIAN LOGOUT*/}
      <div className="p-4 mt-auto">
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
