"use client";

/**
 * TokoExistingPage
 * -----------------
 * Halaman daftar toko existing yang menampilkan:
 * - List toko berdasarkan pencarian, filter bulan, filter tahun
 * - Pagination data toko
 * - Peta lokasi toko (diolah menjadi Properti[] untuk komponen map)
 *
 * Fitur utama:
 * - Fetch data toko dengan hook `useTokoExisting`
 * - Pencarian (search)
 * - Filtering berdasarkan bulan & tahun
 * - Pagination
 * - Memoization mapData agar efisien saat render ulang
 */

import React, { useState, useCallback, useMemo } from "react";
import { useTokoExisting } from "@/hooks/toko_existing/useTokoExisting";
import TokoExistingLayout from "@/components/layout/toko_existing_layout";
import { Properti } from "@/types/common";

export default function TokoExistingPage() {
  /**
   * State: search & filter
   * -----------------------
   * searchQuery  → pencarian berdasarkan nama/alamat
   * filterMonth  → filter bulan
   * filterYear   → filter tahun
   */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  /**
   * State pagination.
   */
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Fetch data toko existing berdasarkan query.
   * Hook ini mengembalikan:
   * - tokoData        → array data toko
   * - meta            → informasi pagination
   * - isInitialLoading → ketika pertama kali load
   * - isRefreshing     → SWR revalidation
   * - isError          → jika fetch gagal
   */
  const { tokoData, meta, isInitialLoading, isRefreshing, isError } =
    useTokoExisting({
      page: currentPage,
      search: searchQuery,
      month: filterMonth,
      year: filterYear,
    });

  /**
   * Handler perubahan input pencarian.
   * Reset ke page 1 setiap kali user search.
   */
  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  /**
   * Handler filter bulan & tahun.
   * Dibuat memoized dengan useCallback agar tidak re-render berkali-kali.
   */
  const onFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  }, []);

  /**
   * Transformasi data toko menjadi format Properti[]
   * untuk kebutuhan komponen map.
   *
   * useMemo mencegah mapping ulang jika tokoData tidak berubah.
   */
  const mapData: Properti[] = useMemo(() => {
    if (!tokoData) return [];

    return tokoData.map((item) => ({
      id: item.id,
      nama: item.nama_toko,
      alamat: item.alamat,
      latitude: item.latitude,
      longitude: item.longitude,
      type: "kplt" as const,
    }));
  }, [tokoData]);

  /**
   * Props yang diberikan ke layout.
   * Dikumpulkan dalam satu object agar lebih rapi dan mudah dibaca.
   */
  const layoutProps = {
    isLoading: isInitialLoading,
    isRefreshing,
    isError,
    tokoData,
    mapData,
    meta,
    searchQuery,
    filterMonth,
    filterYear,
    currentPage,
    totalPages: meta?.totalPages ?? 0,
    onSearch: onSearchChange,
    onPageChange: setCurrentPage,
    onFilterChange,
  };

  /**
   * Render layout halaman.
   */
  return <TokoExistingLayout {...layoutProps} />;
}
