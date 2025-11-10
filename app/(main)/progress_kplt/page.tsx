// app/(main)/progress_kplt/page.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useProgress, ProgressItem } from "@/hooks/progress_kplt/useProgress";
import ProgressKpltLayout from "@/components/layout/progress_kplt_layout";

export default function ProgressKpltPage() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(9);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const { progressData, meta, isLoading, isError } = useProgress({
    page,
    perPage,
  });

  const filteredProgressData = useMemo(() => {
    return (progressData || []).filter((item: ProgressItem) => {
      const kpltName = item.kplt_id?.nama_kplt || "";
      const itemDate = new Date(item.created_at || "");

      // Cek Search Query
      const matchSearch = searchQuery
        ? kpltName.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      // Cek Filter Tahun
      const matchYear = filterYear
        ? itemDate.getFullYear().toString() === filterYear
        : true;

      // Cek Filter Bulan
      const matchMonth = filterMonth
        ? (itemDate.getMonth() + 1).toString().padStart(2, "0") === filterMonth
        : true;

      return matchSearch && matchYear && matchMonth;
    });
  }, [progressData, searchQuery, filterMonth, filterYear]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!meta || newPage <= meta.total_pages)) {
      setPage(newPage);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handler untuk Filter (hanya update state)
  const handleFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
  }, []);

  const layoutProps = {
    isLoading,
    isError,
    progressData: filteredProgressData, // <-- KIRIM DATA YANG SUDAH DIFILTER
    meta,
    onPageChange: handlePageChange,
    searchQuery,
    filterMonth,
    filterYear,
    onSearch: handleSearch,
    onFilterChange: handleFilterChange,
  };

  return <ProgressKpltLayout {...layoutProps} />;
}
