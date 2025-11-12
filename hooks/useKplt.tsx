// hooks/useKplt.tsx
"use client";

import useSWR from "swr";
import {
  ApiKpltResponse,
  KpltExisting,
  UlokForKplt,
  KpltMeta,
} from "@/types/common"; // ✅ pakai tipe global

export function useKplt(searchQuery?: string, activeTab?: string) {
  const buildUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery && searchQuery.trim() !== "") {
      params.set("q", searchQuery.trim());
    }
    if (activeTab === "History") {
      params.set("limit", "1000"); // Ambil 1000 data untuk "History"
    } else {
      // "Recent" tidak dipaginasi, jadi ambil limit yang wajar
      params.set("limit", "500");
    }
    const queryString = params.toString();
    return queryString ? `/api/kplt?${queryString}` : "/api/kplt";
  };

  const { data, error, isLoading, mutate } = useSWR<ApiKpltResponse>(
    // Key SWR sekarang bergantung pada searchQuery dan activeTab
    () => buildUrl(),
    null,
    // --- TAMBAHKAN OPSI INI ---
    { keepPreviousData: true }
  );

  return {
    kpltExisting: data?.kplt_existing ?? ([] as KpltExisting[]),
    ulokForKplt: data?.kplt_from_ulok_ok ?? ([] as UlokForKplt[]),
    isLoading,
    isError: error,
    refreshKplt: () => mutate(),
  };
}
