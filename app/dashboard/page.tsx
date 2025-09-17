// app/dashboard/page.tsx
"use client";

import SWRProvider from "@/app/swr-provider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useUser } from "@/hooks/useUser";
// import { useProperti } from "@/hooks/useProperty"; // <-- 1. IMPORT hook baru
import { DashboardPageProps } from "@/types/common";
import DesktopDashboardLayout from "@/components/desktop/dashboard-layout";
import MobileDashboardLayout from "@/components/mobile/dashboard-layout";
import { useUlok } from "@/hooks/useUlok";

export default function DashboardPageWrapper() {
  return (
    <SWRProvider>
      <DashboardPage />
    </SWRProvider>
  );
}

export function DashboardPage() {
  const { isMobile, isDeviceLoading } = useDeviceType();
  const { user } = useUser();

  // 2. GUNAKAN hook baru untuk mengambil data properti
  const { ulokData, ulokLoading, ulokError } = useUlok();

  // 4. Siapkan props untuk dikirim ke komponen layout
  const dashboardProps: DashboardPageProps = {
    // Gunakan data dari hook, berikan array kosong sebagai fallback
    propertiData: ulokData || [],
    user,
    isLoading: ulokLoading,
    isError: ulokError,
  };

  if (isDeviceLoading) {
    // Anda bisa mengganti ini dengan komponen Skeleton/Loader yang lebih baik
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (isMobile) {
    return <MobileDashboardLayout {...dashboardProps} />;
  }

  return <DesktopDashboardLayout {...dashboardProps} />;
}
