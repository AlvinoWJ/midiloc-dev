// app/dashboard/page.tsx
"use client";

// --- TAMBAHAN BARU 1: Import semua yang berhubungan dengan peta ---
import PetaLoader from "@/components/map/PetaLoader";

// Import yang sudah ada
import { useSidebar } from "@/components/ui/sidebarcontext";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import { dummyPropertiData } from "@/lib/dummy-data";
import SWRProvider from "@/app/swr-provider";

export default function DashboardPageWrapper() {
  // Jika nanti SWRProvider sudah ada di layout global, cukup return <UlokPage />
  return (
    <SWRProvider>
      <DashboardPage />
    </SWRProvider>
  );
}

export function DashboardPage() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex">
      <Sidebar />

      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />

        <main className="flex-1 p-6">
          <h1 className="mt-3 text-2xl font-bold">Your Performance</h1>

          {/* --- TAMBAHAN BARU 3: Sisipkan Peta di Sini --- */}
          <div className="mt-8">
            <div className="bg-white p-4 rounded-lg shadow-md h-[500px] w-full border">
              <PetaLoader data={dummyPropertiData} />
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
}