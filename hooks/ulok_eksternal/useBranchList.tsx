"use client";

import useSWR from "swr";

const swrKey = "/api/ulok_eksternal/branch";

export type Branch = {
  id: string;
  nama: string;
  alamat: string;
  is_active: boolean;
  kode_branch: string;
};

interface ApiBranchListResponse {
  items: Branch[];
}

export function useBranchList() {
  const { data, error, isLoading } = useSWR<ApiBranchListResponse>(swrKey);

  return {
    branches: data?.items,
    isLoadingBranches: isLoading,
    isErrorBranches: error,
  };
}
