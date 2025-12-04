"use client";

import { UlokEksternal } from "@/hooks/ulok_eksternal/useUlokEksternal";
import { InfoCard } from "@/components/ui/infocard";
import Tabs from "@/components/ui/tabs";
import SearchWithFilter from "@/components/ui/searchwithfilter";
import { UlokPageSkeleton } from "@/components/ui/skleton";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  Building,
} from "lucide-react";

/**
 * Interface untuk props komponen layout.
 * Berisi state loading, data array, dan handler untuk filter/pagination.
 */
export type UlokEksternalPageProps = {
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  activeTab: string;
  filteredUlok: UlokEksternal[];
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
  onTabChange: (tab: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Komponen Layout Utama untuk Halaman Daftar Ulok Eksternal.
 * * Fitur:
 * - Menampilkan daftar kartu usulan (Grid).
 * - Tab Navigasi (Recent vs History).
 * - Pagination dinamis.
 * - Penanganan state visual (Skeleton, Error, Empty).
 */
export default function UlokEksternalLayout(props: UlokEksternalPageProps) {
  const {
    isLoading,
    isRefreshing,
    isError,
    activeTab,
    filteredUlok,
    searchQuery,
    filterMonth,
    filterYear,
    onSearch,
    onFilterChange,
    onTabChange,
    currentPage,
    totalPages,
    onPageChange,
  } = props;

  /**
   * Helper untuk membuat array nomor halaman pagination.
   * Logika:
   * - Jika halaman sedikit (<= 7), tampilkan semua.
   * - Jika halaman banyak, gunakan 'ellipsis-start' atau 'ellipsis-end' (...)
   * untuk menyingkat tampilan, namun tetap menampilkan halaman pertama, terakhir,
   * dan halaman di sekitar posisi aktif.
   */
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

  /* --- KONDISI 1: INITIAL LOADING --- */
  // Tampilkan Skeleton saat data pertama kali diambil
  if (isLoading) {
    return <UlokPageSkeleton />;
  }

  /* --- KONDISI 2: ERROR STATE --- */
  // Tampilkan pesan error dan tombol refresh jika fetch gagal
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:p-8 max-w-md">
          <div className="text-red-500 text-5xl lg:text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-gray-600 text-sm lg:text-base mb-4">
            Terjadi kesalahan saat mengambil data. Silakan coba lagi.
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

  /* --- KONDISI 3: DATA READY (Main Content) --- */
  return (
    <div className="space-y-4 lg:space-y-6 flex flex-col flex-grow">
      {/* Header & Filter Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold">Ulok Eksternal</h1>
        <SearchWithFilter onSearch={onSearch} onFilterChange={onFilterChange} />
      </div>

      {/* Tab Navigation Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <Tabs
          tabs={["Recent", "History"]}
          onTabChange={onTabChange}
          activeTab={activeTab}
        />
      </div>

      {/* Content Area */}
      <div className="relative flex-grow">
        {/* State Refreshing (Loading Spinner saat ganti halaman/filter) */}
        {isRefreshing ? (
          <div className="flex items-center justify-center min-h-[23rem]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredUlok.length === 0 ? (
          /* State Empty (Data Kosong) */
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 flex-grow">
            <div className="text-gray-300 text-6xl mb-4">
              <Building />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterMonth || filterYear
                ? "Tidak ada data yang cocok"
                : "Belum ada data ulok eksternal"}
            </h3>
            <p className="text-gray-500 text-sm lg:text-base max-w-md">
              {searchQuery || filterMonth || filterYear
                ? "Coba ubah kata kunci pencarian atau filter Anda."
                : "Belum ada data riwayat usulan lokasi eksternal."}
            </p>
          </div>
        ) : (
          /* Grid Data List */
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 min-h-[23rem]">
            {filteredUlok.map((ulok) => (
              <InfoCard
                key={ulok.id}
                id={ulok.id}
                nama={ulok.nama_ulok || "Data Eksternal"}
                alamat={ulok.alamat || "Lokasi belum ditentukan"}
                created_at={ulok.created_at}
                status={ulok.status_ulok_eksternal}
                detailPath="/ulok_eksternal/detail"
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !isRefreshing && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-auto pt-6">
          <div className="flex items-center gap-1">
            {/* Tombol Previous */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading || isRefreshing}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Nomor Halaman */}
            <div className="flex items-center gap-1 mx-2">
              {pageNumbers.map((pageNum) => {
                if (typeof pageNum === "string") {
                  return (
                    <div
                      key={pageNum}
                      className="flex items-center justify-center px-2 text-gray-400"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </div>
                  );
                }
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    disabled={isLoading || isRefreshing}
                    className={`
                      w-10 h-10 rounded-full text-sm font-semibold transition-all
                      ${
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-red-500/30 scale-105"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                      disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                    aria-label={`Halaman ${pageNum}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Tombol Next */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading || isRefreshing}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
