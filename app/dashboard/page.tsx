// app/dashboard/page.tsx
"use client";

import SWRProvider from "@/app/swr-provider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useUser } from "@/hooks/useUser";
import { useProperti } from "@/hooks/useProperty"; // <-- 1. IMPORT hook baru
import { DashboardPageProps } from "@/types/common";
import DesktopDashboardLayout from "@/components/desktop/dashboard-layout";
import MobileDashboardLayout from "@/components/mobile/dashboard-layout";

export default function DashboardPageWrapper() {
  return (
    <SWRProvider>
      <DashboardPage />
    </SWRProvider>
  );
}

export function DashboardPage() {
  const { isMobile } = useDeviceType();
  const { user, loadingUser, userError } = useUser();

  // 2. GUNAKAN hook baru untuk mengambil data properti
  const {
    properti,
    isLoading: loadingProperti,
    isError: propertiError,
  } = useProperti();

  // 3. Gabungkan state loading dan error dari kedua hook
  const isPageLoading = loadingUser || loadingProperti;
  const isPageError = !!userError || !!propertiError;

  // 4. Siapkan props untuk dikirim ke komponen layout
  const dashboardProps: DashboardPageProps = {
    // Gunakan data dari hook, berikan array kosong sebagai fallback
    propertiData: properti || [],
    user,
    isLoading: isPageLoading,
    isError: isPageError,
  };

  if (isMobile) {
    return <MobileDashboardLayout {...dashboardProps} />;
  }

  return <DesktopDashboardLayout {...dashboardProps} />;
}
