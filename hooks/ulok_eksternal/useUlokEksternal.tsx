"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr-keys";

export type UlokEksternal = {
  id: string;
  status_ulok_eksternal: "In Progress" | "OK" | "NOK" | string;
  created_at: string;
  alamat: string;
  nama_pemilik: string;
};

interface ApiUlokEksternalResponse {
  data: UlokEksternal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  // meta dihapus
}

export function useUlokEksternal(
  searchQuery?: string,
  month?: string,
  year?: string
) {
  // Bangun URL secara dinamis
  const createUrl = () => {
    const params = new URLSearchParams();
    params.set("limit", "1000");

    if (searchQuery && searchQuery.trim() !== "") {
      params.set("search", searchQuery.trim());
    }
    if (month && month !== "") {
      params.set("month", month);
    }
    if (year && year !== "") {
      params.set("year", year);
    }

    return `${swrKeys.ulokEksternal}?${params.toString()}`;
  };

  const apiUrl = createUrl();

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiUlokEksternalResponse>(apiUrl, {
      keepPreviousData: true,
    });

  const hasData = !!data;

  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isValidating && hasData;

  return {
    ulokEksternalData: data?.data ?? [],
    isInitialLoading: isInitialLoading,
    isRefreshing: isRefreshing,
    ulokEksternalError: error,
    pagination: data?.pagination,
    refreshUlokEksternal: () => mutate(),
  };
}
