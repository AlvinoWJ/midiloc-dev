"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";

// =========================================================================
// 1. TYPE DEFINITIONS
// =========================================================================

/**
 * Struktur data Usulan Lokasi (ULOK) dari API.
 */
export type Ulok = {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string; // Status persetujuan (Draft, Approved, Rejected)
  latitude: string;
  longitude: string;
};

/**
 * Metadata Pagination Cursor.
 * startCursor & endCursor digunakan sebagai token navigasi.
 */
export interface Pagination {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface ApiUlokResponse {
  success: boolean;
  data: Ulok[];
  pagination: Pagination;
}

/**
 * Props untuk Hook useUlok.
 * Mendukung filter pencarian, waktu, dan tab scope (Recent/History).
 */
interface UseUlokProps {
  page?: number;
  limit?: number;
  search?: string;
  month?: string;
  year?: string;
  activeTab?: string; // "Recent" | "History"
}

// =========================================================================
// 2. CONFIGURATION
// =========================================================================

const UI_PAGE_SIZE = 9; // Jumlah kartu per halaman di UI
const PAGES_PER_BLOCK = 1; // Jumlah halaman UI dalam 1 kali request API
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK;

/**
 * Custom Hook: useUlok
 * --------------------
 * Mengelola data fetching untuk daftar Usulan Lokasi.
 * Menggunakan strategi blok untuk menangani pagination cursor.
 */
export function useUlok({
  page = 1,
  search = "",
  month = "",
  year = "",
  activeTab = "Recent",
}: UseUlokProps = {}) {
  // --- 1. BLOCK CALCULATION ---
  // Mengubah nomor halaman (1, 2, 3) menjadi index blok API (0, 1, 2).
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  // --- 2. CURSOR MANAGEMENT ---
  // Menyimpan mapping: Index Blok -> Cursor Token.
  // Ini memungkinkan kita kembali ke halaman sebelumnya tanpa kehilangan referensi cursor.
  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

  // Reset cursor saat filter berubah (karena urutan data berubah total)
  useEffect(() => {
    setCursorMap({ 0: "" });
  }, [search, month, year, activeTab]);

  const cursorForCurrentBlock = cursorMap[currentBlockIndex];

  // Guard: Jangan fetch jika cursor untuk blok ini belum diketahui (user lompat halaman)
  const shouldFetch = cursorForCurrentBlock !== undefined;

  // --- 3. URL GENERATOR ---
  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();

    params.set("limit", FETCH_BLOCK_SIZE.toString());
    // Mapping tab UI ke parameter scope API (misal: "Recent" -> "recent")
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

    return `/api/ulok?${params.toString()}`;
  };

  // --- 4. DATA FETCHING (SWR) ---
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiUlokResponse>(createUrl(), {
      revalidateOnFocus: false, // Hemat bandwidth
      keepPreviousData: true, // UX: Smooth transition antar halaman
    });

  // --- 5. CURSOR PRESERVATION ---
  // Jika API memberikan kursor untuk halaman berikutnya, simpan untuk Blok selanjutnya.
  useEffect(() => {
    if (data?.pagination?.hasNextPage && data?.pagination?.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;
      setCursorMap((prev) => {
        if (prev[nextBlockIndex] === data.pagination.endCursor) return prev;
        return { ...prev, [nextBlockIndex]: data.pagination.endCursor! };
      });
    }
  }, [data, currentBlockIndex]);

  // --- 6. DATA SLICING ---
  // Memotong data array agar sesuai dengan halaman UI saat ini.
  // (Saat ini 1:1 karena PAGES_PER_BLOCK = 1, tapi siap untuk scaling).
  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK;
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  const fullBlockData = data?.data || [];
  const ulokData = fullBlockData.slice(sliceStart, sliceEnd);

  // --- 7. TOTAL PAGES ESTIMATION ---
  // Menghitung estimasi total halaman untuk komponen Pagination UI.
  const apiHasNext = data?.pagination?.hasNextPage ?? false;
  let totalPagesUi = 0;

  if (apiHasNext) {
    // Jika ada halaman berikutnya di API, asumsikan minimal ada 1 blok lagi di depan.
    totalPagesUi = (currentBlockIndex + 2) * PAGES_PER_BLOCK;
  } else {
    // Jika tidak ada lagi, hitung total berdasarkan data yang sudah diterima.
    const pagesInCurrentBlock = Math.ceil(fullBlockData.length / UI_PAGE_SIZE);
    totalPagesUi = currentBlockIndex * PAGES_PER_BLOCK + pagesInCurrentBlock;
  }

  // Fallback: Selalu tampilkan minimal 1 halaman
  if (totalPagesUi === 0 && fullBlockData.length > 0) totalPagesUi = 1;
  if (totalPagesUi === 0 && !isLoading) totalPagesUi = 1;

  // Cek apakah tombol "Next" di UI harus aktif
  const uiHasNextPage = page < totalPagesUi;

  return {
    ulokData,
    isInitialLoading: isLoading && !data,
    isRefreshing: isValidating, // Indikator loading background (revalidasi)
    ulokError: error,
    refreshUlok: mutate, // Fungsi untuk refresh manual
    meta: {
      totalPages: totalPagesUi,
      hasNextPage: uiHasNextPage,
      blockIndex: currentBlockIndex,
    },
  };
}
