// app/kplt/page.tsx
"use client";

import { useState, useCallback } from "react";
import SWRProvider from "@/app/swr-provider";
import { useDevice } from "@/app/context/DeviceContext";
import { useUser } from "@/hooks/useUser";
import { useKplt } from "@/hooks/useKplt";
import { KpltPageProps } from "@/types/common";
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

  // Filtering langsung dari kpltExisting
  const filteredKplt = (kpltExisting || []).filter((item) => {
    const matchSearch =
      item.nama_kplt?.toLowerCase().includes(searchQuery.toLowerCase()) || // pakai nama_kplt
      item.alamat?.toLowerCase().includes(searchQuery.toLowerCase()) || // atau alamat
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSearch;
  });

  const kpltProps: KpltPageProps = {
    user,
    isLoading: isPageLoading,
    isError: isPageError,
    kpltExisting: kpltExisting || [],
    ulokForKplt: ulokForKplt || [],
    meta,
    filteredKplt, // 🔥 tambahkan ini supaya sesuai type

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
