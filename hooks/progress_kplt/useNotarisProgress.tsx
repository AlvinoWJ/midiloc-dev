// hooks/progress_kplt/useNotarisProgress.tsx
"use client";

import { useEffect, useState } from "react";

/**
 * Interface NotarisData
 * ---------------------
 * Mendefinisikan struktur data untuk tahap "Notaris" dalam progress KPLT.
 * Semua field bersifat nullable karena data bisa disimpan sebagian (Draft)
 * atau belum ada sama sekali (Create Mode).
 */
interface NotarisData {
  awal_sewa?: string | null;
  akhir_sewa?: string | null;
  par_online?: string | null; // Path file
  tanggal_par?: string | null;
  validasi_legal?: string | null;
  tanggal_validasi_legal?: string | null;
  tanggal_plan_notaris?: string | null;
  tanggal_notaris?: string | null;
  status_notaris?: string | null;
  status_pembayaran?: string | null;
  tanggal_pembayaran?: string | null;

  // Status Approval Final
  final_status_notaris?: string | null;
  tgl_selesai_notaris?: string | null;

  // Metadata
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Return Type Hook
 * Menyediakan data state dan fungsi untuk memuat ulang data.
 */
interface UseNotarisProgressResult {
  data: NotarisData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom Hook: useNotarisProgress
 * -------------------------------
 * Mengelola pengambilan data (fetching) untuk tahap Notaris.
 * @param progressId - ID dari progress KPLT induk.
 */
export function useNotarisProgress(
  progressId: string | undefined
): UseNotarisProgressResult {
  const [data, setData] = useState<NotarisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fungsi Fetcher Asynchronous.
   * Mengakses endpoint `/api/progress/[id]/notaris`.
   */
  async function fetchNotaris() {
    // 1. Guard: Pastikan ID valid
    if (!progressId) {
      setError("progressId tidak valid");
      setData(null);
      setLoading(false);
      return;
    }

    // 2. Reset State sebelum fetch baru
    setData(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/progress/${progressId}/notaris`);
      const json = await res.json();

      // 3. Handle 404 (Not Found) secara khusus.
      // Jika API mengembalikan 404, ini BUKAN error aplikasi.
      // Ini berarti data Notaris belum pernah dibuat untuk progressID ini.
      // UI akan menggunakan informasi ini untuk menampilkan form kosong (Mode Create).
      if (
        res.status === 404 ||
        json.error?.toLowerCase().includes("not found")
      ) {
        setData(null);
        setLoading(false);
        return;
      }

      // 4. Handle Error Server/Jaringan
      if (!res.ok)
        throw new Error(json.error || "Gagal mengambil data Notaris");

      // 5. Validasi Payload
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

  // Efek: Jalankan fetch saat komponen mount atau ID berubah
  useEffect(() => {
    fetchNotaris();
  }, [progressId]);

  return { data, loading, error, refetch: fetchNotaris };
}
