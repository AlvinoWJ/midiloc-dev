// app/dashboard/page.tsx
"use client";

import SWRProvider from "@/app/swr-provider";
import { dummyPropertiData } from "@/lib/dummy-data";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps, Properti } from "@/types/common";
import DesktopDashboardLayout from "@/components/desktop/dashboard-layout";
import MobileDashboardLayout from "@/components/mobile/dashboard-layout";

export default function DashboardPageWrapper() {
  // Jika nanti SWRProvider sudah ada di layout global, cukup return <UlokPage />
  return (
    <SWRProvider>
      <DashboardPage />
    </SWRProvider>
  );
}

export function DashboardPage() {
  const { isMobile } = useDeviceType();
  const { user, loadingUser, userError } = useUser();

  const propertiData: Properti[] = dummyPropertiData;

  // 2. Siapkan props untuk dikirim ke komponen layout
  const dashboardProps: DashboardPageProps = {
    propertiData,
    user,
    isLoading: loadingUser,
    isError: !!userError,
  };

  if (isMobile) {
    return <MobileDashboardLayout {...dashboardProps} />;
  }

  return <DesktopDashboardLayout {...dashboardProps} />;
}
