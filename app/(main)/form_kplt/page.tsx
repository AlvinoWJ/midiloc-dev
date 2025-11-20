// app/(main)/form_kplt/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import {
  useKplt,
  KpltPageProps,
  UnifiedKpltItem,
  KpltItem,
} from "@/hooks/kplt/useKplt";
import KpltLayout from "@/components/layout/kplt_layout";

type StatusKey = "needinput" | "inprogress" | "ok" | "nok";

export default function KPLTPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");

  const [currentPage, setCurrentPage] = useState(1);
  const history_per_page = 9;

  const { user, loadingUser, userError } = useUser();

  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  const {
    needinput,
    inprogress,
    ok,
    nok,
    pagination,
    isLoading: loadingKPLT,
    isError: kpltError,
    showSkeleton,
    isRefreshing,
  } = useKplt({
    scope: activeTab === "Recent" ? "recent" : "history",
    search: searchQuery,
    month: filterMonth,
    year: filterYear,
    limit: history_per_page,
  });

  const isPageLoading = loadingUser || loadingKPLT;
  const isPageError = !!userError || !!kpltError;

  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
    setCurrentPage(1);
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    const allRawData: (KpltItem & { statusKey: StatusKey })[] = [
      ...needinput.map((item) => ({
        ...item,
        statusKey: "needinput" as StatusKey,
      })),
      ...inprogress.map((item) => ({
        ...item,
        statusKey: "inprogress" as StatusKey,
      })),
      ...ok.map((item) => ({ ...item, statusKey: "ok" as StatusKey })),
      ...nok.map((item) => ({ ...item, statusKey: "nok" as StatusKey })),
    ];

    // Transformasi data
    const combinedData: UnifiedKpltItem[] = allRawData.map((item) => {
      let status: string;
      let nama: string;

      if (item.statusKey === "needinput") {
        status = "Need Input";
        nama = item.nama_ulok || "Unknown ULOK";
      } else {
        status = item.kplt_approval || item.statusKey;
        nama = item.nama_kplt || "Unknown KPLT";
      }

      return {
        id: item.id || item.ulok_id || "",
        nama: nama,
        alamat: item.alamat,
        created_at: item.created_at,
        status: status,
        has_file_intip: false,
        has_form_ukur: false,
      };
    });

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

      let matchTab = false;
      if (activeTab === "recent") {
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
  }, [needinput, inprogress, ok, nok, activeTab, user]);

  const totalPages = useMemo(() => {
    return 1;
  }, [activeTab]);

  const displayData = useMemo(() => {
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
    isRefreshing: isRefreshing ?? false,
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
    currentPage: currentPage,
    totalPages: totalPages,
    onPageChange: handlePageChange,
  };

  return <KpltLayout {...kpltProps} />;
}
