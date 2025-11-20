"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useUlokEksternal } from "@/hooks/ulok_eksternal/useUlokEksternal"; // Import hook baru
import UlokEksternalLayout from "@/components/layout/ulok_eksternal_layout"; // Import layout baru

const ITEMS_PER_PAGE = 9;

export default function UlokEksternalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useUser();
  // Gunakan hook dan variabel baru
  const {
    ulokEksternalData,
    isInitialLoading,
    isRefreshing,
    ulokEksternalError,
    meta,
  } = useUlokEksternal({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchQuery,
    month: filterMonth,
    year: filterYear,
    activeTab: activeTab,
  });

  const paginatedData = useMemo(() => {
    const allFilteredUlok = (ulokEksternalData || []).filter((ulok) => {
      if (activeTab === "Recent")
        return ulok.status_ulok_eksternal === "In Progress";
      if (activeTab === "History")
        return ["OK", "NOK"].includes(ulok.status_ulok_eksternal);

      return true;
    });

    const totalPages = Math.ceil(allFilteredUlok.length / ITEMS_PER_PAGE);
    const paginatedUlok = allFilteredUlok.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    return { paginatedUlok, totalPages };
  }, [ulokEksternalData, activeTab, currentPage]);

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

  const layoutProps = {
    user,
    isLoading: isInitialLoading,
    isRefreshing: isRefreshing,
    isError: !!ulokEksternalError,
    filteredUlok: paginatedData.paginatedUlok,
    activeTab,
    searchQuery,
    filterMonth,
    filterYear,
    onTabChange,
    onSearch: onSearchChange,
    onFilterChange,
    currentPage,
    totalPages: paginatedData.totalPages,
    onPageChange: setCurrentPage,
  };

  return <UlokEksternalLayout {...layoutProps} />;
}
