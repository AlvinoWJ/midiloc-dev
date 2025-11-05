"use client";

import React, { use } from "react";
import DetailProgressKpltLayout from "@/components/layout/detail_progress_kplt_layout";
import type { ProgressKpltInfo } from "@/components/layout/detail_progress_kplt_layout";

export default function DetailProgressKpltPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params); // ✅ unwrapping Promise params
  const id = resolvedParams.id;

  const kpltData: ProgressKpltInfo = {
    id,
    nama_kplt: id,
    alamat: "Alamat belum diatur",
    provinsi: "-",
    kabupaten: "-",
    kecamatan: "-",
    desa_kelurahan: "-",
    latitude: "0",
    longitude: "0",
    created_at: new Date().toISOString(),
  };

  const progressData = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "In Progress",
    kplt: kpltData,
  };

  return <DetailProgressKpltLayout progressData={progressData} />;
}
