// hooks/progress_kplt/useRenovasiHistory.tsx
"use client";

import useSWR from "swr";

export interface RenovasiHistoryItem {
  id: string;
  created_at: string;
  status_from: string | null;
  status_to: string;
  data: Record<string, any>;
  [key: string]: any;
}

interface HistoryApiResponse {
  data: {
    count: number;
    items: RenovasiHistoryItem[];
  };
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Gagal memuat riwayat Renovasi");
    }
    return res.json();
  });

export function useRenovasiHistory(progressId: string | undefined) {
  const key = progressId
    ? `/api/progress/${progressId}/renovasi/history`
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
