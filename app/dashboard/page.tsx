// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import SWRProvider from "@/app/swr-provider";
import { useDevice } from "@/app/context/DeviceContext";
import { useUser } from "@/hooks/useUser";
// import { useProperti } from "@/hooks/useProperty"; // <-- 1. IMPORT hook baru
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

  // Panggil hook useDashboard dengan state filter
  const { dashboardData, isLoading, isError } = useDashboard({ year });

  // 4. Siapkan props untuk dikirim ke komponen layout
  const dashboardProps: DashboardPageProps = {
    propertiData: dashboardData, // <-- Kirim data dari useDashboard
    user,
    isLoading, // <-- Kirim status loading dari useDashboard
    isError, // <-- Kirim status error dari useDashboard
    setYear, // <-- Kirim fungsi untuk mengubah tahun
  };

  if (isMobile) {
    return <MobileDashboardLayout {...dashboardProps} />;
  }

  return <DesktopDashboardLayout {...dashboardProps} />;
}
