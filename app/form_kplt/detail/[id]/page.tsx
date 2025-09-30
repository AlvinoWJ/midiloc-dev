// app/kplt/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import SWRProvider from "@/app/swr-provider";
import DetailKpltLayout from "@/components/desktop/detail-kplt-layout";
import { useKpltDetail } from "@/hooks/useKpltDetail";

// Komponen Wrapper SWR (tidak perlu diubah)
export default function DetailKpltPageWrapper() {
  return (
    <SWRProvider>
      <DetailKpltPage />
    </SWRProvider>
  );
}

// Komponen helper status (tidak perlu diubah)
const PageStatus = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-xl text-gray-600">{message}</p>
  </div>
);

// --- PERUBAHAN 2: Hapus fungsi fetcher dari sini ---

function DetailKpltPage() {
  const params = useParams<{ id: string }>();
  const kpltId = params?.id;

  // --- PERUBAHAN 3: Ganti useSWR dengan useKpltDetail ---
  const {
    data, // 'data' ini sudah bersih dan di-mapping
    isLoading,
    isError,
    error,
  } = useKpltDetail(kpltId);

  // Handle state loading dan error (logika tetap sama)
  if (isLoading) return <PageStatus message="Memuat detail KPLT..." />;
  if (isError)
    return <PageStatus message={`Gagal memuat data: ${error.message}`} />;
  if (!data) return <PageStatus message="Data KPLT tidak ditemukan." />;

  // --- PERUBAHAN 4: Kirim 'data' yang sudah bersih ke layout ---
  return <DetailKpltLayout data={data} />;
}
