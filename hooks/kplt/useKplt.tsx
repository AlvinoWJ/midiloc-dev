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
  ulok_id?: string;
  file_intip?: string | null;
  form_ukur?: string | null;
  has_form_ukur?: boolean;
  has_file_intip?: boolean;
}

export interface UnifiedKpltItem {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string;
  statusKey: "needinput" | "inprogress" | "waitingforum" | "ok" | "nok";
  has_file_intip: boolean;
  has_form_ukur: boolean;
}

export interface Pagination {
  limit: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  // Count spesifik per scope
  count_needinput?: number;
  count_inprogress?: number;
  count_waitingforum?: number;
  count_ok?: number;
  count_nok?: number;
}

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

const UI_PAGE_SIZE = 9; // User melihat 9 item per halaman
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

  const [cursorMap, setCursorMap] = useState<Record<number, string>>({ 0: "" });

  useEffect(() => {
    setCursorMap({ 0: "" });
  }, [scope, search, month, year]);

  const cursorForCurrentBlock = cursorMap[currentBlockIndex];
  const shouldFetch = cursorForCurrentBlock !== undefined;

  const createUrl = () => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("limit", FETCH_BLOCK_SIZE.toString());

    if (cursorForCurrentBlock) {
      params.set("after", cursorForCurrentBlock);
    }

    if (search && search.trim() !== "") params.set("search", search.trim());
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    return `/api/kplt?${params.toString()}`;
  };

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiKpltResponse>(createUrl(), {
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  const paginationData =
    scope === "recent" ? data?.pagination?.recent : data?.pagination?.oknok;

  useEffect(() => {
    if (paginationData?.hasNextPage && paginationData?.endCursor) {
      const nextBlockIndex = currentBlockIndex + 1;
      setCursorMap((prev) => {
        if (prev[nextBlockIndex] === paginationData.endCursor) return prev;
        return { ...prev, [nextBlockIndex]: paginationData.endCursor! };
      });
    }
  }, [paginationData, currentBlockIndex]);

  const processedData: UnifiedKpltItem[] = useMemo(() => {
    if (!data?.data) return [];

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

    const unified = rawItems.map((item) => {
      let status = item.kplt_approval || item.statusKey;

      if (item.statusKey === "needinput") {
        status = "Need Input";
      } else if (item.statusKey === "inprogress") {
        status = "In Progress";
      } else if (item.statusKey === "waitingforum") {
        status = "Waiting For Forum";
      }

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

    return unified.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data, scope]);

  const pageIndexInBlock = (page - 1) % PAGES_PER_BLOCK; // 0, 1, 2, 3
  const sliceStart = pageIndexInBlock * UI_PAGE_SIZE;
  const sliceEnd = sliceStart + UI_PAGE_SIZE;

  const finalDisplayData = processedData.slice(sliceStart, sliceEnd);

  const apiHasNext = paginationData?.hasNextPage ?? false;
  let totalPagesUi = 0;

  if (apiHasNext) {
    // Jika API bilang masih ada data setelah block ini, kita asumsikan setidaknya ada 1 block penuh lagi
    totalPagesUi = (currentBlockIndex + 2) * PAGES_PER_BLOCK;
  } else {
    // Jika tidak ada next page dari API, total halaman = halaman yg sudah lewat + sisa halaman di block ini
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
