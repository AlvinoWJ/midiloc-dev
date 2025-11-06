// hooks/progress_kplt/useNotarisHistory.tsx
"use client";

import useSWR from "swr";

export interface NotarisHistoryItem {
  id: string; // atau tipe unik lainnya
  created_at: string;
  status_from: string | null; // Status sebelumnya
  status_to: string;
  data: Record<string, any>;
  [key: string]: any; // Fallback untuk properti lain
}

interface HistoryApiResponse {
  data: {
    count: number;
    items: NotarisHistoryItem[];
  };
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Gagal memuat riwayat notaris");
    }
    return res.json();
  });

export function useNotarisHistory(progressId: string | undefined) {
  const key = progressId ? `/api/progress/${progressId}/notaris/history` : null;

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
