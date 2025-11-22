"use client";

import { useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { useKplt } from "@/hooks/kplt/useKplt";
import KpltLayout from "@/components/layout/kplt_layout";

export default function KPLTPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");
  const [currentPage, setCurrentPage] = useState(1);

  const { user, loadingUser, userError } = useUser();

  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

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

  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const layoutProps = {
    user,
    isLoading: loadingUser || isInitialLoading,
    isRefreshing,
    isError: !!userError || !!kpltError,

    displayData: kpltData,

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

  return <KpltLayout {...layoutProps} />;
}
