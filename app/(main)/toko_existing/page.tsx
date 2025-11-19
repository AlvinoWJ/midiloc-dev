// app/(main)/toko_existing/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useTokoExisting } from "@/hooks/toko_existing/useTokoExisting";
import TokoExistingLayout from "@/components/layout/toko_existing_layout";

export default function TokoExistingPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterRegional, setFilterRegional] = useState("");
  const itemsPerPage = 9;

  // MOCK USER ROLE:
  // Gunakan 'Staff' untuk menyembunyikan filter Regional
  // Gunakan 'Region Manager' atau 'General Manager' untuk menampilkan filter Regional
  const mockUserRole: "Staff" | "Region Manager" | "General Manager" =
    "Region Manager";

  const { tokoData, meta, isLoading, isError } = useTokoExisting({
    page,
    limit: itemsPerPage,
    search: searchQuery,
    year: filterYear,
    regional: filterRegional,
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

  // Filter change handler for Year and Regional
  const handleFilterChange = useCallback((year: string, regional: string) => {
    setFilterYear(year);
    setFilterRegional(regional);
    setPage(1);
  }, []);

  const layoutProps = {
    isLoading,
    isError,
    tokoData,
    meta,
    onPageChange: handlePageChange,
    searchQuery,
    filterYear,
    filterRegional,
    onSearch: handleSearch,
    onFilterChange: handleFilterChange,
    userRole: mockUserRole, // Pass the mocked user role
  };

  return <TokoExistingLayout {...layoutProps} />;
}
