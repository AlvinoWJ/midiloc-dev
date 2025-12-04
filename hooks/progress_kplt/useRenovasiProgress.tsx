"use client";

import { useEffect, useState } from "react";

/**
 * Interface RenovasiData
 * ----------------------
 * Mendefinisikan struktur data untuk tahap "Renovasi".
 * Mencakup data administratif toko, jadwal SPK, dan tracking progress fisik (Plan vs Proses).
 * Semua field bersifat nullable karena data mungkin baru terisi sebagian (Draft) atau belum ada.
 */
interface RenovasiData {
  nama_store?: string | null;
  kode_store?: string | null;
  tipe_toko?: string | null;
  bentuk_objek?: string | null;

  // Data Rekomendasi
  rekom_renovasi?: string | null;
  tgl_rekom_renovasi?: string | null;
  file_rekom_renovasi?: string | null;

  // Data SPK (Surat Perintah Kerja)
  start_spk_renov?: string | null;
  end_spk_renov?: string | null;

  // Tracking Progress Fisik
  plan_renov?: number | null; // Rencana progress (%)
  proses_renov?: number | null; // Realisasi progress (%)
  deviasi?: number | null; // Selisih (Proses - Plan)

  // Metadata & Status
  tgl_serah_terima?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  final_status_renov?: string | null; // Status Approval Final
  tgl_selesai_renov?: string | null;
}

/**
 * Return Type Hook
 * @property refetch - Fungsi untuk memicu reload data secara manual (misal setelah update).
 */
interface UseRenovasiProgressResult {
  data: RenovasiData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom Hook: useRenovasiProgress
 * --------------------------------
 * Mengelola state fetching data untuk tahap Renovasi.
 * @param progressId - ID dari progress KPLT induk.
 */
export function useRenovasiProgress(
  progressId: string | undefined
): UseRenovasiProgressResult {
  const [data, setData] = useState<RenovasiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fungsi Fetcher Asynchronous.
   * Mengakses endpoint `/api/progress/[id]/renovasi`.
   */
  async function fetchRenovasi() {
    // 1. Guard: Pastikan progressId valid sebelum fetch
    if (!progressId) {
      setError("progressId tidak valid");
      setData(null);
      setLoading(false);
      return;
    }

    // 2. Reset State sebelum request baru
    setData(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/progress/${progressId}/renovasi`);
      const json = await res.json();

      // 3. Handle 404 (Not Found) secara khusus
      // Jika API mengembalikan 404, artinya record renovasi belum dibuat.
      // Ini BUKAN error sistem, melainkan indikasi untuk masuk ke "Mode Create".
      // Kita set data = null agar form ditampilkan kosong.
      if (
        res.status === 404 ||
        json.error?.toLowerCase().includes("not found")
      ) {
        setData(null);
        setLoading(false);
        return;
      }

      // 4. Handle Error HTTP Lainnya
      if (!res.ok)
        throw new Error(json.error || "Gagal mengambil data Renovasi");

      // 5. Validasi Payload Data
      if (!json?.data) {
        setData(null);
        setLoading(false);
        return;
      }

      // 6. Set Data Sukses
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // Efek: Jalankan fetch otomatis saat komponen dimount atau ID berubah
  useEffect(() => {
    fetchRenovasi();
  }, [progressId]);

  return { data, loading, error, refetch: fetchRenovasi };
}
