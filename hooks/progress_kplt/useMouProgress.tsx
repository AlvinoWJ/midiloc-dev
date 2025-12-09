// hooks/useMouProgress.ts
"use client";

import { useEffect, useState } from "react";

/**
 * Interface MouData
 * -----------------
 * Mendefinisikan struktur data MOU (Memorandum of Understanding) yang diterima dari API.
 * Semua field bersifat nullable/opsional karena:
 * 1. Data mungkin belum diisi lengkap (Partial Save).
 * 2. Data mungkin belum ada sama sekali (Create Mode).
 */
interface MouData {
  tanggal_mou?: string | null;
  nama_pemilik_final?: string | null;
  periode_sewa?: number | null;
  nilai_sewa?: number | null;
  status_pajak?: string | null;
  pembayaran_pph?: string | null;
  cara_pembayaran?: string | null;
  grace_period?: number | null;
  harga_final?: number | null;
  keterangan?: string | null;
  // Metadata
  created_at?: string | null;
  updated_at?: string | null;
  // Status Approval Final
  final_status_mou?: string | null;
  tgl_selesai_mou?: string | null;
}

/**
 * Return Type Hook
 * Menyediakan data, status loading, error, dan fungsi reload manual.
 */
interface UseMouProgressResult {
  data: MouData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom Hook: useMouProgress
 * ---------------------------
 * Mengelola state fetching data untuk tahapan "MOU".
 * * @param progressId - ID dari progress KPLT induk.
 */
export function useMouProgress(
  progressId: string | undefined
): UseMouProgressResult {
  const [data, setData] = useState<MouData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fungsi Fetcher Asynchronous.
   * Mengakses endpoint `/api/progress/[id]/mou`.
   */
  async function fetchMou() {
    // 1. Guard: Pastikan ID valid sebelum fetch
    if (!progressId) {
      setError("progressId tidak valid");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/progress/${progressId}/mou`);
      const json = await res.json();

      // 2. Handle 404 (Not Found) secara khusus
      // Jika API mengembalikan 404, itu bukan error sistem, melainkan
      // indikasi bahwa user belum pernah membuat data MOU.
      // Kita set data = null agar UI menampilkan formulir kosong (Mode Create).
      if (
        res.status === 404 ||
        json.error?.toLowerCase().includes("not found")
      ) {
        setData(null);
        setLoading(false);
        return;
      }

      // 3. Handle Error Lainnya (500, 403, dll)
      if (!res.ok) throw new Error(json.error || "Gagal mengambil data MOU");

      // 4. Validasi Struktur Response
      if (!json?.data) {
        setData(null);
        setLoading(false);
        return;
      }
      // 5. Set Data Sukses
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // Efek: Jalankan fetch saat komponen mount atau progressId berubah
  useEffect(() => {
    fetchMou();
  }, [progressId]);

  return { data, loading, error, refetch: fetchMou };
}
