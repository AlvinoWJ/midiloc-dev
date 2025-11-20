// alvinowj/midiloc-dev/midiloc-dev-f3ec6234046d2cde8d53a52c54de62357e01b6cb/hooks/kplt/useKplt.tsx
"use client";

import useSWR from "swr";
import { useState, useEffect, useRef } from "react";
import type { CurrentUser } from "@/types/common";

// ====== TIPE DATA DARI API RESPONSE BARU ======

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

// ====== TIPE DATA UNTUK UI (DIPERTAHANKAN) ======

// Tipe data terpadu untuk ditampilkan di card UI
export interface UnifiedKpltItem {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string;
  has_file_intip: boolean;
  has_form_ukur: boolean;
}

// Tipe untuk props halaman KPLT
export interface KpltPageProps {
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  user: CurrentUser | null;

  // Kirim data yang sudah digabung dan difilter
  displayData: UnifiedKpltItem[];

  // State UI
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  activeTab: string;

  // Handler
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
  onTabChange: (tab: string) => void;
  isLocationSpecialist: () => boolean;

  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// ====== LOGIKA HOOK useKplt (DARI PENGGUNA) ======

interface UseKpltProps {
  scope?: "recent" | "history";
  search?: string;
  month?: string;
  year?: string;
  limit?: number;

  cursorNeedinput?: Cursor;
  cursorInprogress?: Cursor;
  cursorOk?: Cursor;
  cursorNok?: Cursor;
}

export function useKplt({
  scope = "recent",
  search,
  month,
  year,
  limit = 9,

  cursorNeedinput,
  cursorInprogress,
  cursorOk,
  cursorNok,
}: UseKpltProps = {}) {
  const buildUrl = () => {
    const params = new URLSearchParams();

    params.set("scope", scope);
    params.set("limit", String(limit));

    if (search && search.trim() !== "") params.set("q", search.trim());
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    // Cursor Need Input
    if (cursorNeedinput?.endCursor) {
      const decoded = JSON.parse(atob(cursorNeedinput.endCursor));
      params.set("afterNeedInputAt", decoded.created_at);
      params.set("afterNeedInputId", decoded.id);
    }

    // Cursor In Progress
    if (cursorInprogress?.endCursor) {
      const decoded = JSON.parse(atob(cursorInprogress.endCursor));
      params.set("afterInProgressAt", decoded.created_at);
      params.set("afterInProgressId", decoded.id);
    }

    // Cursor OK
    if (cursorOk?.endCursor) {
      const decoded = JSON.parse(atob(cursorOk.endCursor));
      params.set("afterOkAt", decoded.created_at);
      params.set("afterOkId", decoded.id);
    }

    // Cursor NOK
    if (cursorNok?.endCursor) {
      const decoded = JSON.parse(atob(cursorNok.endCursor));
      params.set("afterNokAt", decoded.created_at);
      params.set("afterNokId", decoded.id);
    }

    return `/api/kplt?${params.toString()}`;
  };

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiKpltResponse>(buildUrl, {
      keepPreviousData: true,
    });

  const firstLoad = useRef(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (data) {
      firstLoad.current = false;
      setShowSkeleton(false);
    } else if (firstLoad.current && isLoading) {
      setShowSkeleton(true);
    }
  }, [data, isLoading]);

  const hasData =
    data &&
    (data.data.needinput.length > 0 ||
      data.data.inprogress.length > 0 ||
      data.data.ok.length > 0 ||
      data.data.nok.length > 0);

  const isRefreshing = isValidating && hasData && !showSkeleton;

  return {
    needinput: data?.data.needinput ?? [],
    inprogress: data?.data.inprogress ?? [],
    ok: data?.data.ok ?? [],
    nok: data?.data.nok ?? [],

    pagination: data?.pagination,

    isLoading,
    isError: error,
    showSkeleton,
    isRefreshing,
    refresh: () => mutate(),
  };
}
