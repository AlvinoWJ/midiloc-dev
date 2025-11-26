"use client";

import React from "react";
import { ProgressInfoCard } from "../ui/progress_kplt/progress_info_card";
import { ProgressKpltSkeleton } from "@/components/ui/skleton";
import { ProgressItem } from "@/hooks/progress_kplt/useProgress";
import SearchWithFilter from "../ui/searchwithfilter";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

interface ProgressKpltLayoutProps {
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  progressData: ProgressItem[];
  onPageChange: (page: number) => void;
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  onSearch: (query: string) => void;
  currentPage: number;
  totalPages: number;
  onFilterChange: (month: string, year: string) => void;
}

export default function ProgressKpltLayout(props: ProgressKpltLayoutProps) {
  const {
    isLoading,
    isRefreshing,
    isError,
    progressData,
    onPageChange,
    currentPage,
    totalPages,
    onSearch,
    onFilterChange,
  } = props;

  const isContentLoading = isLoading || isRefreshing;

  const calculateProgress = (item: ProgressItem): number => {
    type ValidStatus =
      | "Not Started"
      | "Mou"
      | "Perizinan"
      | "Notaris"
      | "Renovasi"
      | "Grand Opening";

    const statusMap: Record<ValidStatus, number> = {
      "Not Started": 0,
      Mou: 20,
      Perizinan: 40,
      Notaris: 60,
      Renovasi: 80,
      "Grand Opening": 100,
    };
    const status = item.status as ValidStatus;
    return statusMap[status] ?? 0;
  };

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

  if (isLoading && progressData.length === 0) {
    return <ProgressKpltSkeleton />;
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
            Terjadi kesalahan saat mengambil data Progress KPLT. Silakan coba
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
        <h1 className="text-2xl lg:text-4xl font-bold">Progress KPLT</h1>
        <SearchWithFilter onSearch={onSearch} onFilterChange={onFilterChange} />
      </div>

      <div className="flex-grow">
        {isRefreshing ? (
          <div className="flex items-center justify-center min-h-[23rem]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : progressData.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 flex-grow">
            <div className="text-gray-300 text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada data progres
            </h3>
            <p className="text-gray-500 text-sm lg:text-base max-w-md">
              Tambahkan data progres baru untuk mulai memantau perkembangan
              KPLT.
            </p>
          </div>
        ) : (
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 min-h-[23rem] flex-grow">
            {progressData.map((item) => {
              const kpltId = item.id;
              const kpltName = item.kplt?.nama_kplt;
              const kpltAlamat = item.kplt?.alamat || "Alamat tidak tersedia";
              const progressPercentage = calculateProgress(item);

              if (!kpltId) return null;

              return (
                <div key={item.id} className="flex flex-col h-full">
                  <ProgressInfoCard
                    id={kpltId}
                    nama={kpltName || "Nama KPLT tidak ditemukan"}
                    alamat={kpltAlamat}
                    created_at={item.created_at || new Date().toISOString()}
                    status={item.status || "N/A"}
                    progressPercentage={progressPercentage}
                    detailPath="/progress_kplt/detail/"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-auto pt-6">
          <div className="flex items-center gap-1">
            {/* Tombol halaman pertama */}
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || isLoading || isRefreshing}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>

            {/* Tombol sebelumnya */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading || isRefreshing}
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
                        ? "bg-primary text-white shadow-lg shadow-red-500/30 scale-105"
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
              disabled={currentPage >= totalPages || isLoading || isRefreshing}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Tombol halaman terakhir */}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages || isLoading || isRefreshing}
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
