"use client";

/**
 * UlokEksternalPage
 * ------------------
 * Halaman utama untuk menampilkan data ULOK Eksternal.
 *
 * Fitur utama:
 * - Pencarian (search)
 * - Filter bulan & tahun
 * - Tab Recent / History
 * - Pagination
 * - Fetch data menggunakan hook useUlokEksternal
 * - Mengirim semua state & handler ke layout UlokEksternalLayout
 */

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useUlokEksternal } from "@/hooks/ulok_eksternal/useUlokEksternal";
import UlokEksternalLayout from "@/components/layout/ulok_eksternal_layout";

const ITEMS_PER_PAGE = 9;

export default function UlokEksternalPage() {
  /**
   * ------------------------------
   * Local State Management
   * ------------------------------
   * Penyimpanan state UI:
   * - searchQuery  → kata kunci pencarian
   * - filterMonth  → filter bulan
   * - filterYear   → filter tahun
   * - activeTab    → tab saat ini (Recent / History)
   * - currentPage  → pagination
   */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Mengambil data user login
   * → Digunakan untuk menampilkan informasi user di layout
   */
  const { user } = useUser();

  /**
   * --------------------------------------------
   * Fetch Data Menggunakan Hook useUlokEksternal
   * --------------------------------------------
   * Hook ini melakukan fetch ke API berdasarkan:
   * - page
   * - search
   * - filter bulan & tahun
   * - activeTab (recent/history)
   *
   * Mengembalikan:
   * - ulokEksternalData → array data ULOK eksternal
   * - isInitialLoading  → loading pertama kali
   * - isRefreshing      → loading saat refresh SWR
   * - ulokEksternalError → error state
   * - meta              → pagination metadata
   */
  const {
    ulokEksternalData,
    isInitialLoading,
    isRefreshing,
    ulokEksternalError,
    meta,
  } = useUlokEksternal({
    page: currentPage,
    search: searchQuery,
    month: filterMonth,
    year: filterYear,
    activeTab: activeTab,
  });

  /**
   * Handler untuk mengubah filter bulan & tahun.
   * Dibalut useCallback karena dependency-nya statis.
   * Reset halaman ke 1 setiap kali filter berubah.
   */
  const onFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  }, []);

  /**
   * Handler pencarian (search)
   * Reset pagination ke halaman pertama.
   */
  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  /**
   * Handler mengganti tab (Recent ↔ History)
   * Reset pagination ke halaman pertama.
   */
  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  /**
   * ---------------------------------------------
   * Konstruksi Props Untuk Layout
   * ---------------------------------------------
   * Semua state & handler dikemas dalam satu objek
   * agar mudah dikelola di UlokEksternalLayout.
   */
  const layoutProps = {
    user,
    isLoading: isInitialLoading,
    isRefreshing: isRefreshing,
    isError: !!ulokEksternalError,
    filteredUlok: ulokEksternalData,
    activeTab,
    searchQuery,
    filterMonth,
    filterYear,
    onTabChange,
    onSearch: onSearchChange,
    onFilterChange,
    currentPage,
    totalPages: meta?.totalPages ?? 0,
    onPageChange: setCurrentPage,
  };

  /**
   * ---------------------------------------------
   * Render Halaman Menggunakan Layout
   * ---------------------------------------------
   */
  return <UlokEksternalLayout {...layoutProps} />;
}
