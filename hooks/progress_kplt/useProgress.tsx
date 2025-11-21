"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";

export type ProgressItem = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  kplt: {
    id: string;
    alamat: string | null;
    nama_kplt: string | null;
  } | null;
};

export interface Pagination {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export type ApiProgressResponse = {
  data: ProgressItem[];
  pagination: Pagination;
};

interface UseProgressProps {
  page?: number;
  search?: string;
  month?: string;
  year?: string;
}

const UI_PAGE_SIZE = 9; // item per halaman di UI
const PAGES_PER_BLOCK = 1; // per-block = 2 halaman UI
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK;

export function useProgress({
  page = 1,
  search = "",
  month = "",
  year = "",
}: UseProgressProps = {}) {
  // Hitung block
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  // Map block -> cursor AFTER
  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

  // Reset cursor saat filter berubah
  useEffect(() => {
    setCursorMap({ 0: "" });
  }, [search, month, year]);

  const cursorForCurrentBlock = cursorMap[currentBlockIndex];
  const shouldFetch = cursorForCurrentBlock !== undefined;

  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();
    params.set("limit", FETCH_BLOCK_SIZE.toString());

    if (cursorForCurrentBlock) {
      params.set("after", cursorForCurrentBlock);
    }

    if (search.trim() !== "") params.set("search", search.trim());
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    return `/api/progress?${params.toString()}`;
  };

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiProgressResponse>(createUrl(), {
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  // Simpan cursor untuk block berikutnya
  useEffect(() => {
    if (data?.pagination?.hasNextPage && data.pagination.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;

      setCursorMap((prev) => {
        if (prev[nextBlockIndex] === data.pagination.endCursor) return prev;
        return {
          ...prev,
          [nextBlockIndex]: data.pagination.endCursor!,
        };
      });
    }
  }, [data, currentBlockIndex]);

  // Hitung slice UI
  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK;
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  const fullBlockData = data?.data ?? [];
  const progressData = fullBlockData.slice(sliceStart, sliceEnd);

  // Hitung total pages UI
  const apiHasNext = data?.pagination?.hasNextPage ?? false;
  let totalPagesUi = 0;

  if (apiHasNext) {
    totalPagesUi = (currentBlockIndex + 2) * PAGES_PER_BLOCK;
  } else {
    const pagesInCurrentBlock = Math.ceil(fullBlockData.length / UI_PAGE_SIZE);
    totalPagesUi = currentBlockIndex * PAGES_PER_BLOCK + pagesInCurrentBlock;
  }

  if (totalPagesUi === 0 && fullBlockData.length > 0) totalPagesUi = 1;
  if (totalPagesUi === 0 && !isLoading) totalPagesUi = 1;

  const uiHasNextPage = page < totalPagesUi;

  const isInitialLoading = isLoading && !data;

  return {
    progressData,
    totalPages: totalPagesUi,
    hasNextPage: uiHasNextPage,
    blockIndex: currentBlockIndex,
    isInitialLoading,
    isRefreshing: isValidating,
    isError: !!error,
    error,
    refreshProgress: () => mutate(),
  };
}
