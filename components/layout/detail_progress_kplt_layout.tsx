// File: components/layout/detail_progress_kplt_layout.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TimelineProgressKplt, {
  type ProgressStep,
} from "@/components/ui/timeline";

// Tipe props untuk layout ini
interface LayoutProps {
  progressData: {
    id: string;
    created_at: string;
    updated_at: string;
    status: string;
    kplt: ProgressKpltInfo;
  };
  stepsData: ProgressStep[];
}

// Helper untuk format tanggal
const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function DetailProgressKpltLayout({
  progressData,
  stepsData,
}: LayoutProps) {
  const router = useRouter();
  const { kplt, updated_at, status } = progressData;

  return (
    <main className="space-y-4 lg:space-y-6">
      {/* Header: Tombol Kembali, Judul, dan Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="back"
          className="text-sm lg:text-base self-start"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </Button>
      </div>

      {/* Kartu Info KPLT */}
      <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-5">
          {kplt.nama_kplt}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div>
            <label className="text-gray-500 block mb-1">Provinsi</label>
            <p className="font-semibold text-gray-900">{kplt.provinsi}</p>
          </div>
          <div>
            <label className="text-gray-500 block mb-1">Kabupaten/Kota</label>
            <p className="font-semibold text-gray-900">{kplt.kabupaten}</p>
          </div>
          <div>
            <label className="text-gray-500 block mb-1">Kecamatan</label>
            <p className="font-semibold text-gray-900">{kplt.kecamatan}</p>
          </div>
          <div>
            <label className="text-gray-500 block mb-1">Kelurahan/Desa</label>
            <p className="font-semibold text-gray-900">{kplt.desa_kelurahan}</p>
          </div>
          <div className="lg:col-span-2">
            <label className="text-gray-500 block mb-1">Alamat</label>
            <p className="font-semibold text-gray-900">{kplt.alamat}</p>
          </div>
          <div>
            <label className="text-gray-500 block mb-1">LatLong</label>
            <p className="font-semibold text-gray-900">
              {kplt.latitude}, {kplt.longitude}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <TimelineProgressKplt steps={stepsData} />
      </div>
    </main>
  );
}

// Definisikan tipe datanya di sini agar file bisa berdiri sendiri
export interface ProgressKpltInfo {
  id: string;
  nama_kplt: string;
  alamat: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa_kelurahan: string;
  latitude: string;
  longitude: string;
  created_at: string;
}
