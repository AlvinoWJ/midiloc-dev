// hooks/progress_kplt/usePerizinanProgress.tsx
"use client";

import { useEffect, useState } from "react";

/**
 * Interface PerizinanData
 * -----------------------
 * Mendefinisikan struktur data untuk tahap "Perizinan" dalam alur KPLT.
 * Mencakup data OSS, SPH, SPK, dan status approval terkait.
 * Semua field bersifat nullable karena data mungkin baru terisi sebagian (Draft).
 */
interface PerizinanData {
  oss?: string | null;
  tgl_oss?: string | null;
  tgl_sph?: string | null;
  tgl_st_berkas?: string | null;
  tgl_gambar_denah?: string | null;
  tgl_spk?: string | null;
  tgl_rekom_notaris?: string | null;
  nominal_sph?: number | null;

  // Metadata & Status
  created_at?: string | null;
  updated_at?: string | null;
  final_status_perizinan?: string | null; // Status Approval Final (Selesai/Batal)
  tgl_selesai_perizinan?: string | null;

  // Status Sub-tahapan
  status_spk?: string | null;
  status_berkas?: string | null;
  status_gambar_denah?: string | null;
  rekom_notaris_vendor?: string | null;
}

/**
 * Return Type Hook
 * @property refetch - Fungsi untuk memicu pengambilan ulang data secara manual.
 */
interface UsePerizinanProgressResult {
  data: PerizinanData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom Hook: usePerizinanProgress
 * ---------------------------------
 * Mengelola state fetching data untuk tahap Perizinan.
 * @param progressId - ID dari progress KPLT induk.
 */
export function usePerizinanProgress(
  progressId: string | undefined
): UsePerizinanProgressResult {
  const [data, setData] = useState<PerizinanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fungsi Fetcher Asynchronous.
   * Mengakses endpoint `/api/progress/[id]/perizinan`.
   */
  async function fetchPerizinan() {
    // 1. Guard: Pastikan progressId valid sebelum fetch
    if (!progressId) {
      setError("progressId tidak valid");
      setData(null);
      setLoading(false);
      return;
    }

    // 2. Reset State: Set loading true saat memulai request baru
    setData(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/progress/${progressId}/perizinan`);
      const json = await res.json();

      // 3. Handle 404 (Not Found) secara khusus (PENTING)
      // Jika API mengembalikan 404, artinya record perizinan belum dibuat.
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

      // 4. Handle Error HTTP Lainnya (500, 403, dll)
      if (!res.ok)
        throw new Error(json.error || "Gagal mengambil data Perizinan");

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
    fetchPerizinan();
  }, [progressId]);

  return { data, loading, error, refetch: fetchPerizinan };
}
