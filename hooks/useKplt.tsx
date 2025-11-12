"use client";

import useSWR from "swr";
import { ApiKpltResponse, KpltExisting, UlokForKplt } from "@/types/common";
import { useState, useEffect, useRef } from "react";

export function useKplt(searchQuery?: string, activeTab?: string) {
  const buildUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery && searchQuery.trim() !== "") {
      params.set("q", searchQuery.trim());
    }
    if (activeTab === "History") {
      params.set("limit", "5"); // Ambil 1000 data untuk "History"
    } else {
      params.set("limit", "500");
    }
    const queryString = params.toString();
    return queryString ? `/api/kplt?${queryString}` : "/api/kplt";
  };

  const { data, error, isLoading, mutate } = useSWR<ApiKpltResponse>(
    () => buildUrl(),
    {
      keepPreviousData: true, // ✅ tetap pertahankan data lama saat fetching baru
    }
  );

  // ✅ logika untuk kontrol skeleton
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

  return {
    kpltExisting: data?.kplt_existing ?? ([] as KpltExisting[]),
    ulokForKplt: data?.kplt_from_ulok_ok ?? ([] as UlokForKplt[]),
    isLoading,
    isError: error,
    showSkeleton, // ✅ tambahkan properti ini agar bisa dikontrol di layout
    refreshKplt: () => mutate(),
  };
}
