// app/kplt/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react"; // Tambahkan useMemo
import SWRProvider from "@/app/swr-provider";
import { useDevice } from "@/app/context/DeviceContext";
import { useUser } from "@/hooks/useUser";
import { useKplt } from "@/hooks/useKplt";
import { KpltPageProps, UnifiedKpltItem } from "@/types/common"; // Import tipe baru
import DesktopKPLTLayout from "@/components/desktop/kplt-layout";
import MobileKPLTLayout from "@/components/mobile/kplt-layout";

export default function KPLTPageWrapper() {
  return (
    <SWRProvider>
      <KPLTPage />
    </SWRProvider>
  );
}

export function KPLTPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");

  const { isMobile } = useDevice();
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

  // Handler filter
  const onFilterChange = (month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
  };

  // 🔥 UTAMA: Gabungkan, transformasikan, dan filter data di sini
  const displayData = useMemo(() => {
    // 1. Transformasi `kplt_existing`
    const existingTransformed: UnifiedKpltItem[] = (kpltExisting || []).map(
      (item) => ({
        id: item.id,
        nama: item.nama_kplt,
        alamat: item.alamat,
        created_at: item.created_at,
        status: item.kplt_approval,
      })
    );

    // 2. Transformasi `kplt_from_ulok_ok`
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

    // Lakukan SEMUA filtering pada data yang sudah digabung
    return combinedData.filter((item) => {
      // 🔥 LOGIKA FILTER TAB (RECENT & HISTORY)
      const lowerCaseStatus = item.status.toLowerCase();
      let matchTab = false; // Default ke false
      if (activeTab === "Recent") {
        const recentStatuses = ["need input", "inprogress"];
        matchTab = recentStatuses.includes(lowerCaseStatus);
      } else if (activeTab === "History") {
        const historyStatuses = ["ok", "NOK"];
        matchTab = historyStatuses.includes(lowerCaseStatus);
      }

      // LOGIKA FILTER PENCARIAN
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      // 🔥 LOGIKA FILTER BULAN & TAHUN
      const itemDate = new Date(item.created_at);
      // Cek apakah filter bulan aktif, jika ya, bandingkan bulannya
      const matchMonth = filterMonth
        ? (itemDate.getMonth() + 1).toString() === filterMonth
        : true;
      // Cek apakah filter tahun aktif, jika ya, bandingkan tahunnya
      const matchYear = filterYear
        ? itemDate.getFullYear().toString() === filterYear
        : true;

      // Item akan ditampilkan jika cocok dengan SEMUA filter yang aktif
      return matchTab && matchSearch && matchMonth && matchYear;
    });
  }, [
    kpltExisting,
    ulokForKplt,
    searchQuery,
    filterMonth,
    filterYear,
    activeTab,
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

  if (isMobile) {
    return <MobileKPLTLayout {...kpltProps} />;
  }

  return <DesktopKPLTLayout {...kpltProps} />;
}
