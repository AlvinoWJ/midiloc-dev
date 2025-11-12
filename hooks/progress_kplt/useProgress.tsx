"use client";

import useSWR from "swr";

export type ProgressItem = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  kplt_id: {
    id: string;
    alamat: string | null;
  } | null;
  kplt_nama: string | null;
};

export type ProgressMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type ApiProgressResponse = {
  data: ProgressItem[];
  pagination: ProgressMeta;
};

interface UseProgressProps {
  page?: number;
  limit?: number;
  search?: string;
  month?: string;
  year?: string;
}

export function useProgress({
  page = 1,
  limit = 9,
  search = "",
  month = "",
  year = "",
}: UseProgressProps = {}) {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (search) params.append("search", search);
  if (month) params.append("month", month);
  if (year) params.append("year", year);

  const key = `/api/progress?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ApiProgressResponse>(key, {
    keepPreviousData: true,
  });

  return {
    progressData: data?.data ?? [],
    meta: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    refreshProgress: () => mutate(),
  };
}
