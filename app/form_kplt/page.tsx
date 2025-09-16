// app/kplt/page.tsx
"use client";

import SWRProvider from "@/app/swr-provider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps } from "@/types/common";
import DesktopKPLTLayout from "@/components/desktop/kplt-layout";
import MobileKPLTLayout from "@/components/mobile/kplt-layout";

function useKPLT() {
  return {
    kplt: [],
    isLoading: false,
    isError: false,
  };
}

export default function KPLTPageWrapper() {
  return (
    <SWRProvider>
      <KPLTPage />
    </SWRProvider>
  );
}

export function KPLTPage() {
  const { isMobile, isDeviceLoading } = useDeviceType();
  const { user, loadingUser, userError } = useUser();

  const { kplt, isLoading: loadingKPLT, isError: kpltError } = useKPLT();

  const isPageLoading = loadingUser || loadingKPLT;
  const isPageError = !!userError || !!kpltError;

  const kpltProps: DashboardPageProps = {
    propertiData: kplt || [],
    user,
    isLoading: isPageLoading,
    isError: isPageError,
  };

  if (isDeviceLoading) {
    // Anda bisa mengganti ini dengan komponen Skeleton/Loader yang lebih baik
    return <div className="min-h-screen bg-gray-50" />;
  }
  if (isMobile) {
    return <MobileKPLTLayout {...kpltProps} />;
  }

  return <DesktopKPLTLayout {...kpltProps} />;
}
