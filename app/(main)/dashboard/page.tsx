// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps, Properti } from "@/types/common";
import DesktopDashboardLayout from "@/components/desktop/dashboard-layout";
import { useDashboard } from "@/hooks/useDashboard";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data);

export default function DashboardPage() {
  const { user } = useUser();

  // state filter tahun
  const [year, setYear] = useState<number | null>(new Date().getFullYear());
  // state filter specialist (UI only)
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    string | null
  >(null);

  // Panggil hook useDashboard dengan state filter tahun saja
  const { dashboardData, isLoading, isError } = useDashboard({
    year,
    // branchId: selectedSpecialistId,
  });

  //Kode tambahan untuk data peta (dipindahkan ke sini)
  const {
    data: propertiUntukPeta,
    error: mapError,
    isLoading: isMapLoading, // 👈 diganti namanya di sini
  } = useSWR<Properti[]>("/api/ulok", fetcher);

  console.log("1. PAGE MENERIMA DARI SWR:", propertiUntukPeta);

  const isPageLoading = isLoading || isMapLoading; // Gabungkan isLoading asli dengan isMapLoading
  const isPageError = isError || isMapLoading; // Gabungkan isError asli dengan mapError

  const dashboardProps: DashboardPageProps = {
    propertiData: dashboardData,
    propertiUntukPeta: propertiUntukPeta,
    user,
    isLoading: isPageLoading,
    isError: isPageError,
    setYear,
    selectedSpecialistId,
    onSpecialistChange: setSelectedSpecialistId, // handler dropdown specialist
  };

  return <DesktopDashboardLayout {...dashboardProps} />;
}
