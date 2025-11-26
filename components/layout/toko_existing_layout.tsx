// components/layout/toko_existing_layout.tsx
"use client";

import React from "react";
import { TokoExistingItem } from "@/hooks/toko_existing/useTokoExisting";
import { TokoExistingInfoCard } from "../ui/toko_existing/toko_existing_info_card";
import TokoExistingFilter from "../ui/toko_existing/toko_existing_filter";
import PetaLoader from "../map/PetaLoader";
import { Properti } from "@/types/common";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

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
  isRefreshing?: boolean;
  isError: boolean;
  tokoData: TokoExistingItem[];
  mapData?: Properti[];
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
}

export default function TokoExistingLayout(props: TokoExistingLayoutProps) {
  const {
    isLoading,
    isRefreshing,
    isError,
    tokoData,
    mapData,
    searchQuery,
    filterYear,
    filterMonth,
    onPageChange,
    onSearch,
    onFilterChange,
    currentPage,
    totalPages,
  } = props;

  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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

  if (isLoading) {
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold">Toko Existing</h1>
        <TokoExistingFilter
          onSearch={onSearch}
          onFilterChange={onFilterChange}
        />
      </div>

      <div className="w-full h-[400px] bg-white rounded-xl shadow-md overflow-hidden border z-0 relative">
        <PetaLoader data={mapData} />
      </div>
      <div className=" flex-grow">
        {isRefreshing ? (
          <div className="flex items-center justify-center mt-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : tokoData.length === 0 ? (
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
          <div className="mt-2 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 min-h-[23rem] flex-grow">
            {isLoading ? (
              <TokoExistingSkeleton />
            ) : (
              tokoData.map((item) => (
                <div key={item.id} className="flex flex-col h-full">
                  <TokoExistingInfoCard
                    id={item.id}
                    nama={item.nama_toko}
                    alamat={item.alamat || "Alamat tidak tersedia"}
                    tgl_go={item.tgl_go}
                    kode_toko={item.kode_store}
                    habis_sewa={item.akhir_sewa}
                    detailPath="/toko_existing/detail/"
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-auto pt-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

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

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

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
