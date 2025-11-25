"use client";

import useSWR from "swr";
import { useCallback, useMemo, useState } from "react";

type BBox = {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
} | null;

type Point = {
  id: string;
  ulok_id?: string | null;
  name: string;
  status: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
};

type PointsResponse = {
  ulok_points: Point[];
  kplt_points: Point[];
  meta?: {
    ulok_next_cursor?: string | null;
    kplt_next_cursor?: string | null;
  };
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

type UseMapParams = {
  year: number | null;
  lsId: string | null;
  branchId?: string | null;
  ulokOnlyOk?: boolean;
  ulokWithoutKplt?: boolean;
  search?: string | null;
};

export function useDashboardMap(params: UseMapParams) {
  const {
    year,
    lsId,
    branchId = null,
    ulokOnlyOk = true,
    ulokWithoutKplt = false,
    search = null,
  } = params;

  const [bbox, setBbox] = useState<BBox>(null);

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (lsId) q.set("ls_id", lsId);
    if (branchId) q.set("branch_id", branchId);
    if (search) q.set("search", search);
    if (ulokOnlyOk) q.set("ulok_only_ok", "true");
    if (ulokWithoutKplt) q.set("ulok_without_kplt", "true");
    if (bbox) {
      q.set("min_lat", String(bbox.min_lat));
      q.set("min_lng", String(bbox.min_lng));
      q.set("max_lat", String(bbox.max_lat));
      q.set("max_lng", String(bbox.max_lng));
    }
    // Page size untuk peta (aman, tidak terlalu kecil)
    q.set("page_size", "1500");
    return q.toString();
  }, [year, lsId, branchId, search, ulokOnlyOk, ulokWithoutKplt, bbox]);

  const { data, error, isLoading, mutate } = useSWR<PointsResponse>(
    `/api/dashboard?${qs}`,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const setBoundsFromMap = useCallback(
    (bounds: { south: number; west: number; north: number; east: number }) => {
      setBbox({
        min_lat: bounds.south,
        min_lng: bounds.west,
        max_lat: bounds.north,
        max_lng: bounds.east,
      });
    },
    []
  );

  const ulokUntukPeta = data?.ulok_points ?? [];
  const kpltUntukPeta = data?.kplt_points ?? [];

  return {
    ulokUntukPeta,
    kpltUntukPeta,
    isMapLoading: isLoading,
    mapError: error as Error | undefined,
    setBbox: setBoundsFromMap,
    refreshPoints: mutate,
  };
}
