// components/desktop/detail-kplt-layout.tsx
"use client";

import React from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { MappedKpltDetail } from "@/hooks/useKpltDetail";
import PrefillKpltCard from "./prefillkpltcard";

// Props untuk komponen ini, hanya menerima 'data'
interface DetailKpltLayoutProps {
  data: MappedKpltDetail; // Tipe data sesuai respons API fn_kplt_detail
}

// Komponen kecil untuk menampilkan field key-value agar rapi
const DetailField = ({ label, value }: { label: string; value: any }) => (
  <div>
    <label className="text-gray-600 font-medium text-sm mb-1 block">
      {label}
    </label>
    <div className="text-gray-900 py-2 text-sm bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-center w-full break-words">
      {value || "-"}
    </div>
  </div>
);

// Komponen kecil untuk menampilkan link ke file
const FileLink = ({ label, url }: { label: string; url: string | null }) => {
  if (!url) return <DetailField label={label} value="Tidak ada file" />;

  return (
    <div>
      <label className="text-gray-600 font-medium text-sm mb-1 block">
        {label}
      </label>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm text-blue-600 font-semibold">
          Lihat Dokumen
        </span>
        <LinkIcon className="w-4 h-4 text-gray-500" />
      </a>
    </div>
  );
};

export default function DetailKpltLayout({ data }: DetailKpltLayoutProps) {
  const router = useRouter();

  // Asumsi struktur data dari API seperti ini. Sesuaikan jika berbeda.
  const { base, analytics, files } = data;

  return (
    <div className="flex">
      <main className="flex-1 p-4 md:p-4">
        <div className="max-w-7xl mx-auto">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="back"
            className="mb-6 bg-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Button>

          <div className="mb-10 ">
            {data && <PrefillKpltCard data={base} />}
          </div>

          {/* --- Bagian Analisis Kelayakan --- */}
          <div className="relative mt-10">
            <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded-md shadow-md font-semibold">
              Analisis Kelayakan Lokasi
            </div>
            <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl p-6 pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DetailField
                label="Karakter Lokasi"
                value={analytics.karakterLokasi}
              />
              <DetailField
                label="Sosial Ekonomi"
                value={analytics.sosialEkonomi}
              />
              <DetailField label="Skor FPL" value={analytics.scoreFpl} />
              <DetailField label="STD" value={analytics.std} />
              <DetailField label="APC" value={analytics.apc} />
              <DetailField label="SPD" value={analytics.spd} />
              <DetailField label="PE Status" value={analytics.peStatus} />
              <DetailField label="PE RAB" value={analytics.peRab} />
            </div>
          </div>

          {/* --- Bagian Dokumen Terlampir --- */}
          <div className="relative mt-10">
            <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
              Dokumen Terlampir
            </div>
            <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl p-6 pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Asumsikan nama field URL di `data.files` berakhiran _url */}
              <FileLink label="Foto" url={files.pdfFoto} />
              <FileLink
                label="Counting Kompetitor"
                url={files.countingKompetitor}
              />
              <FileLink label="Data Pembanding" url={files.pdfPembanding} />
              <FileLink label="Kertas Kerja Survei" url={files.pdfKks} />
              <FileLink
                label="Form Pembobotan Lokasi (FPL)"
                url={files.excelFpl}
              />
              <FileLink label="Project Evaluation (PE)" url={files.excelPe} />
              <FileLink label="Form Ukur Lokasi" url={files.pdfFormUkur} />
              <FileLink
                label="Video Traffic Siang"
                url={files.videoTrafficSiang}
              />
              <FileLink
                label="Video Traffic Malam"
                url={files.videoTrafficMalam}
              />
              <FileLink label="Video 360 Siang" url={files.video360Siang} />
              <FileLink label="Video 360 Malam" url={files.video360Malam} />
              <FileLink label="Peta Coverage" url={files.petaCoverage} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
