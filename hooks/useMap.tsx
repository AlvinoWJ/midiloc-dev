// hooks/useMap.ts
"use client";

import useSWR from "swr";
import { useUser } from "./useUser";
import { Properti } from "../types/common";

interface MapApiResponse {
  success: boolean;
  data: Properti[];
  pagination?: any;
}

export function useMap(specialistId: string | null) {
  const { user } = useUser();

  const { data: ulokResponse, error: ulokError, isLoading: isUlokLoading } = 
    useSWR<MapApiResponse>(() => {
      if (!user) return null;
      const role = user.position_nama?.toLowerCase().trim();

      if (role === 'location specialist' && user.id) {
        return `/api/ulok?user_id=${user.id}&for_map=true`;
      }
      if ((role === 'location manager' || role === 'branch manager') && user.branch_id) {
        // --- INI PERBAIKAN UTAMANYA ---
        // Jika specialistId adalah null, anggap sebagai "semua".
        const specialistFilter = specialistId ?? "semua"; 
        return `/api/ulok?branch_id=${user.branch_id}&specialist_id=${specialistFilter}&for_map=true`;
      }
      return null;
    });
    
  const { data: kpltResponse, error: kpltError, isLoading: isKpltLoading } = 
    useSWR<MapApiResponse>(() => {
      if (!user) return null;
      const role = user.position_nama?.toLowerCase().trim();

      if (role === 'location specialist' && user.id) {
        return `/api/kplt?user_id=${user.id}&for_map=true`;
      }
      if ((role === 'location manager' || role === 'branch manager') && user.branch_id) {
        // --- TERAPKAN PERBAIKAN YANG SAMA DI SINI ---
        const specialistFilter = specialistId ?? "semua";
        return `/api/kplt?branch_id=${user.branch_id}&specialist_id=${specialistFilter}&for_map=true`;
      }
      return null;
    });

  const ulokData = ulokResponse?.data || [];
  const kpltData = kpltResponse?.data || [];
  
  return {
    ulokUntukPeta: ulokData,
    kpltUntukPeta: kpltData,
    isMapLoading: isUlokLoading || isKpltLoading,
    mapError: ulokError || kpltError,
  };
}