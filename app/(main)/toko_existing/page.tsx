// app/(main)/toko_existing/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useTokoExisting } from "@/hooks/toko_existing/useTokoExisting";
import TokoExistingLayout from "@/components/layout/toko_existing_layout";

export default function TokoExistingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const { tokoData, meta, isLoading, isError } = useTokoExisting({
    page: currentPage,
    search: searchQuery,
    month: filterMonth,
    year: filterYear,
  });

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const onFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  }, []);

  const layoutProps = {
    isLoading,
    isError,
    tokoData,
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

  return <TokoExistingLayout {...layoutProps} />;
}
