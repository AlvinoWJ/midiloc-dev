"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";

/**
 * Tipe untuk objek ULok Eksternal yang diterima dari API.
 */
export type UlokEksternal = {
  id: string;
  status_ulok_eksternal: "In Progress" | "OK" | "NOK" | string;
  created_at: string;
  alamat: string;
  nama_ulok: string;
};

/**
 * Struktur data pagination dari API.
 */
export interface Pagination {
  count: number;
  limit: number;
  endCursor: string | null;
  startCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Response API untuk ULok Eksternal.
 */
interface ApiUlokEksternalResponse {
  success: boolean;
  data: UlokEksternal[];
  pagination: Pagination;
}

/**
 * Parameter opsional untuk hook useUlokEksternal.
 */
interface UseUlokEksternalProps {
  page?: number;
  search?: string;
  month?: string;
  year?: string;
  activeTab?: string;
}

/**
 * Konfigurasi ukuran halaman di UI.
 * UI_PAGE_SIZE = jumlah data per halaman UI.
 * PAGES_PER_BLOCK = jumlah halaman yang digabung dalam 1 call API.
 * FETCH_BLOCK_SIZE = jumlah data yang diminta ke API per blok.
 */
const UI_PAGE_SIZE = 9;
const PAGES_PER_BLOCK = 1;
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK;

/**
 * useUlokEksternal
 * ----------------
 * Hook utama untuk mengambil data ULok Eksternal dengan pagination cursor.
 * Mengelola:
 * - Cursor per blok
 * - Data slicing untuk UI
 * - State paginasi
 * - Revalidasi SWR
 */
export function useUlokEksternal({
  page = 1,
  search = "",
  month = "",
  year = "",
  activeTab = "Recent",
}: UseUlokEksternalProps = {}) {
  /**
   * Menentukan index blok berdasarkan halaman saat ini.
   * Misal page=1 -> block=0, page=5 -> block=1 (jika 4 halaman per block).
   */
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  /**
   * cursorMap menyimpan cursor untuk setiap blok halaman.
   * Format:
   * { 0: "", 1: "cursor_x", 2: "cursor_y", ... }
   */
  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

  /**
   * Ketika search / filter / tab berubah:
   * reset cursor agar fetch dimulai ulang dari awal.
   */
  useEffect(() => {
    setCursorMap({ 0: "" });
  }, [search, month, year, activeTab]);

  /**
   * Cursor untuk blok saat ini.
   */
  const cursorForCurrentBlock = cursorMap[currentBlockIndex];

  /**
   * Hanya fetch jika cursor untuk blok tersedia.
   */
  const shouldFetch = cursorForCurrentBlock !== undefined;

  /**
   * Generate URL ke endpoint API berdasarkan parameter & cursor.
   */
  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();

    // Jumlah data per fetch (per blok)
    params.set("limit", FETCH_BLOCK_SIZE.toString());
    params.set("scope", activeTab.toLowerCase());

    // Cursor "after" untuk fetch blok berikutnya
    if (cursorForCurrentBlock) {
      params.set("after", cursorForCurrentBlock);
    }

    // Filter search
    if (search && search.trim() !== "") {
      params.set("search", search.trim());
    }

    // Filter waktu
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    // Tab aktif
    if (activeTab) params.set("scope", activeTab);

    return `/api/ulok_eksternal?${params.toString()}`;
  };

  /**
   * URL final yang akan digunakan SWR.
   */
  const apiUrl = createUrl();

  /**
   * SWR digunakan untuk fetch, caching, & revalidasi data.
   */
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiUlokEksternalResponse>(apiUrl, {
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  /**
   * Update cursorMap jika API menyediakan cursor untuk halaman berikutnya.
   */
  useEffect(() => {
    if (data?.pagination?.hasNextPage && data?.pagination?.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;
      setCursorMap((prev) => {
        // Hindari update berulang
        if (prev[nextBlockIndex] === data.pagination.endCursor) return prev;
        return { ...prev, [nextBlockIndex]: data.pagination.endCursor! };
      });
    }
  }, [data, currentBlockIndex]);

  /**
   * Menentukan posisi data yang harus ditampilkan berdasarkan page UI.
   */
  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK;
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  /**
   * Data penuh dari blok hasil fetch API, kemudian dipotong untuk UI.
   */
  const fullBlockData = data?.data || [];
  const ulokEksternalData = fullBlockData.slice(sliceStart, sliceEnd);

  /**
   * Hitung total halaman UI berdasarkan:
   * - apakah API masih punya next page
   * - panjang data yang sudah diterima
   */
  const apiHasNext = data?.pagination?.hasNextPage ?? false;
  let totalPagesUi = 0;

  if (apiHasNext) {
    totalPagesUi = (currentBlockIndex + 2) * PAGES_PER_BLOCK;
  } else {
    const pagesInCurrentBlock = Math.ceil(fullBlockData.length / UI_PAGE_SIZE);
    totalPagesUi = currentBlockIndex * PAGES_PER_BLOCK + pagesInCurrentBlock;
  }

  // Safety fallback
  if (totalPagesUi === 0 && fullBlockData.length > 0) totalPagesUi = 1;
  if (totalPagesUi === 0 && !isLoading) totalPagesUi = 1;

  /**
   * Menentukan apakah UI masih punya next page.
   */
  const uiHasNextPage = page < totalPagesUi;

  /**
   * Status loading untuk initial fetch.
   */
  const hasData = !!data;
  const isInitialLoading = isLoading && !hasData;

  /**
   * Return API final dari hook.
   */
  return {
    ulokEksternalData,
    isInitialLoading,
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
