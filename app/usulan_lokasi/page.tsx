"use client";

import { useState, useCallback } from "react";
import SWRProvider from "@/app/swr-provider";
import { useUser } from "@/hooks/useUser";
import { useUlok } from "@/hooks/useUlok";
import { useDeviceType } from "@/hooks/useDeviceType";
import DesktopLayout from "@/components/desktop/ulok-layout";
import MobileLayout from "@/components/mobile/ulok-layout";

export default function UlokPageWrapper() {
  // Jika nanti SWRProvider sudah ada di layout global, cukup return <UlokPage />
  return (
    <SWRProvider>
      <UlokPage />
    </SWRProvider>
  );
}

export function UlokPage() {
  // --- KUMPULKAN SEMUA LOGIKA DI SINI ---

  // 1. State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [activeTab, setActiveTab] = useState("Recent");

  // 2. Data Fetching (SWR Hooks Anda tetap sama)
  const { user } = useUser();
  const { ulokData, ulokLoading, ulokError } = useUlok();

  // 3. Device Detection
  const { isMobile, isDeviceLoading } = useDeviceType(); // Ganti dengan isMobile || isTablet jika perlu

  // 4. Business Logic & Data Filtering
  const isLocationSpecialist = useCallback(() => {
    return user?.position_nama?.trim().toLowerCase() === "location specialist";
  }, [user]);

  // Pastikan ulokData tidak undefined sebelum memfilter
  const filteredUlok = (ulokData || [])
    .filter((ulok) => {
      const matchSearch =
        ulok.nama_ulok.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ulok.alamat.toLowerCase().includes(searchQuery.toLowerCase());
      const date = new Date(ulok.created_at);
      const ulokMonth = (date.getMonth() + 1).toString().padStart(2, "0");
      const ulokYear = date.getFullYear().toString();
      const matchMonth = filterMonth ? ulokMonth === filterMonth : true;
      const matchYear = filterYear ? ulokYear === filterYear : true;
      return matchSearch && matchMonth && matchYear;
    })
    .filter((ulok) => {
      if (activeTab === "Recent") {
        return ulok.approval_status === "In Progress";
      }
      if (activeTab === "History") {
        return ulok.approval_status === "OK" || ulok.approval_status === "NOK";
      }
      return true;
    });

  const onFilterChange = useCallback((month: string, year: string) => {
    setFilterMonth(month);
    setFilterYear(year);
  }, []);

  const layoutProps = {
    user,
    isLoading: ulokLoading,
    isError: !!ulokError,
    filteredUlok,
    activeTab,
    searchQuery,
    filterMonth,
    filterYear,
    isLocationSpecialist,
    onTabChange: setActiveTab,
    onSearch: setSearchQuery,
    onFilterChange,
  };

  if (isDeviceLoading) {
    // Anda bisa mengganti ini dengan komponen Skeleton/Loader yang lebih baik
    return <div className="min-h-screen bg-gray-50" />;
  }

  // --- RENDER LAYOUT BERDASARKAN UKURAN LAYAR ---
  if (isMobile) {
    return <MobileLayout {...layoutProps} />;
  }

  return <DesktopLayout {...layoutProps} />;
}
