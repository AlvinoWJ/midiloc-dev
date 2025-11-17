"use client";

import useSWR from "swr";

const swrKey = "/api/ulok_eksternal/location_specialist";

// Tipe data sesuai response API
export type LocationSpecialist = {
  id: string;
  nama: string;
  email: string;
  is_active: boolean;
  branch_id: string;
  position_id: string;
};

// Struktur yang sama dengan API response
interface ApiLocationSpecialistResponse {
  //   meta: {
  //     page: number;
  //     limit: number;
  //     total: number;
  //     branch_id: string;
  //   };
  items: LocationSpecialist[];
}

export function useLocationSpecialistList() {
  const { data, error, isLoading } =
    useSWR<ApiLocationSpecialistResponse>(swrKey);

  return {
    specialists: data?.items ?? [],
    // meta: data?.meta,
    isLoadingSpecialists: isLoading,
    isErrorSpecialists: error,
  };
}
