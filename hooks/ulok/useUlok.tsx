"use client";

import useSWR from "swr";
import type { AppUser } from "../useUser";

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

interface UseUlokProps {
  page?: number;
  limit?: number;
  search?: string;
  month?: string;
  year?: string;
  activeTab?: string;
}

export function useUlok({
  page = 1,
  limit = 9,
  search = "",
  month = "",
  year = "",
  activeTab = "Recent",
}: UseUlokProps = {}) {
  const createUrl = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    if (search && search.trim() !== "") {
      params.set("search", search.trim());
    }
    if (month) params.set("month", month);
    if (year) params.set("year", year);
    if (activeTab) params.set("tab", activeTab);

    return `/api/ulok?${params.toString()}`;
  };

  const apiUrl = createUrl();

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiUlokResponse>(apiUrl, {
      keepPreviousData: true,
    });

  const hasData = !!data;
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isValidating && hasData;

  return {
    ulokData: data?.data ?? [],
    isInitialLoading: isInitialLoading,
    meta: data?.pagination,
    isRefreshing: isRefreshing,
    ulokError: error,
    refreshUlok: () => mutate(),
  };
}
