"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";

// =========================================================================
// 1. TYPE DEFINITIONS
// =========================================================================

/**
 * Representasi data Progress KPLT dari API.
 */
export type ProgressItem = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  // Relasi ke data KPLT
  kplt: {
    id: string;
    alamat: string | null;
    nama_kplt: string | null;
  } | null;
};

/**
 * Metadata Pagination dari API (Cursor-based).
 */
export interface Pagination {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startCursor: string | null;
  endCursor: string | null; // Token untuk fetch halaman berikutnya
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

// =========================================================================
// 2. CONFIGURATION
// =========================================================================

const UI_PAGE_SIZE = 9; // Jumlah item yang ditampilkan per halaman di UI
const PAGES_PER_BLOCK = 1; // Jumlah halaman UI yang di-fetch dalam satu request API
// Total item yang diminta ke backend dalam satu call
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK;

/**
 * Custom Hook: useProgress
 * ------------------------
 * Mengelola pengambilan data Progress dengan strategi:
 * 1. Mapping Page Number (UI) ke Cursor Token (API).
 * 2. Caching data menggunakan SWR.
 * 3. Estimasi total halaman untuk navigasi UI.
 */
export function useProgress({
  page = 1,
  search = "",
  month = "",
  year = "",
}: UseProgressProps = {}) {
  // --- 1. BLOCK CALCULATION ---
  // Mengkonversi nomor halaman UI (1, 2, 3) menjadi indeks blok API (0, 1, 2).
  // Jika PAGES_PER_BLOCK = 1, maka Page 1 = Block 0.
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  // --- 2. CURSOR MANAGEMENT ---
  // Menyimpan mapping: Index Blok -> Cursor String untuk mengambil blok tersebut.
  // Block 0 selalu dimulai dengan cursor kosong ("").
  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

  // Reset cursor map jika filter pencarian berubah (karena urutan data berubah total).
  useEffect(() => {
    setCursorMap({ 0: "" });
  }, [search, month, year]);

  // Ambil cursor untuk blok saat ini
  const cursorForCurrentBlock = cursorMap[currentBlockIndex];

  // Guard: Jangan fetch jika kita tidak punya cursor untuk blok ini (user lompat terlalu jauh).
  const shouldFetch = cursorForCurrentBlock !== undefined;

  // --- 3. URL GENERATOR ---
  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();
    params.set("limit", FETCH_BLOCK_SIZE.toString());

    // Tambahkan cursor 'after' jika bukan halaman pertama
    if (cursorForCurrentBlock) {
      params.set("after", cursorForCurrentBlock);
    }

    if (search.trim() !== "") params.set("search", search.trim());
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    return `/api/progress?${params.toString()}`;
  };

  // --- 4. DATA FETCHING (SWR) ---
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiProgressResponse>(createUrl(), {
      revalidateOnFocus: false, // Hemat resource
      keepPreviousData: true, // UX: Tampilkan data lama saat loading halaman baru
    });

  // --- 5. NEXT CURSOR PRE-FETCH ---
  // Jika data berhasil diambil dan API memberitahu ada halaman selanjutnya,
  // simpan 'endCursor' tersebut untuk Block berikutnya (currentBlockIndex + 1).
  useEffect(() => {
    if (data?.pagination?.hasNextPage && data.pagination.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;

      setCursorMap((prev) => {
        // Hindari update state berulang jika cursor sudah sama
        if (prev[nextBlockIndex] === data.pagination.endCursor) return prev;
        return {
          ...prev,
          [nextBlockIndex]: data.pagination.endCursor!,
        };
      });
    }
  }, [data, currentBlockIndex]);

  // --- 6. DATA SLICING ---
  // Memotong data array dari API agar sesuai dengan halaman UI saat ini.
  // (Penting jika PAGES_PER_BLOCK > 1)
  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK;
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  const fullBlockData = data?.data ?? [];
  const progressData = fullBlockData.slice(sliceStart, sliceEnd);

  // --- 7. TOTAL PAGES ESTIMATION ---
  // Menghitung total halaman untuk komponen Pagination UI.
  const apiHasNext = data?.pagination?.hasNextPage ?? false;
  let totalPagesUi = 0;

  if (apiHasNext) {
    // Jika API bilang masih ada data, asumsikan minimal ada 1 blok lagi.
    totalPagesUi = (currentBlockIndex + 2) * PAGES_PER_BLOCK;
  } else {
    // Jika API bilang habis, hitung total halaman berdasarkan data yang sudah ada.
    const pagesInCurrentBlock = Math.ceil(fullBlockData.length / UI_PAGE_SIZE);
    totalPagesUi = currentBlockIndex * PAGES_PER_BLOCK + pagesInCurrentBlock;
  }

  // Fallback: Minimal 1 halaman
  if (totalPagesUi === 0 && fullBlockData.length > 0) totalPagesUi = 1;
  if (totalPagesUi === 0 && !isLoading) totalPagesUi = 1;

  // Cek apakah tombol "Next" di UI harus aktif
  const uiHasNextPage = page < totalPagesUi;

  const isInitialLoading = isLoading && !data;

  return {
    progressData,
    totalPages: totalPagesUi,
    hasNextPage: uiHasNextPage,
    blockIndex: currentBlockIndex,
    isInitialLoading,
    isRefreshing: isValidating, // Loading background saat filter berubah
    isError: !!error,
    error,
    refreshProgress: () => mutate(), // Fungsi refresh manual
  };
}
