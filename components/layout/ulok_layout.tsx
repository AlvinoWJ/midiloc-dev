"use client";

import { UlokPageProps } from "@/types/common";
import { InfoCard } from "@/components/ui/infocard";
import AddButton from "@/components/ui/addbutton";
import Tabs from "@/components/ui/tabs";
import SearchWithFilter from "@/components/ui/searchwithfilter";
import { UlokPageSkeleton } from "@/components/ui/skleton";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";

export default function UlokLayout(props: UlokPageProps) {
  const router = useRouter();

  const {
    isLoading,
    isError,
    activeTab,
    filteredUlok,
    searchQuery,
    filterMonth,
    filterYear,
    isLocationSpecialist,
    onSearch,
    onFilterChange,
    onTabChange,
    currentPage,
    totalPages,
    onPageChange,
  } = props;

  // Function to generate page numbers with ellipsis
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

      // Show current page and surrounding pages
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (showEllipsisEnd) {
        pages.push("ellipsis-end");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (isLoading) {
    return <UlokPageSkeleton />;
  }

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

  return (
    <div className="space-y-4 lg:space-y-6 flex flex-col flex-grow">
      {/* Header: Judul dan Search/Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold">Usulan Lokasi</h1>
        <SearchWithFilter onSearch={onSearch} onFilterChange={onFilterChange} />
      </div>

      {/* Kontrol: Tabs dan Tombol Tambah */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <Tabs
          tabs={["Recent", "History"]}
          onTabChange={onTabChange}
          activeTab={activeTab}
        />
        {isLocationSpecialist() && (
          <AddButton onClick={() => router.push("/usulan_lokasi/tambah")} />
        )}
      </div>

      {/* Konten Grid / List */}
      {filteredUlok.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 flex-grow">
          <div className="text-gray-300 text-6xl mb-4">📍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterMonth || filterYear
              ? "Tidak ada data yang cocok"
              : "Belum ada data ulok"}
          </h3>
          <p className="text-gray-500 text-sm lg:text-base max-w-md">
            {searchQuery || filterMonth || filterYear
              ? "Coba ubah kata kunci pencarian atau filter Anda."
              : activeTab === "Recent"
              ? "Mulai dengan menambahkan usulan lokasi baru."
              : "Belum ada data riwayat usulan lokasi."}
          </p>
          {isLocationSpecialist() &&
            !searchQuery &&
            !filterMonth &&
            !filterYear &&
            activeTab === "Recent" && (
              <button
                onClick={() => router.push("/usulan_lokasi/tambah")}
                className="mt-6 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors w-full max-w-xs lg:w-auto"
              >
                Tambah Usulan Lokasi
              </button>
            )}
        </div>
      ) : (
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 min-h-[23rem]">
          {filteredUlok.map((ulok) => (
            <InfoCard
              key={ulok.id}
              id={ulok.id}
              nama={ulok.nama_ulok}
              alamat={ulok.alamat}
              created_at={ulok.created_at}
              status={ulok.approval_status}
              detailPath="/usulan_lokasi/detail"
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-auto pt-6">
          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            {/* First Page Button */}
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              aria-label="Halaman pertama"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>

            {/* Previous Button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2">
              {pageNumbers.map((pageNum) => {
                if (typeof pageNum === "string") {
                  // Ellipsis
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
                    disabled={isLoading}
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

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              aria-label="Halaman terakhir"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
