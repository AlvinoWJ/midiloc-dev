"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";

export type UlokEksternal = {
  id: string;
  status_ulok_eksternal: "In Progress" | "OK" | "NOK" | string;
  created_at: string;
  alamat: string;
  nama_pemilik: string;
};

export interface Pagination {
  count: number;
  limit: number;
  endCursor: string | null;
  startCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiUlokEksternalResponse {
  success: boolean;
  data: UlokEksternal[];
  pagination: Pagination;
}

interface UseUlokEksternalProps {
  page?: number;
  search?: string;
  month?: string;
  year?: string;
  activeTab?: string;
}

const UI_PAGE_SIZE = 9; // User melihat 9 item per halaman
const PAGES_PER_BLOCK = 1; // 1 Fetch = 1 Halaman UI
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK;

export function useUlokEksternal({
  page = 1,
  search = "",
  month = "",
  year = "",
  activeTab = "Recent",
}: UseUlokEksternalProps = {}) {
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

  useEffect(() => {
    setCursorMap({ 0: "" });
  }, [search, month, year, activeTab]);

  const cursorForCurrentBlock = cursorMap[currentBlockIndex];

  const shouldFetch = cursorForCurrentBlock !== undefined;

  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();

    params.set("limit", FETCH_BLOCK_SIZE.toString());
    params.set("scope", activeTab.toLowerCase());

    if (cursorForCurrentBlock) {
      params.set("after", cursorForCurrentBlock);
    }

    if (search && search.trim() !== "") {
      params.set("search", search.trim());
    }
    if (month) params.set("month", month);
    if (year) params.set("year", year);
    if (activeTab) params.set("scope", activeTab);

    return `/api/ulok_eksternal?${params.toString()}`;
  };

  const apiUrl = createUrl();

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiUlokEksternalResponse>(apiUrl, {
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  useEffect(() => {
    if (data?.pagination?.hasNextPage && data?.pagination?.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;
      setCursorMap((prev) => {
        if (prev[nextBlockIndex] === data.pagination.endCursor) return prev;
        return { ...prev, [nextBlockIndex]: data.pagination.endCursor! };
      });
    }
  }, [data, currentBlockIndex]);

  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK; // 0, 1, 2, atau 3
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  const fullBlockData = data?.data || [];
  const ulokEksternalData = fullBlockData.slice(sliceStart, sliceEnd);

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

  const hasData = !!data;
  const isInitialLoading = isLoading && !hasData;

  return {
    ulokEksternalData,
    isInitialLoading: isInitialLoading,
    isRefreshing: isValidating,
    ulokEksternalError: error,
    refreshUlok: mutate,
    meta: {
      totalPages: totalPagesUi,
      hasNextPage: uiHasNextPage,
      blockIndex: currentBlockIndex,
    },
  };
}
