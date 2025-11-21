// app/(main)/progress_kplt/page.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useProgress } from "@/hooks/progress_kplt/useProgress";
import ProgressKpltLayout from "@/components/layout/progress_kplt_layout";

export default function ProgressKpltPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const {
    progressData,
    totalPages,

    isInitialLoading,
    isRefreshing,
    isError,
  } = useProgress({
    page: currentPage,
    search: searchQuery,
    month: filterMonth,
    year: filterYear,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  }, []);

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

  return <ProgressKpltLayout {...layoutProps} />;
}
