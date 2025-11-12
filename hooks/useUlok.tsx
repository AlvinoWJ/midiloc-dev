"use client";

import useSWR from "swr";
import type { AppUser } from "./useUser";

export type Ulok = {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string;
  latitude: string;
  longitude: string;
};

interface ApiUlokResponse {
  data: Ulok[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: { user?: AppUser };
}

export function useUlok(searchQuery?: string) {
  // Bangun URL secara dinamis
  const createUrl = () => {
    const params = new URLSearchParams();
    params.set("limit", "1000");

    if (searchQuery && searchQuery.trim() !== "") {
      params.set("search", searchQuery.trim());
    }

    return `/api/ulok?${params.toString()}`;
  };

  const apiUrl = createUrl();

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiUlokResponse>(apiUrl, {
      keepPreviousData: true,
    });

  const hasData = !!data;

  // isInitialLoading HANYA true jika:
  // 1. SWR sedang 'isLoading' (tidak ada data stale)
  // 2. DAN kita benar-benar tidak punya data
  const isInitialLoading = isLoading && !hasData;

  // isRefreshing HANYA true jika:
  // 1. SWR sedang 'isValidating' (me-refresh)
  // 2. DAN kita SUDAH punya data (yang lama)
  const isRefreshing = isValidating && hasData;

  return {
    ulokData: data?.data ?? [],

    isInitialLoading: isInitialLoading,

    isRefreshing: isRefreshing,
    ulokError: error,
    meta: data?.meta,
    refreshUlok: () => mutate(),
  };
}
