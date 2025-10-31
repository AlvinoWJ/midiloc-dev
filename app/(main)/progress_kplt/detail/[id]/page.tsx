// File: app/(main)/progress_kplt/detail/[id]/page.tsx
"use client";

import React from "react";
import DetailProgressKpltLayout from "@/components/layout/detail_progress_kplt_layout";
import type { ProgressKpltInfo } from "@/components/layout/detail_progress_kplt_layout";
import type { ProgressStep } from "@/components/ui/timeline";

// --- DATA DUMMY (SESUAI DESAIN ANDA) ---
const dummyProgressData = {
  id: "progress-123",
  created_at: "2025-08-25T10:00:00Z",
  updated_at: "2025-08-25T14:30:00Z",
  status: "In Progress",
  kplt: {
    id: "kplt-abc",
    nama_kplt: "Dago Atas",
    alamat: "Jl. Alam Sutera Barat No. 10",
    provinsi: "Banten",
    kabupaten: "Kota Tangerang",
    kecamatan: "Pinang",
    desa_kelurahan: "Kutabumi",
    latitude: "-6.17806",
    longitude: "106.63",
    created_at: "2025-08-25T10:00:00Z",
  } as ProgressKpltInfo,
};

const dummyStepsData: ProgressStep[] = [
  {
    id: "step-1",
    progress_kplt_id: "progress-123",
    nama_tahap: "MOU",
    status: "Done",
    start_date: "2025-11-10T00:00:00Z",
    end_date: "2025-11-12T00:00:00Z",
    urutan: 1,
  },
  {
    id: "step-2",
    progress_kplt_id: "progress-123",
    nama_tahap: "Ijin Tetangga",
    status: "Done",
    start_date: "2025-11-13T00:00:00Z",
    end_date: "2025-11-15T00:00:00Z",
    urutan: 2,
  },
  {
    id: "step-3",
    progress_kplt_id: "progress-123",
    nama_tahap: "Perizinan",
    status: "Done",
    start_date: "2025-11-16T00:00:00Z",
    end_date: "2025-11-18T00:00:00Z",
    urutan: 3,
  },
  {
    id: "step-4",
    progress_kplt_id: "progress-123",
    nama_tahap: "Notaris",
    status: "Done",
    start_date: "2025-11-20T00:00:00Z",
    end_date: "2025-11-28T00:00:00Z",
    urutan: 4,
  },
  {
    id: "step-5",
    progress_kplt_id: "progress-123",
    nama_tahap: "Renovasi",
    status: "In Progress",
    start_date: "2025-11-20T00:00:00Z",
    end_date: "2025-11-28T00:00:00Z",
    urutan: 5,
  },
  {
    id: "step-6",
    progress_kplt_id: "progress-123",
    nama_tahap: "Building",
    status: "Pending",
    start_date: null,
    end_date: null,
    urutan: 6,
  },
  {
    id: "step-7",
    progress_kplt_id: "progress-123",
    nama_tahap: "Grand Opening",
    status: "Pending",
    start_date: null,
    end_date: null,
    urutan: 7,
  },
];
// --- AKHIR DATA DUMMY ---

export default function DetailProgressKpltPage() {
  // Kita tidak menggunakan hook SWR dulu, langsung gunakan data dummy
  const isLoading = false; // Set ke false
  const isError = false; // Set ke false
  const data = {
    progress: dummyProgressData,
    steps: dummyStepsData,
  };

  if (isLoading) {
    // Anda bisa tambahkan skeleton di sini jika mau
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data progress...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">
            Error Loading Data
          </h2>
          <p className="text-red-600">
            Gagal memuat detail progress. Silakan coba lagi nanti.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-yellow-800 font-semibold text-lg mb-2">
            Data Tidak Ditemukan
          </h2>
          <p className="text-yellow-700">
            Detail progress tidak ditemukan. Silakan kembali ke halaman
            sebelumnya.
          </p>
        </div>
      </div>
    );
  }

  // Kirim data dummy ke komponen layout
  return (
    <DetailProgressKpltLayout
      progressData={data.progress}
      stepsData={data.steps}
    />
  );
}
