// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps } from "@/types/common";
import DesktopDashboardLayout from "@/components/desktop/dashboard-layout";
import { useDashboard } from "@/hooks/useDashboard";

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
  });

  const dashboardProps: DashboardPageProps = {
    propertiData: dashboardData,
    user,
    isLoading,
    isError,
    setYear,
    selectedSpecialistId,
    onSpecialistChange: setSelectedSpecialistId, // handler dropdown specialist
  };

  return <DesktopDashboardLayout {...dashboardProps} />;
}
