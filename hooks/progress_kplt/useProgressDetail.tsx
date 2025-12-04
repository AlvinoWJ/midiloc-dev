"use client";

import { useState, useEffect } from "react";

/**
 * Interface KpltDetail
 * --------------------
 * Representasi lengkap data KPLT (Kajian Potensi Lokasi Toko).
 * Mencakup data fisik, legalitas, file attachment, dan skor analisis.
 * Digunakan untuk menampilkan detail lengkap pada halaman Progress.
 */
export interface KpltDetail {
  id: string;
  apc: number;
  spd: number;
  std: number;
  luas: number;
  alamat: string;
  pe_rab: number;
  panjang: number;
  pdf_kks: string;
  ulok_id: string;
  alas_hak: string;
  excel_pe: string;
  latitude: number;
  pdf_foto: string;
  provinsi: string;
  skor_fpl: number;
  branch_id: string;
  excel_fpl: string;
  form_ukur: string | null;
  form_ulok: string;
  is_active: boolean;
  kabupaten: string;
  kecamatan: string;
  longitude: number;
  nama_kplt: string;
  pe_status: string;
  created_at: string;
  file_intip: string;
  harga_sewa: number;
  updated_at: string;
  updated_by: string;
  lebar_depan: number;
  bentuk_objek: string;
  format_store: string;
  nama_pemilik: string;
  tanggal_ukur: string | null;
  jumlah_lantai: number;
  kplt_approval: string;
  peta_coverage: string;
  approval_intip: string;
  desa_kelurahan: string;
  kontak_pemilik: string;
  pdf_pembanding: string;
  sosial_ekonomi: string;
  karakter_lokasi: string;
  video_360_malam: string;
  video_360_siang: string;
  ulok_eksternal_id: string | null;
  counting_kompetitor: string;
  video_traffic_malam: string;
  video_traffic_siang: string;
  tanggal_approval_intip: string;
}

/**
 * Interface TimelineItem
 * ----------------------
 * Struktur data untuk visualisasi timeline (Stepper).
 * step: Nama tahapan (misal: "MOU", "Renovasi").
 * ui_status: Status visual ("done", "in_progress", "pending").
 */
export interface TimelineItem {
  step: string;
  ui_status: "done" | "pending" | "in_progress" | string;
  created_at: string | null;
  finalized_at: string | null;
}

/**
 * Wrapper data progress utama.
 */
export interface ProgressData {
  id: string;
  kplt_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  kplt: KpltDetail;
}

/**
 * Payload lengkap yang dikembalikan oleh API Detail Progress.
 */
export interface ProgressDetailData {
  progress: ProgressData;
  timeline: TimelineItem[];
}

interface UseProgressDetailResult {
  progressDetail: ProgressDetailData | null;
  isLoading: boolean;
  isError: string | null;
  refetch: () => Promise<void>; // Fungsi manual refresh
}

/**
 * Custom Hook: useProgressDetail
 * ------------------------------
 * Mengambil data detail progress KPLT beserta timeline-nya.
 * @param id - ID Progress (bukan ID KPLT, tapi ID dari tabel progress).
 */
export function useProgressDetail(
  id: string | undefined
): UseProgressDetailResult {
  const [progressDetail, setProgressDetail] =
    useState<ProgressDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);

  /**
   * Fungsi Fetcher Utama.
   * Melakukan request ke `/api/progress/[id]`.
   */
  async function fetchProgressDetail() {
    // Guard: Pastikan ID ada sebelum fetch
    if (!id) {
      setIsError("ID progress tidak valid");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(null);

    try {
      const res = await fetch(`/api/progress/${id}`);
      const json = await res.json();

      // --- Handling 404 (Not Found) ---
      // Jika data tidak ditemukan, set data null dan stop loading.
      // Ini mencegah aplikasi crash atau menampilkan error generik.
      if (
        res.status === 404 ||
        (typeof json.error === "string" &&
          json.error.toLowerCase().includes("not found"))
      ) {
        setProgressDetail(null);
        setIsLoading(false);
        return;
      }

      // --- Handling Generic Error ---
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengambil data progress detail.");
      }

      // --- Validasi Data ---
      if (!json?.data) {
        setProgressDetail(null);
        setIsLoading(false);
        return;
      }

      // Set State Sukses
      setProgressDetail({
        progress: json.data.progress,
        timeline: json.data.timeline ?? [], // Fallback array kosong jika timeline null
      });
    } catch (err: any) {
      setIsError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }

  // Efek: Jalankan fetch saat ID berubah
  useEffect(() => {
    fetchProgressDetail();
  }, [id]);

  return {
    progressDetail,
    isLoading,
    isError,
    refetch: fetchProgressDetail, // Expose fungsi refetch untuk dipanggil komponen UI
  };
}
