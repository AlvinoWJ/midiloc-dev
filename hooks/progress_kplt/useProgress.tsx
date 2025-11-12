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
  limit: number;
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
  search?: string;
  month?: string;
  year?: string;
}

export function useProgress({
  page = 1,
  perPage = 9,
  search = "",
  month = "",
  year = "",
}: UseProgressProps = {}) {
  const params = new URLSearchParams();
  params.append("page", "1");
  params.append("limit", "100");

  if (search) params.append("search", search);
  if (month) params.append("month", month);
  if (year) params.append("year", year);

  const key = `/api/progress?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ApiProgressResponse>(key, {
    keepPreviousData: true,
  });

  const allData = data?.data ?? [];
  const total = allData.length;
  const totalPages = Math.ceil(total / perPage);

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedData = allData.slice(start, end);

  return {
    progressData: paginatedData,
    meta: {
      page,
      limit: 100,
      per_page: perPage,
      total,
      total_pages: totalPages,
    },
    isLoading,
    isError: !!error,
    error,
    refreshProgress: () => mutate(),
  };
}
