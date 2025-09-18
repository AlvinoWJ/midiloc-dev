"use client";

import MobileSidebar from "./sidebar";
import MobileNavbar from "./navbar";
import PetaLoader from "@/components/map/PetaLoader";
import { DashboardPageProps } from "@/types/common";

export default function MobileDashboardLayout(props: DashboardPageProps) {
  const { propertiData, isLoading, isError } = props;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Komponen sidebar dan navbar dipanggil tanpa props */}
      <MobileSidebar />
      <MobileNavbar />

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4 relative z-10">
        {isLoading ? (
          // Skeleton Loading untuk data peta (propertiData)
          <div>
            <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            <div className="mt-4 h-96 w-full bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        ) : isError ? (
          // Error State untuk data peta (propertiData)
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold">Gagal Memuat Data</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Silakan coba lagi nanti.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-3 rounded-lg w-full max-w-xs"
            >
              Muat Ulang
            </button>
          </div>
        ) : (
          // Content Loaded State
          <>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="bg-white p-2 rounded-lg shadow-md h-[60vh] w-full border">
              <PetaLoader data={propertiData} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
