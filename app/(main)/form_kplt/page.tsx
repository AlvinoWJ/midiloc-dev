// app/kplt/page.tsx
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useKplt } from "@/hooks/useKplt";
import { KpltPageProps, UnifiedKpltItem } from "@/types/common";
import KpltLayout from "@/components/layout/kplt_layout";

export default function KPLTPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const history_per_page = 9;

  const { user, loadingUser, userError } = useUser();

  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  const {
    kpltExisting,
    ulokForKplt,
    isLoading: loadingKPLT,
    isError: kpltError,
    showSkeleton,
  } = useKplt(searchQuery, activeTab);

  const isPageLoading = loadingUser || loadingKPLT;
  const isPageError = !!userError || !!kpltError;

  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
  };
  console.log("Data Mentah dari Hook:", { kpltExisting, ulokForKplt });

  const filteredData = useMemo(() => {
    const existingTransformed: UnifiedKpltItem[] = (kpltExisting || []).map(
      (item) => ({
        id: item.id,
        nama: item.nama_kplt,
        alamat: item.alamat,
        created_at: item.created_at,
        status: item.kplt_approval,
        has_file_intip: item.has_file_intip || false,
        has_form_ukur: item.has_form_ukur || false,
      })
    );
    const ulokTransformed: UnifiedKpltItem[] = (ulokForKplt || []).map(
      (item) => ({
        id: item.ulok_id,
        nama: item.nama_ulok,
        alamat: item.alamat,
        created_at: item.created_at,
        status: item.ui_status,
        has_file_intip: item.has_file_intip || false,
        has_form_ukur: item.has_form_ukur || false,
      })
    );
    const combinedData = [...existingTransformed, ...ulokTransformed];
    const userRole = user?.position_nama?.trim().toLowerCase() || "";

    return combinedData.filter((item) => {
      const lowerCaseStatus = item.status.trim().toLowerCase();

      let matchRole = true;
      switch (lowerCaseStatus) {
        case "need input":
          const allowedForNeedInput = ["location specialist"];
          matchRole = allowedForNeedInput.includes(userRole);
          break;
        case "in progress":
          const allowedForInProgress = [
            "location specialist",
            "location manager",
            "branch manager",
            "regional manager",
          ];
          matchRole = allowedForInProgress.includes(userRole);
          break;
        case "waiting for forum":
          const allowedForProgress = [
            "branch manager",
            "regional manager",
            "general manager",
          ];
          matchRole = allowedForProgress.includes(userRole);
          break;
        default:
          break;
      }

      // LOGIKA FILTER TAB (RECENT & HISTORY)
      let matchTab = false;
      if (activeTab === "Recent") {
        const recentStatuses = [
          "need input",
          "in progress",
          "waiting for forum",
        ];
        matchTab = recentStatuses.includes(lowerCaseStatus);
      } else if (activeTab === "History") {
        const historyStatuses = ["ok", "nok"];
        matchTab = historyStatuses.includes(lowerCaseStatus);
      }

      const itemDate = new Date(item.created_at);

      const matchMonth = filterMonth
        ? (itemDate.getMonth() + 1).toString() === filterMonth
        : true;

      const matchYear = filterYear
        ? itemDate.getFullYear().toString() === filterYear
        : true;

      const matchSearch = searchQuery
        ? item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.alamat.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      return matchRole && matchTab && matchMonth && matchYear && matchSearch;
    });
  }, [kpltExisting, ulokForKplt, filterMonth, filterYear, activeTab, user]);

  const totalPages = useMemo(() => {
    if (activeTab !== "History") {
      return 1;
    }
    return Math.ceil(filteredData.length / history_per_page) || 1;
  }, [filteredData, activeTab]);

  const displayData = useMemo(() => {
    if (activeTab !== "History") {
      return filteredData; // Tampilkan semua data "Recent"
    }

    const startIndex = (currentPage - 1) * history_per_page;
    const endIndex = startIndex + history_per_page;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, activeTab, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Bungkus onTabChange agar me-reset halaman
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // setCurrentPage(1); // Sudah ditangani oleh useEffect [activeTab]
  };

  const kpltProps: KpltPageProps = {
    user,
    isLoading: showSkeleton,
    isError: isPageError,
    displayData,
    searchQuery,
    filterMonth,
    filterYear,
    activeTab,
    onSearch: setSearchQuery,
    onFilterChange,
    onTabChange: handleTabChange,
    isLocationSpecialist,
    currentPage: currentPage,
    totalPages: totalPages,
    onPageChange: handlePageChange,
  };

  return <KpltLayout {...kpltProps} />;
}
