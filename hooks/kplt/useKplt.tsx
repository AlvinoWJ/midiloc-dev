"use client";

import useSWR from "swr";
import { useState, useEffect, useRef } from "react";

export interface KpltExisting {
  id: string;
  nama_kplt: string;
  alamat: string;
  created_at: string;
  kplt_approval: string;
  latitude: string;
  longitude: string;
  ulok_id: string;
  has_file_intip?: boolean;
  has_form_ukur?: boolean;
}

export interface UlokForKplt {
  id: string;
  ulok_id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  ui_status: string;
  approval_status: string;
  latitude: string;
  longitude: string;
  has_file_intip?: boolean;
  has_form_ukur?: boolean;
}

export interface ApiKpltResponse {
  kplt_existing: KpltExisting[];
  kplt_from_ulok_ok: UlokForKplt[];
  pagination_existing?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  view?: string;
  search?: string;
}

interface UseKpltProps {
  searchQuery?: string;
  activeTab?: string;
  page?: number;
  limit?: number;
  month?: string;
  year?: string;
}

export function useKplt({
  searchQuery,
  activeTab,
  page = 1,
  limit = 9,
  month,
  year,
}: UseKpltProps = {}) {
  const buildUrl = () => {
    const params = new URLSearchParams();

    if (searchQuery && searchQuery.trim() !== "") {
      params.set("q", searchQuery.trim());
    }
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    if (activeTab === "History") {
      params.set("view", "existing");
      params.set("page_existing", page.toString());
      params.set("limit_existing", limit.toString());
    } else {
      params.set("view", "all");
      params.set("limit_ulok_ok", "500");
      params.set("limit_existing", "500");
    }

    const queryString = params.toString();
    return queryString ? `/api/kplt?${queryString}` : "/api/kplt";
  };

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ApiKpltResponse>(() => buildUrl(), {
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
    !!data &&
    (data.kplt_existing.length > 0 || data.kplt_from_ulok_ok.length > 0); // [!code ++]
  const isRefreshing = isValidating && hasData && !showSkeleton; // [!code ++]

  return {
    kpltExisting: data?.kplt_existing ?? ([] as KpltExisting[]),
    ulokForKplt: data?.kplt_from_ulok_ok ?? ([] as UlokForKplt[]),
    meta: data?.pagination_existing,
    isLoading,
    isError: error,
    showSkeleton,
    isRefreshing: isRefreshing,
    refreshKplt: () => mutate(),
  };
}
