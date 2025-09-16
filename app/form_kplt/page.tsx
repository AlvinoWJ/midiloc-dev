// app/kplt/page.tsx
"use client";

import SWRProvider from "@/app/swr-provider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps } from "@/types/common";
import DesktopKPLTLayout from "@/components/desktop/kplt-layout";
import MobileKPLTLayout from "@/components/mobile/kplt-layout";

// Hook untuk mengambil data KPLT (sesuaikan dengan kebutuhan Anda)
function useKPLT() {
  // Implementasikan hook ini sesuai dengan kebutuhan API KPLT Anda
  // Contoh:
  // const { data: kpltData, error, isLoading } = useSWR('/api/kplt', fetcher);

  // Sementara return dummy data
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
  const { isMobile } = useDeviceType();
  const { user, loadingUser, userError } = useUser();

  // Gunakan hook untuk mengambil data KPLT
  const { kplt, isLoading: loadingKPLT, isError: kpltError } = useKPLT();

  // Gabungkan state loading dan error dari kedua hook
  const isPageLoading = loadingUser || loadingKPLT;
  const isPageError = !!userError || !!kpltError;

  // Siapkan props untuk dikirim ke komponen layout
  const kpltProps: DashboardPageProps = {
    // Gunakan data KPLT, berikan array kosong sebagai fallback
    propertiData: kplt || [], // Atau sesuaikan dengan struktur data KPLT Anda
    user,
    isLoading: isPageLoading,
    isError: isPageError,
  };

  if (isMobile) {
    return <MobileKPLTLayout {...kpltProps} />;
  }

  return <DesktopKPLTLayout {...kpltProps} />;
}
