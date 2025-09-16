"use client";

import { useSidebar } from "@/hooks/useSidebar";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import SWRProvider from "@/app/swr-provider";

export default function From_KpltpageWrapper() {
  // Jika nanti SWRProvider sudah ada di layout global, cukup return <UlokPage />
  return (
    <SWRProvider>
      <Form_KpltPage />
    </SWRProvider>
  );
}

export function Form_KpltPage() {
  // Mengambil state isCollapsed dari context
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Konten utama yang memiliki margin kiri dinamis sesuai sidebar */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />

        {/* Konten halaman */}
        <main className="flex-1 p-6 space-y-6">
          <h1 className="mt-3 text-2xl font-bold">Your Performance</h1>
        </main>
      </div>
    </div>
  );
}
