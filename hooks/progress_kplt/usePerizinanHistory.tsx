// hooks/progress_kplt/usePerizinanHistory.tsx
"use client";

import useSWR from "swr";

export interface PerizinanHistoryItem {
  id: string; // atau tipe unik lainnya
  created_at: string;
  status_from: string | null; // Status sebelumnya
  status_to: string; // Status baru
  [key: string]: any; // Fallback untuk properti lain
}

interface HistoryApiResponse {
  data: {
    count: number;
    items: PerizinanHistoryItem[];
  };
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Gagal memuat riwayat perizinan");
    }
    return res.json();
  });

export function usePerizinanHistory(progressId: string | undefined) {
  const key = progressId
    ? `/api/progress/${progressId}/perizinan/history`
    : null;

  const { data, error, isLoading, mutate } = useSWR<HistoryApiResponse>(
    key,
    fetcher
  );

  const historyArray = data?.data?.items ?? [];

  return {
    history: historyArray,
    isLoading,
    isError: !!error,
    error,
    refetch: mutate,
  };
}
