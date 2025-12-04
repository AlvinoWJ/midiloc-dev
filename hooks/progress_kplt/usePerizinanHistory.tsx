// hooks/progress_kplt/usePerizinanHistory.tsx
"use client";

import useSWR from "swr";

/**
 * Interface PerizinanHistoryItem
 * ------------------------------
 * Mendefinisikan struktur satu entitas log/riwayat perubahan.
 * - Melacak perubahan status (`status_from` -> `status_to`).
 * - `[key: string]: any` (Index Signature) digunakan agar kita bisa mengakses
 * properti data snapshot (misal: 'oss', 'nominal_sph') secara dinamis
 * tanpa perlu mendefinisikannya satu per satu di interface ini.
 */
export interface PerizinanHistoryItem {
  id: string; // ID unik untuk log history
  created_at: string; // Timestamp perubahan
  status_from: string | null; // Status sebelum perubahan (bisa null jika data baru)
  status_to: string; // Status setelah perubahan
  [key: string]: any; // Fallback untuk properti lain (Snapshot Data)
}

/**
 * Struktur Response dari API History.
 */
interface HistoryApiResponse {
  data: {
    count: number;
    items: PerizinanHistoryItem[];
  };
}

/**
 * Fetcher standar.
 */
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Gagal memuat riwayat perizinan");
    }
    return res.json();
  });

/**
 * usePerizinanHistory Hook
 * ------------------------
 * Mengambil daftar riwayat perubahan (Audit Trail) untuk tahap Perizinan.
 * @param progressId - ID dari progress KPLT induk.
 */
export function usePerizinanHistory(progressId: string | undefined) {
  // 1. Conditional Fetching:
  // Jika progressId belum ada, set key ke null agar SWR tidak melakukan request.
  const key = progressId
    ? `/api/progress/${progressId}/perizinan/history`
    : null;

  const { data, error, isLoading, mutate } = useSWR<HistoryApiResponse>(
    key,
    fetcher
  );

  // 2. Safety Extraction:
  // Pastikan selalu mengembalikan array kosong [] jika data belum siap
  // untuk mencegah error .map() di komponen UI (Timeline).
  const historyArray = data?.data?.items ?? [];

  return {
    history: historyArray,
    isLoading,
    isError: !!error,
    error,
    refetch: mutate, // Alias 'mutate' menjadi 'refetch' agar lebih deskriptif
  };
}
