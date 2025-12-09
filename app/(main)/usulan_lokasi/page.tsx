"use client";

/**
 * UlokPage
 * --------
 * Halaman utama daftar ULok yang menampilkan:
 * - Pencarian (search)
 * - Filter bulan & tahun
 * - Tab navigasi (Recent / On Progress / dsb)
 * - Pagination
 *
 * Fitur utama:
 * - Mengambil data ULok menggunakan hook `useUlok`
 * - Mengatur filter, search, pagination, dan tab secara terpusat
 * - Menentukan role user (Location Specialist)
 * - Meneruskan semua data & handler ke `UlokLayout`
 */

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useUlok } from "@/hooks/ulok/useUlok";
import UlokLayout from "@/components/layout/ulok_layout";

// const ITEMS_PER_PAGE = 9;

export default function UlokPage() {
  /**
   * State untuk pencarian & filter.
   */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");

  /**
   * State untuk halaman aktif pagination.
   */
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Data user yang sedang login.
   */
  const { user } = useUser();

  /**
   * Ambil data ULok berdasarkan parameter filter, pagination, dan tab.
   * Hook `useUlok` mengembalikan:
   * - ulokData → daftar ULok
   * - meta → total halaman & meta lainnya
   * - isInitialLoading → loading pertama kali
   * - isRefreshing → loading ketika SWR revalidate
   * - ulokError → error ketika fetch gagal
   */
  const { ulokData, meta, isInitialLoading, isRefreshing, ulokError } = useUlok(
    {
      page: currentPage,
      search: searchQuery,
      month: filterMonth,
      year: filterYear,
      activeTab: activeTab,
    }
  );

  /**
   * Menentukan apakah user adalah "Location Specialist".
   * Digunakan untuk menampilkan fitur tertentu pada layout.
   */
  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  /**
   * Handler perubahan filter bulan & tahun.
   * Reset halaman ke 1 agar data konsisten.
   */
  const onFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  }, []);

  /**
   * Handler pencarian.
   * Reset halaman ke 1 setiap kali query berubah.
   */
  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  /**
   * Handler perubahan tab.
   * Reset halaman ke 1 agar hasil sesuai.
   */
  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  /**
   * Props yang diteruskan ke layout ULok.
   * Mengelompokkan semua state & handler agar lebih rapih.
   */
  const layoutProps = {
    user,
    isLoading: isInitialLoading,
    isRefreshing,
    isError: !!ulokError,
    filteredUlok: ulokData,
    activeTab,
    searchQuery,
    filterMonth,
    filterYear,
    isLocationSpecialist,
    onTabChange,
    onSearch: onSearchChange,
    onFilterChange,
    currentPage,
    totalPages: meta?.totalPages ?? 0,
    onPageChange: setCurrentPage,
  };

  /**
   * Render layout ULok dengan semua props.
   */
  return <UlokLayout {...layoutProps} />;
}
