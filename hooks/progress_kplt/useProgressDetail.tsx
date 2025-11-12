"use client";

import { useState, useEffect } from "react";

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

export interface ProgressData {
  id: string;
  kplt_id: string; // ID-nya
  status: string; // Status utama, cth: "Notaris"
  created_at: string;
  updated_at: string;
  kplt: KpltDetail; // Objek KpltDetail yang di-nest
}

export interface ProgressDetailData {
  progress: ProgressData;
  final_status_it: string | null;
}

interface UseProgressDetailResult {
  progressDetail: ProgressDetailData | null;
  isLoading: boolean;
  isError: string | null;
  refetch: () => Promise<void>;
}

export function useProgressDetail(
  id: string | undefined
): UseProgressDetailResult {
  const [progressDetail, setProgressDetail] =
    useState<ProgressDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);

  async function fetchProgressDetail() {
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

      if (
        res.status === 404 ||
        json.error?.toLowerCase().includes("not found")
      ) {
        setProgressDetail(null);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(json.error || "Gagal mengambil data progress detail.");
      }

      if (!json?.data) {
        setProgressDetail(null);
        setIsLoading(false);
        return;
      }

      setProgressDetail(json.data);
    } catch (err: any) {
      setIsError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProgressDetail();
  }, [id]);

  return {
    progressDetail,
    isLoading,
    isError,
    refetch: fetchProgressDetail,
  };
}
