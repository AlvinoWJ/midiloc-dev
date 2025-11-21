"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import type { CurrentUser } from "@/types/common";

// Tipe untuk props halaman KPLT
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
  isLocationSpecialist: () => boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

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
  files_ok?: boolean;
  ulok_id?: string;
}

export interface UnifiedKpltItem {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string;
  statusKey: "needinput" | "inprogress" | "ok" | "nok";
  has_file_intip: boolean;
  has_form_ukur: boolean;
}

export interface Cursor {
  startCursor: string | null;
  endCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationGroup {
  limit: number;
  cursor: Cursor;
}

export interface ApiKpltResponse {
  success: boolean;
  scope: string;
  data: {
    needinput: KpltItem[];
    inprogress: KpltItem[];
    ok: KpltItem[];
    nok: KpltItem[];
  };
  pagination: {
    needinput: PaginationGroup;
    inprogress: PaginationGroup;
    ok: PaginationGroup;
    nok: PaginationGroup;
  };
}

interface UseKpltProps {
  scope?: "recent" | "history";
  page?: number;
  search?: string;
  month?: string;
  year?: string;
}

const UI_PAGE_SIZE = 2; // User melihat 9 item per halaman
const PAGES_PER_BLOCK = 1; // 4 Halaman UI per 1 Fetch API
const FETCH_BLOCK_SIZE = UI_PAGE_SIZE * PAGES_PER_BLOCK;

export function useKplt({
  scope = "recent",
  page = 1,
  search = "",
  month = "",
  year = "",
}: UseKpltProps = {}) {
  const currentBlockIndex = Math.floor((page - 1) / PAGES_PER_BLOCK);

  const [cursorMap, setCursorMap] = useState<
    Record<number, { ok: string; nok: string }>
  >({
    0: { ok: "", nok: "" },
  });

  useEffect(() => {
    setCursorMap({ 0: { ok: "", nok: "" } });
  }, [scope, search, month, year]);

  const cursorForCurrentBlock = cursorMap[currentBlockIndex];

  const shouldFetch = cursorForCurrentBlock !== undefined;

  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();
    params.set("scope", scope);

    const limit = scope === "recent" ? "100" : FETCH_BLOCK_SIZE.toString();

    if (scope === "recent") {
      params.set("limitNeedInput", limit);
      params.set("limitInProgress", limit);
    } else {
      params.set("limitOk", limit);
      params.set("limitNok", limit);

      params.set("afterOk", cursorForCurrentBlock?.ok ?? "");
      params.set("afterNok", cursorForCurrentBlock?.nok ?? "");
    }

    if (search && search.trim() !== "") params.set("q", search.trim());
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    return `/api/kplt?${params.toString()}`;
  };

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiKpltResponse>(createUrl(), {
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  useEffect(() => {
    // Pastikan kita ada di tab History dan data pagination tersedia
    if (scope === "history" && data?.pagination) {
      const nextBlockIndex = currentBlockIndex + 1;

      const okPagination = data.pagination.ok;
      const nokPagination = data.pagination.nok;

      // Cek apakah ada halaman selanjutnya (Logic dari useUlok)
      const okHasNext = okPagination?.cursor?.hasNextPage ?? false;
      const nokHasNext = nokPagination?.cursor?.hasNextPage ?? false;

      // Jika setidaknya SATU stream masih punya data, kita siapkan cursor untuk blok berikutnya
      if (okHasNext || nokHasNext) {
        setCursorMap((prev) => {
          // Ambil cursor yang kita gunakan untuk memanggil blok saat ini (sebagai cadangan)
          const currentCursor = prev[currentBlockIndex] || { ok: "", nok: "" };

          // --- LOGIKA PENTING ---
          // 1. Jika stream masih ada (hasNext = true), pakai endCursor baru dari API.
          // 2. Jika stream habis (hasNext = false), API mungkin kirim endCursor = null.
          //    JANGAN ubah jadi "" (string kosong), karena itu akan me-reset ke awal.
          //    Tetap gunakan 'currentCursor' (cursor terakhir) agar API mencari "setelah data terakhir" (hasilnya kosong, bukan reset).

          const nextOkCursor =
            okPagination?.cursor?.endCursor ?? currentCursor.ok;
          const nextNokCursor =
            nokPagination?.cursor?.endCursor ?? currentCursor.nok;

          // Cek duplikasi state agar tidak re-render berulang (Logic dari useUlok)
          const existingNext = prev[nextBlockIndex];
          if (
            existingNext &&
            existingNext.ok === nextOkCursor &&
            existingNext.nok === nextNokCursor
          ) {
            return prev;
          }

          // Update state untuk blok berikutnya
          return {
            ...prev,
            [nextBlockIndex]: {
              ok: nextOkCursor,
              nok: nextNokCursor,
            },
          };
        });
      }
    }
  }, [data, currentBlockIndex, scope]);

  const processedData: UnifiedKpltItem[] = useMemo(() => {
    if (!data?.data) return [];

    let rawItems: Array<
      KpltItem & { statusKey: "needinput" | "inprogress" | "ok" | "nok" }
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

    const unified = rawItems.map((item) => {
      const status =
        item.statusKey === "needinput"
          ? "Need Input"
          : item.kplt_approval || item.statusKey;

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
        has_file_intip: item.files_ok ?? false,
        has_form_ukur: false,
      } as UnifiedKpltItem;
    });

    return unified.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data, scope]);

  let finalDisplayData = processedData;
  let totalPagesUi = 1;
  let uiHasNextPage = false;

  if (scope === "history") {
    const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK; // 0, 1, 2, 3
    const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
    const sliceEnd = sliceStart + UI_PAGE_SIZE;

    finalDisplayData = processedData.slice(sliceStart, sliceEnd);

    const apiHasNext =
      (data?.pagination?.ok?.cursor?.hasNextPage ||
        data?.pagination?.nok?.cursor?.hasNextPage) ??
      false;

    if (apiHasNext) {
      totalPagesUi = (currentBlockIndex + 2) * PAGES_PER_BLOCK;
    } else {
      const pagesInCurrentBlock = Math.ceil(
        processedData.length / UI_PAGE_SIZE
      );
      totalPagesUi = currentBlockIndex * PAGES_PER_BLOCK + pagesInCurrentBlock;
    }

    if (totalPagesUi === 0) totalPagesUi = 1;
    uiHasNextPage = page < totalPagesUi;
  } else {
    totalPagesUi = 1;
    uiHasNextPage = false;
  }

  return {
    kpltData: finalDisplayData,
    isInitialLoading: isLoading && !data,
    isRefreshing: isValidating,
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
