// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import SWRProvider from "@/app/swr-provider";
import { useDevice } from "@/app/context/DeviceContext";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps } from "@/types/common";
import DesktopDashboardLayout from "@/components/desktop/dashboard-layout";
import MobileDashboardLayout from "@/components/mobile/dashboard-layout";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPageWrapper() {
  return (
    <SWRProvider>
      <DashboardPage />
    </SWRProvider>
  );
}

export function DashboardPage() {
  const { isMobile } = useDevice();
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

  // if (isMobile) {
  //   return <MobileDashboardLayout {...dashboardProps} />;
  // }

  return <DesktopDashboardLayout {...dashboardProps} />;
}
