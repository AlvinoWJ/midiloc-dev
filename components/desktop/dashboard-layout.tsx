// components/desktop/dashboard-layout.tsx
"use client";

import { useSidebar } from "@/hooks/useSidebar";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import PetaLoader from "@/components/map/PetaLoader";
import { DashboardPageProps } from "@/types/common";

export default function DesktopDashboardLayout(props: DashboardPageProps) {
  const { propertiData, isLoading, isError } = props;
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

        <main className="flex-1 p-6 space-y-6">
          {isLoading ? (
            // Skeleton Loading State
            <div>
              <div className="h-9 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              <div className="mt-6 h-[500px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ) : isError ? (
            // Error State
            <div className="flex items-center justify-center min-h-[60vh] text-center">
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Gagal Memuat Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Terjadi kesalahan saat memuat data dashboard.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Muat Ulang
                </button>
              </div>
            </div>
          ) : (
            // Content Loaded State
            <>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <div className="bg-white p-4 rounded-lg shadow-md h-[calc(100vh-200px)] w-full border">
                <PetaLoader data={propertiData} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
