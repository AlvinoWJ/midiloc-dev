"use client";

import useSWR from "swr";
import type { AppUser } from "./useUser";

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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: { user?: AppUser };
}

export function useUlok() {
  const { data, error, isLoading, mutate } = useSWR<ApiUlokResponse>(
    "/api/ulok?limit=1000"
  );

  return {
    ulokData: data?.data ?? [],
    ulokLoading: isLoading,
    ulokError: error,
    meta: data?.meta,
    refreshUlok: () => mutate(),
  };
}
