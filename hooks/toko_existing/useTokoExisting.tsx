// hooks/toko_existing/useTokoExisting.tsx
import { useState, useMemo } from "react";
import { TokoExistingItem, TokoExistingMeta } from "@/types/toko_existing";
import { dummyTokoExistingData } from "@/lib/dummy-data";

interface UseTokoExistingParams {
  page: number;
  limit: number;
  search: string;
  year: string;
  regional: string;
}

interface UseTokoExistingResult {
  tokoData: TokoExistingItem[];
  meta: TokoExistingMeta | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const useTokoExisting = (
  params: UseTokoExistingParams
): UseTokoExistingResult => {
  const { page, limit, search, year, regional } = params;

  // Simulate loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const filteredData = useMemo(() => {
    let data = dummyTokoExistingData;

    // 1. Search filter (nama_toko atau alamat)
    if (search) {
      const lowerCaseSearch = search.toLowerCase().trim();
      data = data.filter(
        (toko) =>
          toko.nama_toko.toLowerCase().includes(lowerCaseSearch) ||
          toko.alamat.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 2. Year filter
    if (year) {
      data = data.filter((toko) => toko.tahun_beroperasi.toString() === year);
    }

    // 3. Regional filter
    if (regional) {
      data = data.filter((toko) => toko.regional === regional);
    }

    return data;
  }, [search, year, regional]);

  // Simulate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = filteredData.slice(start, end);

  const meta: TokoExistingMeta = {
    total: totalItems,
    page: page,
    limit: limit,
    totalPages: totalPages,
  };

  // Simulate data fetching over time (e.g., SWR behavior)
  useMemo(() => {
    setIsLoading(true);
    setIsError(false);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // 500ms mock delay

    return () => clearTimeout(timer);
  }, [page, limit, search, year, regional]);

  return {
    tokoData: paginatedData,
    meta,
    isLoading,
    isError,
  };
};
