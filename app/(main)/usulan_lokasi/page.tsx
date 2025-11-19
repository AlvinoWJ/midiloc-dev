"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useUlok } from "@/hooks/ulok/useUlok";
import UlokLayout from "@/components/layout/ulok_layout";

const ITEMS_PER_PAGE = 9;

export default function UlokPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useUser();

  const { ulokData, meta, isInitialLoading, isRefreshing, ulokError } = useUlok(
    {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchQuery,
      month: filterMonth,
      year: filterYear,
      activeTab: activeTab,
    }
  );

  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  const onFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  }, []);

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Kita asumsikan meta?.totalPages sekarang berisi total halaman UI di dalam blok yang diambil
  const totalPagesInBlock = meta?.totalPages ?? 0;
  // Kita ambil properti hasNextPage baru dari hook
  const hasNextPage = meta?.hasNextPage ?? false;
  const layoutProps = {
    user,
    isLoading: isInitialLoading,
    isRefreshing: isRefreshing,
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

  return <UlokLayout {...layoutProps} />;
}
