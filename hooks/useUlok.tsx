"use client";

import useSWR from "swr";
import type { AppUser } from "./useUser";
import { UlokApiResponse } from "@/types/common";

export type Ulok = {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string;
  latitude: string;
  longitude: string;
};

interface ApiUlokResponse {
  data: Ulok[];
  meta?: { user?: AppUser };
}

export function useUlok() {
  const { data, error, isLoading, mutate } =
    useSWR<ApiUlokResponse>("/api/ulok");

  return {
    ulokData: data?.data ?? [],
    ulokLoading: isLoading,
    ulokError: error,
    meta: data?.meta,
    refreshUlok: () => mutate(),
  };
}
