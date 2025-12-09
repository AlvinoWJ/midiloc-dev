"use client";

/**
 * Halaman KPLTPage
 * ----------------
 * Komponen client-side ini bertanggung jawab untuk:
 * - Mengambil data KPLT (recent & history)
 * - Mengatur pencarian, filter bulan/tahun, dan pagination
 * - Menentukan apakah user adalah Location Specialist
 * - Melakukan filtering data berdasarkan role user
 * - Mengirim seluruh props terstruktur ke KpltLayout
 */

import { useState, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useKplt } from "@/hooks/kplt/useKplt";
import KpltLayout from "@/components/layout/kplt_layout";

export default function KPLTPage() {
  /**
   * State untuk pencarian, filter waktu, tab navigasi,
   * dan pagination.
   */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Ambil data user yang sedang login.
   */
  const { user, loadingUser, userError } = useUser();

  /**
   * Menentukan apakah user adalah Location Specialist.
   * Menggunakan useMemo agar tidak dihitung ulang setiap render.
   */
  const isLocationSpecialist = useMemo(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  /**
   * Ambil data KPLT berdasarkan:
   * - tab aktif (recent / history)
   * - halaman (pagination)
   * - pencarian
   * - filter bulan dan tahun
   */
  const {
    kpltData,
    meta,
    isInitialLoading,
    isRefreshing,
    isError: kpltError,
  } = useKplt({
    scope: activeTab === "Recent" ? "recent" : "history",
    page: currentPage,
    search: searchQuery,
    month: filterMonth,
    year: filterYear,
  });

  /**
   * Filter khusus:
   * Hanya Location Specialist yang bisa melihat data
   * dengan status "Need Input".
   */
  const filteredDisplayData = kpltData.filter((item) =>
    item.status === "Need Input" ? isLocationSpecialist : true
  );

  /**
   * Handler perubahan filter bulan & tahun.
   * Reset halaman ke 1.
   */
  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  };

  /**
   * Handler perubahan pencarian.
   * Reset halaman ke 1.
   */
  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  /**
   * Handler perubahan tab (Recent / History).
   * Reset halaman ke 1.
   */
  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  /**
   * Handler pagination.
   */
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Props lengkap yang dikirim ke layout utama.
   */
  const layoutProps = {
    user,
    isLoading: loadingUser || isInitialLoading,
    isRefreshing,
    isError: !!userError || !!kpltError,
    displayData: filteredDisplayData,
    searchQuery,
    filterMonth,
    filterYear,
    activeTab,
    isLocationSpecialist,
    onTabChange,
    onSearch: onSearchChange,
    onFilterChange,
    currentPage,
    totalPages: meta.totalPages,
    onPageChange,
  };

  /**
   * Render layout dengan seluruh props yang sudah diproses.
   */
  return <KpltLayout {...layoutProps} />;
}
