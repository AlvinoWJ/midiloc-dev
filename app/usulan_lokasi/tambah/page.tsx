"use client";

import { useSidebar } from "@/components/ui/sidebarcontext";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import addulokform from "@/components/addulokform";
import AddUlokForm from "@/components/addulokform";

export default function TambahUlokPage() {
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
        <main className="flex-1 p-6 mt-3 ">
          <AddUlokForm />

          {/* Tombol */}
        </main>
      </div>
    </div>
  );
}
