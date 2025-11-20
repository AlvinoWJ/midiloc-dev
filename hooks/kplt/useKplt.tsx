"use client";

import useSWR from "swr";
import { useState, useEffect, useRef, useMemo } from "react";
import type { CurrentUser } from "@/types/common";

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
  const url = useMemo(() => {
    const params = new URLSearchParams();

    params.set("scope", scope);
    params.set("limit", String(limit));

    if (search && search.trim() !== "") params.set("q", search.trim());
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    const decodeCursor = (cursor: Cursor | undefined, prefix: string) => {
      if (!cursor?.endCursor) return;
      try {
        const decoded = JSON.parse(atob(cursor.endCursor));
        params.set(`after${prefix}At`, decoded.created_at);
        params.set(`after${prefix}Id`, decoded.id);
      } catch (e) {
        console.error("Failed to decode cursor:", e);
      }
    };

    decodeCursor(cursorNeedinput, "NeedInput");
    decodeCursor(cursorInprogress, "InProgress");
    decodeCursor(cursorOk, "Ok");
    decodeCursor(cursorNok, "Nok");

    return `/api/kplt?${params.toString()}`;
  }, [
    scope,
    search,
    month,
    year,
    limit,
    cursorNeedinput?.endCursor,
    cursorInprogress?.endCursor,
    cursorOk?.endCursor,
    cursorNok?.endCursor,
  ]);

  // === FETCH SWR ===
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiKpltResponse>(url, {
      revalidateOnFocus: false,
      keepPreviousData: true,
    });

  const showSkeleton = !data && isLoading;

  const isInitialLoading = isLoading && !data;
  const isRefreshing = isValidating;

  // ========== SAFE: buat pagination fallback supaya KPLTPage tidak error ==========
  // Jika API mengembalikan pagination, pakai itu. Jika tidak, kita buat struktur
  // pagination "kosong" / dummy supaya kode yang mengakses pagination.* tidak crash.
  const makeEmptyCursor = (): Cursor => ({
    startCursor: null,
    endCursor: null,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const emptyPaginationGroup = (): PaginationGroup => ({
    limit,
    cursor: makeEmptyCursor(),
  });

  // Jika server belum mengirim pagination (atau salah format), gunakan fallback
  const safePagination = useMemo(() => {
    if (data?.pagination) {
      return {
        needinput: data.pagination.needinput ?? emptyPaginationGroup(),
        inprogress: data.pagination.inprogress ?? emptyPaginationGroup(),
        ok: data.pagination.ok ?? emptyPaginationGroup(),
        nok: data.pagination.nok ?? emptyPaginationGroup(),
      };
    }

    // ----------------------------------------------------------
    // DUMMY PAGINATION SEMENTARA
    // ----------------------------------------------------------
    // Tujuan: mencegah error saat kode lain mengakses pagination.ok.cursor dll.
    // Nanti ketika API mengembalikan `pagination` / `count`, cukup gunakan data.api.
    // ----------------------------------------------------------
    const dummyHasNext =
      // jika scope === history, kita beri kemungkinan next page true jika ingin
      scope === "history" ? false : false;

    const cursorWithDummyNext: Cursor = {
      startCursor: null,
      endCursor: null,
      hasNextPage: dummyHasNext,
      hasPrevPage: false,
    };

    const group: PaginationGroup = {
      limit,
      cursor: cursorWithDummyNext,
    };

    return {
      needinput: group,
      inprogress: group,
      ok: group,
      nok: group,
    };
  }, [data?.pagination, limit, scope]);

  // ========== KEMBALIKAN SEMUA FIELD (compatible dengan KPLTPage) ==========
  return {
    // data per status - jangan dihapus karena KPLTPage memakainya
    needinput: data?.data.needinput ?? [],
    inprogress: data?.data.inprogress ?? [],
    ok: data?.data.ok ?? [],
    nok: data?.data.nok ?? [],

    // pagination (aman) -- KPLTPage mengakses pagination.ok.cursor dsb
    pagination: safePagination,

    // status loading & error
    isInitialLoading,
    isRefreshing,
    isError: error,
    showSkeleton,

    // fungsi refresh yang dipakai KPLTPage
    refresh: () => mutate(),
  };
}
