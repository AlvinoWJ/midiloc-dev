"use client";

/**
 * DetailProgressKpltPage
 * ----------------------
 * Halaman detail progres KPLT yang menampilkan:
 * - Informasi progres KPLT berdasarkan ID
 * - File modul terkait progress KPLT (Module Files)
 * - Timeline progres yang sudah berlangsung
 *
 * Fitur utama:
 * - Mengambil detail progres melalui hook `useProgressDetail`
 * - Mengambil module files melalui hook `useModuleFiles`
 * - Auto loading & error handling untuk kedua sumber data
 * - Mengirimkan hasil refetch ke layout agar data dapat diperbarui
 */

import React from "react";
import { useParams } from "next/navigation";
import DetailProgressKpltLayout from "@/components/layout/detail_progress_kplt_layout";
import { useProgressDetail } from "@/hooks/progress_kplt/useProgressDetail";
import { useModuleFiles } from "@/hooks/useModuleFile";
import { Loader2 } from "lucide-react";

export default function DetailProgressKpltPage() {
  /**
   * Mengambil ID progres dari URL parameter.
   * Contoh URL: /progress_kplt/detail/123 → progressId = "123"
   */
  const params = useParams();
  const progressId = params.id as string;

  /**
   * Hook: Mengambil detail progres berdasarkan ID.
   * Hasil berisi:
   * - progressDetail → data progres lengkap (progress + timeline)
   * - isLoading → state loading
   * - isError → status error
   * - refetch → fungsi untuk refresh data
   */
  const {
    progressDetail: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError,
    refetch: refetchProgressDetail,
  } = useProgressDetail(progressId);

  /**
   * Mengambil kplt_id dari detail progres.
   * kplt_id digunakan untuk fetch file modul KPLT.
   */
  const kpltId = progressData?.progress?.kplt_id;

  /**
   * Hook: Mengambil module files berdasarkan tipe modul dan ID.
   * Dalam kasus ini modul = "kplt"
   * File dapat berupa dokumen/file pendukung dari KPLT tersebut.
   */
  const {
    files,
    isLoading: isFilesLoading,
    error: isFilesError,
  } = useModuleFiles("kplt", kpltId);

  /**
   * Penanda halaman sedang loading jika:
   * - data progres masih loading
   * - kpltId sudah ada DAN module files masih loading
   */
  const isPageLoading = isProgressLoading || (kpltId && isFilesLoading);

  /**
   * Mengambil status progres utama ("In Progress", "Done", dll.)
   * Dipakai untuk ditampilkan atau logika lanjutan di layout.
   */
  const currentMainStatus = progressData?.progress?.status;

  /**
   * Jika halaman masih loading, tampilkan spinner loading.
   */
  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-600">Memuat Detail Progres KPLT...</p>
      </div>
    );
  }

  /**
   * Jika terjadi error saat memuat progres atau files, atau data tidak ditemukan.
   * Tampilkan pesan error.
   */
  if (isProgressError || isFilesError || !progressData) {
    return (
      <main className="p-4 lg:p-6 text-center">
        <p className="text-red-600">
          Gagal memuat data.
          {isProgressError || isFilesError?.message}
        </p>
      </main>
    );
  }

  /**
   * Jika semua data tersedia, render layout utama.
   *
   * Props yang dikirim:
   * - progressData → data progres
   * - files → daftar file modul
   * - isFilesError → error file modul (jika ada)
   * - currentMainStatus → status progres utama
   * - timeline → riwayat progres
   * - onDataUpdate → fungsi refetch untuk refresh data
   */
  return (
    <DetailProgressKpltLayout
      progressData={progressData.progress}
      files={files}
      isFilesError={isFilesError}
      currentMainStatus={currentMainStatus}
      timeline={progressData.timeline}
      onDataUpdate={refetchProgressDetail}
    />
  );
}
