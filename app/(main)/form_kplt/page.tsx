// app/kplt/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useKplt } from "@/hooks/useKplt";
import { KpltPageProps, UnifiedKpltItem } from "@/types/common";
import DesktopKPLTLayout from "@/components/desktop/kplt-layout";

export default function KPLTPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");

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
  } = useKplt();

  const isPageLoading = loadingUser || loadingKPLT;
  const isPageError = !!userError || !!kpltError;

  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
  };

  const displayData = useMemo(() => {
    // 1. Transformasi dan gabungkan data seperti sebelumnya
    const existingTransformed: UnifiedKpltItem[] = (kpltExisting || []).map(
      (item) => ({
        id: item.id,
        nama: item.nama_kplt,
        alamat: item.alamat,
        created_at: item.created_at,
        status: item.kplt_approval,
      })
    );
    const ulokTransformed: UnifiedKpltItem[] = (ulokForKplt || []).map(
      (item) => ({
        id: item.ulok_id,
        nama: item.nama_ulok,
        alamat: item.alamat,
        created_at: item.created_at,
        status: item.ui_status,
      })
    );
    const combinedData = [...existingTransformed, ...ulokTransformed];

    // 🔥 Ambil role pengguna saat ini dan normalkan (lowercase)
    const userRole = user?.position_nama?.trim().toLowerCase() || "";

    return combinedData.filter((item) => {
      const lowerCaseStatus = item.status.toLowerCase();

      // 🔥 LOGIKA BARU: FILTER BERDASARKAN ROLE PENGGUNA
      let matchRole = true; // Defaultnya true, item akan ditampilkan
      switch (lowerCaseStatus) {
        case "need input":
          const allowedForNeedInput = [
            "location specialist",
            "location manager",
          ];
          matchRole = allowedForNeedInput.includes(userRole);
          break;

        case "in progress":
        case "waiting for forum":
          const allowedForProgress = [
            "location specialist",
            "location manager",
            "branch manager",
            "regional manager",
          ];
          matchRole = allowedForProgress.includes(userRole);
          break;

        // Untuk status lain (seperti 'ok', 'NOK'), matchRole tetap true
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
        const historyStatuses = ["ok", "nok"]; // Pastikan 'nok' juga lowercase
        matchTab = historyStatuses.includes(lowerCaseStatus);
      }

      // LOGIKA FILTER PENCARIAN
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      // LOGIKA FILTER BULAN & TAHUN
      const itemDate = new Date(item.created_at);
      const matchMonth = filterMonth
        ? (itemDate.getMonth() + 1).toString() === filterMonth
        : true;
      const matchYear = filterYear
        ? itemDate.getFullYear().toString() === filterYear
        : true;

      // 🔥 Item akan ditampilkan jika cocok dengan SEMUA filter, termasuk filter role
      return matchRole && matchTab && matchSearch && matchMonth && matchYear;
    });
  }, [
    kpltExisting,
    ulokForKplt,
    searchQuery,
    filterMonth,
    filterYear,
    activeTab,
    user,
  ]);

  const kpltProps: KpltPageProps = {
    user,
    isLoading: isPageLoading,
    isError: isPageError,
    displayData,
    searchQuery,
    filterMonth,
    filterYear,
    activeTab,
    onSearch: setSearchQuery,
    onFilterChange,
    onTabChange: setActiveTab,
    isLocationSpecialist,
  };

  return <DesktopKPLTLayout {...kpltProps} />;
}
