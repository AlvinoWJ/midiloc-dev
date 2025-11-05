// components/layout/progress_kplt_layout.tsx
"use client";

import React from "react";
import { InfoCard } from "@/components/ui/infocard";
import { UlokPageSkeleton } from "@/components/ui/skleton"; // Kita gunakan skeleton yang ada
import { Button } from "@/components/ui/button";
import { ProgressItem, ProgressMeta } from "@/hooks/useProgress"; // Impor tipe dari hook
import SearchWithFilter from "../ui/searchwithfilter";

interface ProgressKpltLayoutProps {
  isLoading: boolean;
  isError: boolean;
  progressData: ProgressItem[];
  meta: ProgressMeta | undefined;
  onPageChange: (newPage: number) => void;
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
}

export default function ProgressKpltLayout({
  isLoading,
  isError,
  progressData,
  meta,
  onPageChange,
  searchQuery,
  filterMonth,
  filterYear,
  onSearch,
  onFilterChange,
}: ProgressKpltLayoutProps) {
  const isFilterActive = !!searchQuery || !!filterMonth || !!filterYear;

  if (isLoading && progressData.length === 0) {
    return <UlokPageSkeleton cardCount={6} />;
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

  return (
    <main className="space-y-4 lg:space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold">Progress KPLT</h1>
        <SearchWithFilter onSearch={onSearch} onFilterChange={onFilterChange} />
      </div>

      {/* Konten Grid / List */}
      {progressData.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="text-gray-300 text-6xl mb-4">⏱️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isFilterActive
              ? "Tidak ada data yang cocok"
              : "Belum ada data progress"}
          </h3>
          <p className="text-gray-500 text-sm lg:text-base max-w-md">
            {isFilterActive
              ? "Coba ubah kata kunci pencarian atau filter untuk menemukan data yang Anda cari."
              : "Saat ini belum ada data progress KPLT yang tercatat."}
          </p>
        </div>
      ) : (
        // Tampilan Kartu Data
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
          {progressData.map((item) => {
            const kpltId = item.id;
            const kpltName = item.kplt_id?.nama_kplt;

            if (!kpltId) {
              return null;
            }

            return (
              <InfoCard
                key={item.id}
                id={kpltId}
                nama={kpltName || "Nama KPLT tidak ditemukan"}
                alamat={item.status || "Status tidak diketahui"}
                created_at={item.created_at || new Date().toISOString()}
                status={item.status || "N/A"}
                detailPath="/progress_kplt/detail/"
              />
            );
          })}
        </div>
      )}

      {meta && meta.total_pages > 1 && !isFilterActive && (
        <div className="flex justify-between items-center mt-8">
          <Button
            onClick={() => onPageChange(meta.page - 1)}
            disabled={meta.page <= 1 || isLoading}
            variant="default"
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-gray-700">
            Halaman {meta.page} dari {meta.total_pages}
          </span>
          <Button
            onClick={() => onPageChange(meta.page + 1)}
            disabled={meta.page >= meta.total_pages || isLoading}
            variant="default"
          >
            Berikutnya
          </Button>
        </div>
      )}
    </main>
  );
}
