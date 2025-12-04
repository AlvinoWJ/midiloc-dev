// hooks/toko_existing/useTokoExisting.tsx
"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";

// =========================================================================
// 1. TYPE DEFINITIONS
// =========================================================================

/**
 * Struktur data mentah dari API (snake_case).
 */
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
  progress_kplt_id: string; // ID unik referensi ke progress
}

/**
 * Struktur data untuk UI (View Model).
 * Field disederhanakan dan distandarisasi.
 */
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

/**
 * Metadata Pagination dari API.
 */
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

// =========================================================================
// 2. PAGINATION STRATEGY (AGGRESSIVE PREFETCHING)
// =========================================================================

const UI_PAGE_SIZE = 9; // User melihat 9 item per halaman
const PAGES_PER_BLOCK = 4; // 1 Fetch API = Data untuk 4 Halaman UI
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK; // 36 Item per request

/**
 * Custom Hook: useTokoExisting
 * ----------------------------
 * Mengelola data Toko Existing dengan strategi Block Pagination yang lebih besar.
 * Artinya, ketika user di halaman 1, kita sudah mengambil data sampai halaman 4.
 * Perpindahan halaman 1 -> 2 -> 3 -> 4 akan instan (tanpa loading).
 * Loading baru terjadi saat pindah ke halaman 5 (Block baru).
 */
export function useTokoExisting({
  page = 1,
  search = "",
  month = "",
  year = "",
}: UseTokoExistingProps = {}) {
  // --- 1. BLOCK CALCULATION ---
  // Page 1-4 = Block 0
  // Page 5-8 = Block 1
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

  // Reset cursor saat filter berubah
  useEffect(() => {
    setCursorMap({ 0: "" });
  }, [search, month, year]);

  const cursorForCurrentBlock = cursorMap[currentBlockIndex];
  const shouldFetch = cursorForCurrentBlock !== undefined;

  // --- 2. URL GENERATOR ---
  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();
    // Meminta 36 data sekaligus
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

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiTokoExistingResponse>(createUrl(), {
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  // --- 3. CURSOR UPDATE ---
  // Menyimpan endCursor untuk blok berikutnya
  useEffect(() => {
    if (data?.pagination?.hasNextPage && data?.pagination?.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;
      setCursorMap((prev) => {
        if (prev[nextBlockIndex] === data.pagination.endCursor) return prev;
        return { ...prev, [nextBlockIndex]: data.pagination.endCursor! };
      });
    }
  }, [data, currentBlockIndex]);

  // --- 4. CLIENT-SIDE SLICING ---
  // Karena kita mengambil 36 data (Block), tapi UI hanya butuh 9 (Page),
  // kita harus memotong array (slicing) sesuai halaman yang sedang aktif di dalam blok tersebut.

  // Hitung index halaman relatif dalam blok (0, 1, 2, atau 3)
  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK;

  // Hitung index awal dan akhir slice
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  const fullBlockData = data?.data || [];
  // Ambil hanya 9 item yang relevan untuk halaman ini
  const slicedApiData = fullBlockData.slice(sliceStart, sliceEnd);

  // --- 5. TOTAL PAGES CALCULATION ---
  const apiHasNext = data?.pagination?.hasNextPage ?? false;
  let totalPagesUi = 0;

  if (apiHasNext) {
    // Jika API bilang masih ada next page, asumsikan minimal ada 1 blok penuh lagi
    totalPagesUi = (currentBlockIndex + 2) * PAGES_PER_BLOCK;
  } else {
    // Jika API bilang habis, hitung total halaman berdasarkan sisa data di blok ini
    const pagesInCurrentBlock = Math.ceil(fullBlockData.length / UI_PAGE_SIZE);
    totalPagesUi = currentBlockIndex * PAGES_PER_BLOCK + pagesInCurrentBlock;
  }

  // Fallback minimal 1 halaman
  if (totalPagesUi === 0 && fullBlockData.length > 0) totalPagesUi = 1;
  if (totalPagesUi === 0 && !isLoading) totalPagesUi = 1;

  const uiHasNextPage = page < totalPagesUi;

  // --- 6. DATA MAPPING ---
  // Mengubah data API yang sudah di-slice menjadi format UI
  const tokoData: TokoExistingItem[] = useMemo(() => {
    if (!slicedApiData) return [];

    return slicedApiData.map((item) => {
      return {
        id: item.progress_kplt_id, // Mapping ID
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
    isInitialLoading: isLoading && !data,
    isRefreshing: isValidating,
    isError: !!error,
  };
}
