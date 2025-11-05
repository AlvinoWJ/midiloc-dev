"use client";

import React from "react";
import DetailProgressKpltLayout from "@/components/layout/detail_progress_kplt_layout";
import type { ProgressKpltInfo } from "@/components/layout/detail_progress_kplt_layout";

export default function DetailProgressKpltPage({
  params,
}: {
  params: { id: string };
}) {
  const isLoading = false;
  const isError = false;

  const kpltData: ProgressKpltInfo = {
    id: params.id,
    nama_kplt: "KPLT " + params.id,
    alamat: "Alamat belum diatur",
    provinsi: "-",
    kabupaten: "-",
    kecamatan: "-",
    desa_kelurahan: "-",
    latitude: "0",
    longitude: "0",
    created_at: new Date().toISOString(),
  };

  // Struktur progressData sesuai tipe LayoutProps
  const progressData = {
    id: params.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "In Progress",
    kplt: kpltData,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Memuat data progress...</p>
      </div>
    );
  }

  if (isError || !progressData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Gagal memuat data progress.</p>
      </div>
    );
  }

  // Tidak perlu kirim stepsData lagi
  return <DetailProgressKpltLayout progressData={progressData} />;
}
