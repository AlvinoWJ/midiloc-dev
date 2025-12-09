"use client";

import useSWR from "swr";

/**
 * Interface RenovasiHistoryItem
 * -----------------------------
 * Mendefinisikan struktur satu entitas log/riwayat perubahan untuk tahap Renovasi.
 * - status_from/to: Melacak transisi status workflow (misal: dari 'Pending' ke 'In Progress').
 * - data: Menyimpan snapshot (rekaman) data lengkap pada saat perubahan terjadi.
 * - [key: string]: any: Index signature untuk fleksibilitas jika ada properti tambahan dari backend.
 */
export interface RenovasiHistoryItem {
  id: string;
  created_at: string; // Waktu perubahan terjadi
  status_from: string | null; // Status sebelum perubahan (null jika data baru)
  status_to: string; // Status setelah perubahan
  data: Record<string, any>; // Snapshot data JSON (berisi field seperti 'plan_renov', 'deviasi', dll)
  [key: string]: any; // Fallback
}

/**
 * Struktur Response dari API History.
 */
interface HistoryApiResponse {
  data: {
    count: number;
    items: RenovasiHistoryItem[];
  };
}

/**
 * Fetcher standar untuk SWR.
 * Meng-handle request dan error throwing jika status non-2xx.
 */
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Gagal memuat riwayat Renovasi");
    }
    return res.json();
  });

/**
 * useRenovasiHistory Hook
 * -----------------------
 * Mengambil daftar riwayat perubahan (Audit Trail) untuk tahap Renovasi.
 * @param progressId - ID dari progress KPLT induk.
 */
export function useRenovasiHistory(progressId: string | undefined) {
  // 1. Conditional Fetching:
  // Jika progressId belum ada, set key ke null agar SWR tidak melakukan request.
  const key = progressId
    ? `/api/progress/${progressId}/renovasi/history`
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
