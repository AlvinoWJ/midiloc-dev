"use client";

import useSWR from "swr";
import {
  ApiKpltResponse,
  KpltExisting,
  UlokForKplt,
  KpltMeta,
} from "@/types/common"; // ✅ pakai tipe global

export function useKplt() {
  const { data, error, isLoading, mutate } =
    useSWR<ApiKpltResponse>("/api/kplt");

  return {
    kpltExisting: data?.kplt_existing ?? ([] as KpltExisting[]),
    ulokForKplt: data?.kplt_from_ulok_ok ?? ([] as UlokForKplt[]),
    meta: data?.meta as KpltMeta | undefined,

    isLoading,
    isError: error,
    refreshKplt: () => mutate(),
  };
}
