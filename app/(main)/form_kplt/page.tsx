// app/(main)/form_kplt/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useKplt } from "@/hooks/kplt/useKplt";
import { KpltPageProps, UnifiedKpltItem } from "@/types/common";
import KpltLayout from "@/components/layout/kplt_layout";

export default function KPLTPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const history_per_page = 9; // Tentukan limit per halaman

  const { user, loadingUser, userError } = useUser();

  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  const {
    kpltExisting,
    ulokForKplt,
    meta,
    isLoading: loadingKPLT,
    isError: kpltError,
    showSkeleton,
    isRefreshing,
  } = useKplt({
    searchQuery,
    activeTab,
    page: currentPage,
    limit: history_per_page,
    month: filterMonth,
    year: filterYear,
  });

  const isPageLoading = loadingUser || loadingKPLT;
  const isPageError = !!userError || !!kpltError;

  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1); // Reset ke halaman 1 saat filter
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  console.log("Data Mentah dari Hook:", { kpltExisting, ulokForKplt });

  const filteredData = useMemo(() => {
    // Transformasi data tetap diperlukan
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

    // Filter client-side hanya untuk role dan status tab
    return combinedData.filter((item) => {
      const lowerCaseStatus = item.status.trim().toLowerCase();

      // Filter Role (Logika Asli)
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

      return matchRole && matchTab;
    });
  }, [kpltExisting, ulokForKplt, activeTab, user]);

  const totalPages = useMemo(() => {
    if (activeTab !== "History") {
      return 1;
    }

    return meta?.total_pages ?? 1;
  }, [meta, activeTab]);

  const displayData = useMemo(() => {
    if (activeTab !== "History") {
      return filteredData;
    }
    return filteredData;
  }, [filteredData, activeTab]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0) {
      setCurrentPage(newPage);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset ke halaman 1
  };

  const kpltProps: KpltPageProps = {
    user,
    isLoading: showSkeleton,
    isRefreshing: isRefreshing,
    isError: isPageError,
    displayData,
    searchQuery,
    filterMonth,
    filterYear,
    activeTab,
    onSearch: onSearchChange,
    onFilterChange,
    onTabChange: handleTabChange,
    isLocationSpecialist,
    currentPage: meta?.page ?? currentPage,
    totalPages: totalPages,
    onPageChange: handlePageChange,
  };

  return <KpltLayout {...kpltProps} />;
}
