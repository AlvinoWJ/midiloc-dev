"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import type { CurrentUser } from "@/types/common";

/**
 * KpltPageProps
 * -------------
 * Props yang dikirim ke komponen halaman (UI Layout).
 * Interface ini menjembatani data dari hook `useKplt` ke komponen visual.
 */
export interface KpltPageProps {
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  user: CurrentUser | null;
  displayData: UnifiedKpltItem[];
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  activeTab: string;
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
  onTabChange: (tab: string) => void;
  isLocationSpecialist: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * KpltItem
 * --------
 * Struktur data mentah (Raw Data) yang diterima langsung dari API Backend.
 * Field di sini mungkin null atau undefined tergantung kelengkapan data.
 */
export interface KpltItem {
  id: string;
  nama_kplt?: string;
  nama_ulok?: string;
  alamat: string;
  created_at: string;
  kplt_approval?: string;
  ui_status?: string;
  approval_status?: string;
  latitude: number;
  longitude: number;
  ulok_id?: string;
  file_intip?: string | null;
  form_ukur?: string | null;
  has_form_ukur?: boolean;
  has_file_intip?: boolean;
}

/**
 * UnifiedKpltItem
 * ---------------
 * View Model: Struktur data yang sudah dibersihkan dan distandarisasi untuk UI.
 * Menggabungkan 'nama_kplt'/'nama_ulok' menjadi satu field 'nama',
 * dan menyederhanakan status logic.
 */
export interface UnifiedKpltItem {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string; // Label status untuk display (misal: "Need Input")
  statusKey: "needinput" | "inprogress" | "waitingforum" | "ok" | "nok"; // Key status untuk logic/warna
  has_file_intip: boolean;
  has_form_ukur: boolean;
}

/**
 * Pagination
 * ----------
 * Metadata pagination dari API (Cursor-based).
 */
export interface Pagination {
  limit: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startCursor: string | null;
  endCursor: string | null; // Token penting untuk fetch halaman berikutnya
  count_needinput?: number;
  count_inprogress?: number;
  count_waitingforum?: number;
  count_ok?: number;
  count_nok?: number;
}

/**
 * ApiKpltResponse
 * ---------------
 * Bentuk response JSON lengkap dari endpoint `/api/kplt`.
 * Data dipisah berdasarkan status bucket (needinput, ok, dll).
 */
export interface ApiKpltResponse {
  success: boolean;
  scope: "recent" | "history";
  data: {
    needinput: KpltItem[];
    inprogress: KpltItem[];
    waitingforum: KpltItem[];
    ok: KpltItem[];
    nok: KpltItem[];
  };
  pagination: {
    recent?: Pagination;
    oknok?: Pagination;
  };
}

interface UseKpltProps {
  scope?: "recent" | "history";
  page?: number;
  search?: string;
  month?: string;
  year?: string;
}

// Konfigurasi Pagination
const UI_PAGE_SIZE = 9; // Jumlah kartu yang ditampilkan per halaman di UI
const PAGES_PER_BLOCK = 1; // Berapa halaman UI yang di-fetch dalam satu request API
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK; // Total item yang diminta ke API

/**
 * useKplt Hook
 * ------------
 * Logic inti untuk manajemen data KPLT.
 * Menggabungkan SWR (caching), Cursor-based pagination, dan Filtering.
 */
export function useKplt({
  scope = "recent",
  page = 1,
  search = "",
  month = "",
  year = "",
}: UseKpltProps = {}) {
  // --- 1. LOGIKA BLOCK ---
  // API menggunakan cursor, sementara UI menggunakan nomor halaman (1, 2, 3).
  // Kita mengelompokkan halaman UI ke dalam "Block".
  // Jika PAGES_PER_BLOCK = 1, maka Block 0 = Page 1, Block 1 = Page 2.
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  /**
   * cursorMap
   * ---------
   * Peta untuk menyimpan 'endCursor' dari setiap blok yang sudah diambil.
   * Key: Index Blok, Value: Cursor string.
   * Blok 0 selalu string kosong "" (fetch awal).
   */
  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

  // Reset cursor jika filter berubah (mulai pencarian baru dari awal)
  useEffect(() => {
    setCursorMap({ 0: "" });
  }, [scope, search, month, year]);

  // Ambil cursor untuk blok saat ini.
  const cursorForCurrentBlock = cursorMap[currentBlockIndex];

  // Guard: Jangan fetch jika kita tidak punya cursor untuk blok ini (artinya user lompat halaman terlalu jauh)
  const shouldFetch = cursorForCurrentBlock !== undefined;

  // --- 2. URL GENERATOR ---
  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("limit", FETCH_BLOCK_SIZE.toString());

    // Tambahkan cursor jika bukan halaman pertama
    if (cursorForCurrentBlock) {
      params.set("after", cursorForCurrentBlock);
    }

    if (search && search.trim() !== "") params.set("search", search.trim());
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    return `/api/kplt?${params.toString()}`;
  };

  // --- 3. DATA FETCHING (SWR) ---
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiKpltResponse>(createUrl(), {
      revalidateOnFocus: false, // Jangan refresh otomatis saat tab pindah (hemat resource)
      keepPreviousData: true, // UX: Tampilkan data lama saat loading halaman baru (mencegah flickering)
    });

  // Tentukan pagination object mana yang dipakai berdasarkan tab
  const paginationData =
    scope === "recent" ? data?.pagination?.recent : data?.pagination?.oknok;

  // --- 4. CURSOR PRE-FETCH LOGIC ---
  // Saat data diterima, cek apakah ada halaman selanjutnya.
  // Jika ya, simpan 'endCursor' tersebut untuk Block berikutnya.
  useEffect(() => {
    if (paginationData?.hasNextPage && paginationData?.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;
      setCursorMap((prev) => {
        // Cegah update state berulang jika cursor sama
        if (prev[nextBlockIndex] === paginationData.endCursor) return prev;
        return { ...prev, [nextBlockIndex]: paginationData.endCursor! };
      });
    }
  }, [paginationData, currentBlockIndex]);

  // --- 5. DATA PROCESSING & UNIFICATION ---
  // Mengubah raw data dari API (terpisah-pisah) menjadi satu array list yang bersih.
  const processedData: UnifiedKpltItem[] = useMemo(() => {
    if (!data?.data) return [];

    // Tentukan array mana yang akan digabung berdasarkan Scope
    let rawItems: Array<
      KpltItem & {
        statusKey: "needinput" | "inprogress" | "waitingforum" | "ok" | "nok";
      }
    > = [];

    if (scope === "recent") {
      rawItems = [
        ...(data.data.needinput || []).map((i) => ({
          ...i,
          statusKey: "needinput" as const,
        })),
        ...(data.data.inprogress || []).map((i) => ({
          ...i,
          statusKey: "inprogress" as const,
        })),
        ...(data.data.waitingforum || []).map((i) => ({
          ...i,
          statusKey: "waitingforum" as const,
        })),
      ];
    } else {
      rawItems = [
        ...(data.data.ok || []).map((i) => ({
          ...i,
          statusKey: "ok" as const,
        })),
        ...(data.data.nok || []).map((i) => ({
          ...i,
          statusKey: "nok" as const,
        })),
      ];
    }

    // Mapping ke UnifiedKpltItem
    const unified = rawItems.map((item) => {
      // Normalisasi label status untuk UI
      let status = item.kplt_approval || item.statusKey;

      if (item.statusKey === "needinput") {
        status = "Need Input";
      } else if (item.statusKey === "inprogress") {
        status = "In Progress";
      } else if (item.statusKey === "waitingforum") {
        status = "Waiting For Forum";
      }

      // Normalisasi Nama (Bisa nama KPLT atau nama ULOK)
      const nama =
        item.statusKey === "needinput"
          ? item.nama_ulok || "Unknown ULOK"
          : item.nama_kplt || "Unknown KPLT";

      return {
        id: item.id || item.ulok_id || "",
        nama,
        alamat: item.alamat,
        created_at: item.created_at,
        status,
        statusKey: item.statusKey,
        has_file_intip: item.has_file_intip ?? false,
        has_form_ukur: item.has_form_ukur ?? false,
      } as UnifiedKpltItem;
    });

    // Sorting Client-side (berdasarkan tanggal terbaru)
    return unified.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data, scope]);

  // --- 6. UI PAGINATION SLICING ---
  // Memotong array data untuk ditampilkan sesuai halaman UI saat ini.
  // (Penting jika FETCH_BLOCK_SIZE > UI_PAGE_SIZE)
  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK;
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  const finalDisplayData = processedData.slice(sliceStart, sliceEnd);

  // --- 7. TOTAL PAGES CALCULATION (ESTIMATION) ---
  // Menghitung total halaman yang ditampilkan di tombol pagination.
  // Karena API cursor-based tidak selalu tahu total pasti, kita melakukan estimasi cerdas.
  const apiHasNext = paginationData?.hasNextPage ?? false;
  let totalPagesUi = 0;

  if (apiHasNext) {
    // Jika API bilang masih ada data, kita asumsikan setidaknya ada 1 blok lagi di depan.
    totalPagesUi = (currentBlockIndex + 2) * PAGES_PER_BLOCK;
  } else {
    // Jika API bilang habis, hitung sisa halaman di blok saat ini.
    const pagesInCurrentBlock = Math.ceil(processedData.length / UI_PAGE_SIZE);
    totalPagesUi = currentBlockIndex * PAGES_PER_BLOCK + pagesInCurrentBlock;
  }

  // Fallback minimal 1 halaman
  if (totalPagesUi === 0 && processedData.length > 0) totalPagesUi = 1;
  if (totalPagesUi === 0 && !isLoading) totalPagesUi = 1;

  const uiHasNextPage = page < totalPagesUi;

  return {
    kpltData: finalDisplayData,
    isInitialLoading: isLoading && !data,
    isRefreshing: isValidating, // True saat SWR melakukan revalidation di background
    isError: error,
    refresh: mutate,
    meta: {
      totalPages: totalPagesUi,
      hasNextPage: uiHasNextPage,
      blockIndex: currentBlockIndex,
      totalItemsInBlock: processedData.length,
    },
  };
}
