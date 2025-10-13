"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps } from "@/types/common";
import DesktopDashboardLayout from "@/components/desktop/dashboard-layout";
import { useDashboard } from "@/hooks/useDashboard";
import { useUlok } from "@/hooks/useUlok";

export default function DashboardPage() {
  const { user } = useUser();

  // state filter tahun
  const [year, setYear] = useState<number | null>(new Date().getFullYear());
  // state filter specialist (UI only)
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    string | null
  >(null);

  // Panggil hook useDashboard dengan filter tahun + ls_id
  const { dashboardData, isLoading, isError } = useDashboard({
    year,
    lsId: selectedSpecialistId ?? undefined,
    // branchId: selectedSpecialistId, // jangan: ini untuk cabang, bukan LS
  });

  //Kode tambahan untuk data peta (dipindahkan ke sini)
  const { ulokData, ulokLoading, ulokError } = useUlok();

  console.log("1. PAGE MENERIMA DARI SWR:", ulokData);

  const isPageLoading = isLoading || ulokLoading; // Gabungkan isLoading asli dengan isMapLoading
  const isPageError = isError || ulokError; // Gabungkan isError asli dengan mapError

  const dashboardProps: DashboardPageProps = {
    propertiData: dashboardData,
    propertiUntukPeta: ulokData,
    user,
    isLoading: isPageLoading,
    isError: isPageError,
    setYear,
    selectedSpecialistId,
    onSpecialistChange: setSelectedSpecialistId, // handler dropdown specialist
  };

  return <DesktopDashboardLayout {...dashboardProps} />;
}