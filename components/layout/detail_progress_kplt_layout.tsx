//detail_progress_kplt_layout.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TimelineProgressKplt from "@/components/ui/progress_kplt/timeline";
import { ProgressDetailData } from "@/hooks/progress_kplt/useProgressDetail";
import { MappedModuleFile } from "@/hooks/useModuleFile";
import {
  ArrowLeft,
  ChevronDownIcon,
  FileText,
  Link as LinkIcon,
  Sheet,
  Video,
  Image,
  FileQuestion,
} from "lucide-react";
import { CalendarIcon } from "@heroicons/react/24/solid";

interface LayoutProps {
  progressData: ProgressDetailData;
  files: MappedModuleFile[] | undefined;
  isFilesError: any;
}

const getFileIcon = (fileType: MappedModuleFile["fileType"]) => {
  switch (fileType) {
    case "pdf":
      return <FileText className="w-6 h-6 text-red-600" />;
    case "excel":
      return <Sheet className="w-6 h-6 text-green-600" />;
    case "video":
      return <Video className="w-6 h-6 text-blue-600" />;
    case "image":
      return <Image className="w-6 h-6 text-indigo-600" />;
    default:
      return <FileQuestion className="w-6 h-6 text-gray-500" />;
  }
};

const generateLabel = (field: string | null): string => {
  if (!field) return "File Lainnya";
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

export default function DetailProgressKpltLayout({
  progressData,
  files,
  isFilesError,
}: LayoutProps) {
  const router = useRouter();
  const { kplt_id: kplt } = progressData;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <main className="space-y-4 lg:space-y-6">
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

      <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] transition-all duration-500">
        <div className="p-6">
          {/* Judul dan Created Date */}
          <div className="flex-1 min-w-0 mb-4">
            <h1 className="text-lg lg:text-xl font-bold text-gray-800">
              {kplt.nama_kplt}
            </h1>
            <p className="text-base lg:text-lg text-gray-500 mt-1">
              {kplt.alamat}
            </p>
            {kplt.created_at && (
              <p className="flex items-center text-sm lg:text-base text-gray-500 mt-2">
                <CalendarIcon className="w-4 h-4 mr-1.5" />
                Dibuat pada: {formatDate(kplt.created_at)}
              </p>
            )}
          </div>
        </div>
        <div
          className={`transition-[max-height] duration-700 ease-in-out overflow-hidden ${
            isExpanded ? "max-h-[5000px]" : "max-h-0"
          }`}
        >
          <div className="px-6 pb-6">
            {/* Detail Info KPLT */}
            <div className="border-t border-gray-300 pt-5">
              <h4 className="text-base lg:text-lg font-semibold text-gray-700 mb-3">
                Informasi Detail KPLT
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                {/* Data Alamat */}
                <div>
                  <label className="text-gray-500 block mb-1">Provinsi</label>
                  <p className="font-semibold text-gray-900">{kplt.provinsi}</p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">
                    Kabupaten/Kota
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.kabupaten}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">Kecamatan</label>
                  <p className="font-semibold text-gray-900">
                    {kplt.kecamatan}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">
                    Kelurahan/Desa
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.desa_kelurahan}
                  </p>
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

                {/* Data Pemilik & Sewa */}
                <div>
                  <label className="text-gray-500 block mb-1">
                    Nama Pemilik
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.nama_pemilik}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">
                    Kontak Pemilik
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.kontak_pemilik}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">Harga Sewa</label>
                  <p className="font-semibold text-gray-900">
                    {kplt.harga_sewa}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">Alas Hak</label>
                  <p className="font-semibold text-gray-900">{kplt.alas_hak}</p>
                </div>

                {/* Data Teknis Bangunan */}
                <div>
                  <label className="text-gray-500 block mb-1">
                    Bentuk Objek
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.bentuk_objek}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">
                    Format Store
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.format_store}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">Luas</label>
                  <p className="font-semibold text-gray-900">{kplt.luas} m²</p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">Panjang</label>
                  <p className="font-semibold text-gray-900">
                    {kplt.panjang} m
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">
                    Lebar Depan
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.lebar_depan} m
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">
                    Jumlah Lantai
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.jumlah_lantai}
                  </p>
                </div>

                {/* Data Analisis Lokasi */}
                <div>
                  <label className="text-gray-500 block mb-1">
                    Karakter Lokasi
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.karakter_lokasi}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">
                    Sosial Ekonomi
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.sosial_ekonomi}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">Skor FPL</label>
                  <p className="font-semibold text-gray-900">{kplt.skor_fpl}</p>
                </div>

                {/* Data Potensi */}
                <div>
                  <label className="text-gray-500 block mb-1">APC</label>
                  <p className="font-semibold text-gray-900">{kplt.apc}</p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">SPD</label>
                  <p className="font-semibold text-gray-900">{kplt.spd}</p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">STD</label>
                  <p className="font-semibold text-gray-900">{kplt.std}</p>
                </div>

                {/* Status Approval */}
                <div>
                  <label className="text-gray-500 block mb-1">
                    Approval Intip
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.approval_intip}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">
                    KPLT Approval
                  </label>
                  <p className="font-semibold text-gray-900">
                    {kplt.kplt_approval}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">PE Status</label>
                  <p className="font-semibold text-gray-900">
                    {kplt.pe_status}
                  </p>
                </div>
              </div>
            </div>

            {/* Dokumen KPLT */}
            <div className="border-t border-gray-300 pt-5 mt-6">
              <h4 className="text-base lg:text-lg font-semibold text-gray-700 mb-3">
                Dokumen KPLT Terkait
              </h4>

              {/* Pesan error HANYA untuk file */}
              {isFilesError && (
                <p className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                  Gagal memuat dokumen.
                </p>
              )}

              {/* Grid dokumen */}
              {/* Kita tidak perlu 'isLoading' di sini karena sudah ditangani 'isCardLoading' */}
              {files && files.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file) => (
                    <div
                      key={file.href}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getFileIcon(file.fileType)}
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-sm text-gray-800 truncate">
                            {generateLabel(file.field)}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {file.sizeFormatted} • {file.lastModifiedFormatted}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 flex-shrink-0"
                      >
                        <LinkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Tampilkan pesan jika tidak ada file */}
              {files && files.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  Tidak ada dokumen terkait untuk KPLT ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Toggle Expand/Collapse */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 w-full text-gray-500 rounded-b-xl hover:bg-gray-50 focus-visible:bg-gray-100 transition-colors"
        >
          <ChevronDownIcon
            className={`w-6 h-6 mx-auto transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Timeline Progress  */}
      <div className="mt-8 lg:mt-10">
        <TimelineProgressKplt progressId={progressData.id} />
      </div>
    </main>
  );
}
