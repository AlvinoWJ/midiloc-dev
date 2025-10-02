// file: main/layout.tsx
"use client";

import React from "react";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
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
          className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
            isCollapsed ? "ml-[80px]" : "ml-[270px]"
          }`}
        >
          <Navbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SWRProvider>
  );
}
