"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useProgress } from "@/hooks/progress_kplt/useProgress";
import ProgressKpltLayout from "@/components/layout/progress_kplt_layout";

export default function ProgressKpltPage() {
  /**
   * State untuk pagination, pencarian, dan filter bulan/tahun.
   */
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  /**
   * Mengambil data progress KPLT berdasarkan parameter:
   * - page → halaman pagination
   * - search → query pencarian
   * - month, year → filter berdasarkan bulan & tahun
   *
   * Hook ini juga menyediakan state loading, refreshing, dan error.
   */
  const { progressData, totalPages, isInitialLoading, isRefreshing, isError } =
    useProgress({
      page: currentPage,
      search: searchQuery,
      month: filterMonth,
      year: filterYear,
    });

  /**
   * Handler untuk pencarian.
   * Setiap pencarian baru, halaman akan di-reset ke 1.
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  /**
   * Handler untuk perubahan filter (bulan dan tahun).
   * Menggunakan useCallback agar referensi function tetap stabil.
   */
  const handleFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  }, []);

  /**
   * Props yang dikirim ke layout sebagai satu objek.
   * Ini menjaga komponen tetap bersih dan mudah dibaca.
   */
  const layoutProps = {
    isLoading: isInitialLoading,
    isRefreshing,
    isError,

    progressData,

    onPageChange: setCurrentPage,

    searchQuery,
    filterMonth,
    filterYear,
    onSearch: handleSearch,

    currentPage,
    totalPages,

    onFilterChange: handleFilterChange,
  };

  /**
   * Render layout utama untuk halaman Progress KPLT.
   */
  return <ProgressKpltLayout {...layoutProps} />;
}
