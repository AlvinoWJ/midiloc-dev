// hooks/progress_kplt/useGrandOpeningProgress.tsx
"use client";

import { useEffect, useState } from "react";

/**
 * Interface GrandOpeningData
 * --------------------------
 * Mendefinisikan bentuk data yang diterima dari API untuk tahap Grand Opening.
 * Menggunakan tipe nullable (string | null) karena data mungkin belum diisi.
 * Sesuai dengan schema di lib/validations/grand_opening.ts.
 */
interface GrandOpeningData {
  rekom_go_vendor?: string | null;
  tgl_rekom_go_vendor?: string | null;
  tgl_go?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  final_status_go?: string | null;
  tgl_selesai_go?: string | null;
}

/**
 * Interface Return Value Hook
 */
interface UseGrandOpeningProgressResult {
  data: GrandOpeningData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>; // Fungsi manual untuk refresh data
}

/**
 * Custom Hook: useGrandOpeningProgress
 * ------------------------------------
 * Mengelola state dan fetching data untuk progress "Grand Opening"
 * berdasarkan ID Progress KPLT.
 *
 * @param progressId - ID dari progress KPLT yang sedang aktif.
 */
export function useGrandOpeningProgress(
  progressId: string | undefined
): UseGrandOpeningProgressResult {
  const [data, setData] = useState<GrandOpeningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fungsi Fetcher Asynchronous.
   * Mengambil data dari endpoint `/api/progress/[id]/grand_opening`.
   */
  async function fetchGrandOpening() {
    // 1. Validasi Input: Jangan fetch jika ID tidak ada
    if (!progressId) {
      setError("progressId tidak valid");
      setData(null);
      setLoading(false);
      return;
    }

    // 2. Reset State: Bersihkan data lama saat mulai fetch baru
    setData(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/progress/${progressId}/grand_opening`);
      const json = await res.json();

      // 3. Handle 404 (Not Found)
      // Jika status 404, artinya data Grand Opening belum dibuat untuk progress ini.
      // Kita set data = null (Empty State), BUKAN error.
      if (
        res.status === 404 ||
        json.error?.toLowerCase().includes("not found")
      ) {
        setData(null);
        setLoading(false);
        return;
      }

      // 4. Handle Error Lainnya
      if (!res.ok)
        throw new Error(json.error || "Gagal mengambil data Grand Opening");

      // 5. Validasi Payload Data
      if (!json?.data) {
        setData(null);
        setLoading(false);
        return;
      }

      // 6. Set Success Data
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // Efek: Jalankan fetch setiap kali progressId berubah
  useEffect(() => {
    fetchGrandOpening();
  }, [progressId]);

  return { data, loading, error, refetch: fetchGrandOpening };
}
