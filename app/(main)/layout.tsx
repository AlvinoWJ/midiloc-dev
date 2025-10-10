// file: main/layout.tsx
"use client";

import React from "react";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import { useSidebar } from "@/hooks/useSidebar";
import SWRProvider from "../swr-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <SWRProvider>
      <div className="flex">
        <Sidebar />
        <div
          className={
            // PERBAIKAN DI SINI:
            // Margin kiri hanya diterapkan pada layar 'lg' ke atas.
            // Di layar kecil, margin akan otomatis 0.
            `flex-1 flex flex-col transition-all duration-300 ${
              isCollapsed ? "lg:ml-[80px]" : "lg:ml-[270px]"
            }`
          }
        >
          <Navbar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SWRProvider>
  );
}
