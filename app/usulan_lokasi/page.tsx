"use client";

import { useSidebar } from "@/components/ui/sidebarcontext";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import { InfoCard } from "@/components/infocard";
import SearchBar from "@/components/ui/searchbar";
import Tabs from "@/components/ui/tabs";
import AddButton from "@/components/ui/addbutton";
import { useRouter } from "next/navigation";

export default function UlokPage() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();

  return (
    <div className="flex">
      <Sidebar />

      {/* Konten utama */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />

        <main className="flex-1 p-6 space-y-6">
          {/* Header atas */}
          <div className="flex items-center justify-between">
            <h1 className="mt-3 text-4xl font-bold mb-4">Usulan Lokasi</h1>
            <SearchBar />
          </div>

          {/* Tab Recent & History + Add */}
          <div className="flex items-center justify-between">
            <Tabs
              tabs={["Recent", "History"]}
              onTabChange={(tab) => console.log(tab)}
            />
            <AddButton onClick={() => router.push("/usulan_lokasi/tambah")} />
          </div>

          {/* Grid Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 100 }).map((_, i) => (
              <InfoCard key={i} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
