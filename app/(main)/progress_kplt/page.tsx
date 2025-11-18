// app/(main)/progress_kplt/page.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useProgress } from "@/hooks/progress_kplt/useProgress";
import ProgressKpltLayout from "@/components/layout/progress_kplt_layout";

export default function ProgressKpltPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const itemsPerPage = 9;

  const { progressData, meta, isLoading, isError } = useProgress({
    page,
    limit: itemsPerPage,
    search: searchQuery,
    month: filterMonth,
    year: filterYear,
  });

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!meta || newPage <= meta.totalPages)) {
      setPage(newPage);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setPage(1);
  }, []);

  const layoutProps = {
    isLoading,
    isError,
    progressData,
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
