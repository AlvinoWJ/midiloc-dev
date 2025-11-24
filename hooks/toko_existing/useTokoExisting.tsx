// hooks/toko_existing/useTokoExisting.tsx
"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";

interface ApiTokoExistingItem {
  alamat: string;
  tgl_go: string;
  latitude: number;
  longitude: number;
  awal_sewa: string;
  akhir_sewa: string;
  kode_store: string;
  nama_store: string | null;
  nilai_sewa: number;
  progress_kplt_id: string;
}

export interface TokoExistingItem {
  id: string;
  nama_toko: string;
  alamat: string;
  kode_store: string;
  nilai_sewa: number;
  tgl_go: string;
  awal_sewa: string;
  akhir_sewa: string;
  latitude: number;
  longitude: number;
}

interface Pagination {
  limit: number;
  count: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface ApiTokoExistingResponse {
  success: boolean;
  filters: {
    year: string | null;
    month: string | null;
    search: string | null;
  };
  data: ApiTokoExistingItem[];
  pagination: Pagination;
}

interface UseTokoExistingProps {
  page?: number;
  limit?: number;
  search?: string;
  month?: string;
  year?: string;
}

const UI_PAGE_SIZE = 9; // User melihat 9 item per halaman
const PAGES_PER_BLOCK = 4; // 1 Fetch = 1 Halaman UI
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK;

export function useTokoExisting({
  page = 1,
  search = "",
  month = "",
  year = "",
}: UseTokoExistingProps = {}) {
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

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

    if (search && search.trim() !== "") {
      params.set("search", search.trim());
    }
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    return `/api/ulok_eksisting?${params.toString()}`;
  };

  const { data, error, isLoading } = useSWR<ApiTokoExistingResponse>(
    createUrl(),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (data?.pagination?.hasNextPage && data?.pagination?.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;
      setCursorMap((prev) => {
        if (prev[nextBlockIndex] === data.pagination.endCursor) return prev;
        return { ...prev, [nextBlockIndex]: data.pagination.endCursor! };
      });
    }
  }, [data, currentBlockIndex]);

  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK;
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  const fullBlockData = data?.data || [];
  const slicedApiData = fullBlockData.slice(sliceStart, sliceEnd);

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

  const tokoData: TokoExistingItem[] = useMemo(() => {
    if (!slicedApiData) return [];

    return slicedApiData.map((item) => {
      return {
        id: item.progress_kplt_id,
        nama_toko: item.nama_store || "Toko Tanpa Nama",
        alamat: item.alamat || "-",
        kode_store: item.kode_store,
        nilai_sewa: item.nilai_sewa,
        tgl_go: item.tgl_go,
        awal_sewa: item.awal_sewa,
        akhir_sewa: item.akhir_sewa,
        latitude: item.latitude,
        longitude: item.longitude,
      };
    });
  }, [slicedApiData]);

  return {
    tokoData,
    meta: {
      totalPages: totalPagesUi,
      hasNextPage: uiHasNextPage,
      blockIndex: currentBlockIndex,
    },
    isLoading,
    isError: !!error,
  };
}
