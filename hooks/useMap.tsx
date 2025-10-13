// hooks/useMap.ts
"use client";

import useSWR from "swr";
import { useUser } from "./useUser"; // Pastikan path ini benar
import { Properti } from "../types/common"; // Pastikan path ini benar

interface MapApiResponse {
  success: boolean;
  data: Properti[];
  pagination?: any; // Pagination tidak kita gunakan, jadi bisa opsional
}

export function useMap(specialistId: string | null) {
  const { user } = useUser();
  const role = user?.position_nama;

  let ulokApiUrl = "";
  let kpltApiUrl = "";

  // Gunakan .toLowerCase() dan .trim() untuk perbandingan yang lebih aman
  const normalizedRole = role?.toLowerCase().trim();

  if (normalizedRole === "location specialist") {
    if (user?.id) {
      // Pastikan user.id ada sebelum membuat URL
      ulokApiUrl = `/api/ulok?user_id=${user.id}&for_map=true`;
      kpltApiUrl = `/api/kplt?user_id=${user.id}&for_map=true`;
    }
  } else if (normalizedRole === "location manager") {
    const specialistFilter = specialistId === "semua" ? "semua" : specialistId;
    if (user?.branch_id) {
      ulokApiUrl = `/api/ulok?branch_id=${user.branch_id}&specialist_id=${specialistFilter}&for_map=true`;
      kpltApiUrl = `/api/kplt?branch_id=${user.branch_id}&specialist_id=${specialistFilter}&for_map=true`;
    }
  } else if (normalizedRole === "branch manager") {
    if (user?.branch_id) {
      ulokApiUrl = `/api/ulok?branch_id=${user.branch_id}&for_map=true`;
      kpltApiUrl = `/api/kplt?branch_id=${user.branch_id}&for_map=true`;
    }
  }

  // useSWR hanya akan berjalan jika URL-nya tidak kosong.
  const {
    data: ulokResponse,
    error: ulokError,
    isLoading: isUlokLoading,
  } = useSWR<MapApiResponse>(user && ulokApiUrl ? ulokApiUrl : null);
  const {
    data: kpltResponse,
    error: kpltError,
    isLoading: isKpltLoading,
  } = useSWR<MapApiResponse>(user && kpltApiUrl ? kpltApiUrl : null);

  // Ekstrak properti 'data' dari respons, dan berikan array kosong jika belum ada.
  const ulokData = ulokResponse?.data || [];
  const kpltData = kpltResponse?.data || [];

  return {
    ulokUntukPeta: ulokData,
    kpltUntukPeta: kpltData,
    isMapLoading: isUlokLoading || isKpltLoading,
    mapError: ulokError || kpltError,
  };
}
