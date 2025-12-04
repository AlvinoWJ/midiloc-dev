// hooks/useIzinTetanggaProgress.tsx
"use client";

import { useEffect, useState } from "react";
import { stripServerControlledFieldsIT } from "@/lib/validations/izin_tetangga";

/**
 * Interface IzinTetanggaData
 * --------------------------
 * Mendefinisikan bentuk data yang diterima dari API untuk tahap Izin Tetangga.
 * Semua field bersifat opsional/nullable karena data mungkin baru dibuat sebagian.
 */
interface IzinTetanggaData {
  nominal?: number | null;
  tanggal_terbit?: string | null;
  file_izin_tetangga?: string | null;
  file_bukti_pembayaran?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  final_status_it?: string | null; // Status approval (Selesai/Batal/Proses)
  tgl_selesai_izintetangga?: string | null;
}

interface UseIzinTetanggaProgressResult {
  data: IzinTetanggaData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>; // Fungsi untuk refresh data manual
}

/**
 * Custom Hook: useIzinTetanggaProgress
 * ------------------------------------
 * Mengelola state dan fetching data untuk progress "Izin Tetangga".
 * @param progressId - ID dari progress KPLT yang sedang aktif.
 */
export function useIzinTetanggaProgress(
  progressId: string | undefined
): UseIzinTetanggaProgressResult {
  const [data, setData] = useState<IzinTetanggaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fungsi Fetcher Asynchronous.
   * Mengambil data dari endpoint `/api/progress/[id]/izin_tetangga`.
   */
  async function fetchIzinTetangga() {
    // 1. Guard: Pastikan progressId tersedia sebelum fetch
    if (!progressId) {
      setError("progressId tidak valid");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Request ke API
      const res = await fetch(`/api/progress/${progressId}/izin_tetangga`);
      const json = await res.json();

      // 3. Handle 404 (Not Found)
      // Skenario khusus: Jika data tidak ditemukan, artinya user belum pernah mengisi form ini.
      // Kita set data = null, tapi bukan error, agar UI menampilkan form kosong (Create Mode).
      if (
        res.status === 404 ||
        json.error?.toLowerCase().includes("not found")
      ) {
        setData(null);
        setLoading(false);
        return;
      }

      // 4. Handle Generic Errors
      if (!res.ok)
        throw new Error(json.error || "Gagal mengambil data Izin Tetangga");

      // 5. Validasi Payload
      if (!json?.data) {
        setData(null);
        setLoading(false);
        return;
      }

      // Opsional: Membersihkan field yang dikontrol server (jika diperlukan untuk logic tertentu)
      // const clean = stripServerControlledFieldsIT(json.data);

      // 6. Set State Data Sukses
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // Efek: Jalankan fetch saat komponen mount atau progressId berubah
  useEffect(() => {
    fetchIzinTetangga();
  }, [progressId]);

  return { data, loading, error, refetch: fetchIzinTetangga };
}
