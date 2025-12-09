// hooks/progress_kplt/useNotarisHistory.tsx
"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr-keys";

/**
 * NotarisHistoryItem
 * ------------------
 * Struktur data yang merepresentasikan satu kejadian perubahan (log).
 * - status_from/to: Melacak perubahan status workflow.
 * - data: Menyimpan snapshot (rekaman) data lengkap pada saat perubahan terjadi.
 * Ini memungkinkan fitur "Diffing" (membandingkan apa yang berubah).
 */
export interface NotarisHistoryItem {
  id: string;
  created_at: string; // Waktu perubahan terjadi
  status_from: string | null; // Status sebelumnya (bisa null jika data baru)
  status_to: string; // Status setelah perubahan
  data: Record<string, any>; // JSON Snapshot dari data Notaris
  [key: string]: any; // Index signature untuk fleksibilitas properti lain
}

/**
 * Struktur Response standar dari API History.
 */
interface HistoryApiResponse {
  data: {
    count: number;
    items: NotarisHistoryItem[];
  };
}

/**
 * Fetcher function khusus.
 * Menggunakan `cache: "no-store"` pada level browser fetch API untuk memastikan
 * kita tidak mendapatkan data stale dari disk cache browser, karena history
 * sering berubah (real-time audit).
 */
const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => {
    if (!res.ok) {
      throw new Error("Gagal memuat riwayat notaris");
    }
    return res.json();
  });

/**
 * useNotarisHistory Hook
 * ----------------------
 * Mengambil daftar riwayat perubahan untuk ID progress tertentu.
 * @param progressId - ID dari progress KPLT induk.
 */
export function useNotarisHistory(progressId: string | undefined) {
  // Conditional Fetching:
  // Jika progressId tidak ada, key menjadi null sehingga SWR tidak request.
  const key = progressId ? `/api/progress/${progressId}/notaris/history` : null;

  const { data, error, isLoading, mutate } = useSWR<HistoryApiResponse>(
    key,
    fetcher
  );

  // Safety check: Pastikan selalu mengembalikan array (walaupun kosong)
  // untuk mencegah error .map() di komponen UI.
  const historyArray = data?.data?.items ?? [];

  return {
    history: historyArray,
    isLoading,
    isError: !!error,
    error,
    refetch: mutate, // Alias 'mutate' menjadi 'refetch' agar lebih semantik
  };
}
