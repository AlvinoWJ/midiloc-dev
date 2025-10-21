"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useDashboard } from "@/hooks/useDashboard";
import { useMap } from "@/hooks/useMap";
import { useUlok } from "@/hooks/useUlok";
import { DashboardPageProps } from "@/types/common";
import DashboardLayout from "@/components/dashboard_layout";

export default function DashboardPage() {
  const { user } = useUser();

  const [year, setYear] = useState<number | null>(new Date().getFullYear());
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    string | null
  >(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [activeMapFilter, setActiveMapFilter] = useState<"ulok" | "kplt">(
    "ulok"
  );

  const {
    dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useDashboard({
    year,
    specialistId:
      selectedSpecialistId === "semua" ? null : selectedSpecialistId,
    branchId: selectedBranchId === "semua" ? null : selectedBranchId,
  });

  const specialistFilter = selectedSpecialistId || "semua";
  const { ulokUntukPeta, kpltUntukPeta, isMapLoading, mapError } =
    useMap(selectedSpecialistId);
  const { ulokData } = useUlok();

  // --- TAMBAHKAN CONSOLE.LOG DI SINI UNTUK MELACAK DATA ---
  console.log("1. Data KPLT mentah dari useMap:", kpltUntukPeta);
  console.log("2. Data ULOK (kamus) dari useUlok:", ulokData);

  // Membuat kamus nama dari data ULOK agar pencarian lebih efisien
  const ulokNameMap = useMemo(() => {
    if (!ulokData) return new Map<string, string>();
    const map = new Map<string, string>();
    ulokData.forEach((ulok) => {
      if (ulok.id && ulok.nama_ulok) {
        map.set(ulok.id, ulok.nama_ulok);
      }
    });
    return map;
  }, [ulokData]);

  const kpltDenganNama = useMemo(() => {
    if (!Array.isArray(kpltUntukPeta)) return [];

    // 1. Simpan hasil .map() ke dalam variabel 'result'
    const result = kpltUntukPeta.map((kplt) => {
      const ulokId = "ulok_id" in kplt ? kplt.ulok_id : undefined;
      return {
        ...kplt,
        nama: ulokNameMap.get(ulokId || "") || "KPLT Tanpa Nama",
      };
    });

    console.log("4. Data KPLT setelah digabung dengan nama:", result);
    return result;
  }, [kpltUntukPeta, ulokNameMap]);

  // Logika di bawah ini tidak berubah
  const propertiUntukPeta =
    activeMapFilter === "ulok" ? ulokUntukPeta : kpltDenganNama;

  const isPageLoading = isDashboardLoading || isMapLoading;
  const isPageError = isDashboardError || !!mapError;

  const dashboardProps: DashboardPageProps = {
    propertiData: dashboardData,
    propertiUntukPeta: propertiUntukPeta,
    user,
    isLoading: isPageLoading,
    isMapLoading: isMapLoading, // Anda bisa menyederhanakan ini jika tidak perlu state loading peta terpisah
    isError: isPageError,
    setYear,
    selectedSpecialistId,
    onSpecialistChange: setSelectedSpecialistId,
    selectedBranchId,
    onBranchChange: setSelectedBranchId,
    activeMapFilter,
    onMapFilterChange: setActiveMapFilter,
  };

  return <DashboardLayout {...dashboardProps} />;
}
