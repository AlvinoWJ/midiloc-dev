"use client";

import useSWR from "swr";

export type ProgressItem = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  kplt_id: {
    id: string;
    nama_kplt: string | null;
    alamat: string | null;
  } | null;
};

export type ProgressMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type ApiProgressResponse = {
  data: ProgressItem[];
  meta: ProgressMeta;
};

interface UseProgressProps {
  page?: number;
  perPage?: number;
}

export function useProgress({ page = 1, perPage = 10 }: UseProgressProps = {}) {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("per_page", String(perPage));

  const key = `/api/progress?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ApiProgressResponse>(key, {
    keepPreviousData: true,
  });

  return {
    progressData: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isError: !!error,
    error,
    refreshProgress: () => mutate(),
  };
}
