// components/layout/toko_existing_layout.tsx
"use client";

import React from "react";
import { TokoExistingItem, TokoExistingMeta } from "@/types/toko_existing";
import { TokoExistingInfoCard } from "../ui/toko_existing/toko_existing_info_card";
import TokoExistingFilter from "../ui/toko_existing/toko_existing_filter";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";

// Mock Skeleton Component (meniru ProgressKpltSkeleton)
const TokoExistingSkeleton = () => (
  <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 min-h-[23rem] flex-grow">
    {Array.from({ length: 9 }).map((_, index) => (
      <div
        key={index}
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 space-y-4 animate-pulse h-[200px]"
      >
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-full mt-auto"></div>
      </div>
    ))}
  </div>
);

interface TokoExistingLayoutProps {
  isLoading: boolean;
  isError: boolean;
  tokoData: TokoExistingItem[];
  meta: TokoExistingMeta | undefined;
  onPageChange: (newPage: number) => void;
  searchQuery: string;
  filterYear: string;
  filterRegional: string;
  onSearch: (query: string) => void;
  onFilterChange: (year: string, regional: string) => void;
  // Mock property untuk simulasi pemeriksaan peran pengguna
  userRole: "Staff" | "Region Manager" | "General Manager";
}

export default function TokoExistingLayout({
  isLoading,
  isError,
  tokoData,
  meta,
  onPageChange,
  searchQuery,
  filterYear,
  filterRegional,
  onSearch,
  onFilterChange,
  userRole,
}: TokoExistingLayoutProps) {
  const currentPage = meta?.page || 1;
  const totalPages = meta?.totalPages || 1;

  // Function to generate page numbers with ellipsis (dicopy dari progress_kplt_layout)
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (showEllipsisStart) {
        pages.push("ellipsis-start");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (showEllipsisEnd) {
        pages.push("ellipsis-end");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  // Tampilkan skeleton saat memuat data awal
  if (
    isLoading &&
    tokoData.length === 0 &&
    searchQuery === "" &&
    filterYear === "" &&
    filterRegional === ""
  ) {
    return <TokoExistingSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:p-8 max-w-md">
          <div className="text-red-500 text-5xl lg:text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-gray-600 text-sm lg:text-base mb-4">
            Terjadi kesalahan saat mengambil data Toko Existing. Silakan coba
            lagi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors w-full lg:w-auto"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="space-y-4 lg:space-y-6 flex flex-col">
      {/* Header Halaman */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold">Toko Existing</h1>
        <TokoExistingFilter
          onSearch={onSearch}
          onFilterChange={onFilterChange}
          userRole={userRole}
        />
      </div>

      {/* Konten Grid / List */}
      {tokoData.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 flex-grow">
          <div className="text-gray-300 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada data toko ditemukan
          </h3>
          <p className="text-gray-500 text-sm lg:text-base max-w-md">
            Coba sesuaikan pencarian atau filter Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 min-h-[23rem] flex-grow">
          {isLoading ? (
            <TokoExistingSkeleton />
          ) : (
            tokoData.map((item) => (
              <div key={item.id} className="flex flex-col h-full">
                <TokoExistingInfoCard
                  id={item.id}
                  nama={item.nama_toko}
                  alamat={item.alamat || "Alamat tidak tersedia"}
                  regional={item.regional || "N/A"}
                  tahun_beroperasi={item.tahun_beroperasi}
                  status={item.status}
                  detailPath="/toko_existing/detail/" // Placeholder path
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-auto pt-2">
          <div className="flex items-center gap-1">
            {/* Tombol halaman pertama */}
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>

            {/* Tombol sebelumnya */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Nomor halaman */}
            <div className="flex items-center gap-1 mx-2">
              {pageNumbers.map((pageNum) =>
                typeof pageNum === "string" ? (
                  <div
                    key={pageNum}
                    className="flex items-center justify-center px-2 text-gray-400"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </div>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    disabled={isLoading}
                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                      pageNum === currentPage
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                        : "text-gray-700 hover:bg-gray-100"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                )
              )}
            </div>

            {/* Tombol berikutnya */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Tombol halaman terakhir */}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
