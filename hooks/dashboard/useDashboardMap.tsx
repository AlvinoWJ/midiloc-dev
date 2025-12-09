"use client";

import useSWR from "swr";
import { useCallback, useMemo, useState } from "react";

/**
 * BBox
 * ----
 * Struktur bounding box untuk peta.
 * Digunakan untuk membatasi query berdasarkan viewport peta.
 *
 * min_lat, min_lng : titik kiri-bawah
 * max_lat, max_lng : titik kanan-atas
 */
type BBox = {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
} | null;

/**
 * Point
 * -----
 * Representasi satu titik lokasi pada peta.
 * Bisa berupa titik ULok atau KPLT.
 */
type Point = {
  id: string;
  ulok_id?: string | null;
  name: string;
  status: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
};

/**
 * PointsResponse
 * --------------
 * Struktur response API yang mengembalikan:
 * - ulok_points : daftar titik ULok
 * - kplt_points : daftar titik KPLT
 * - meta : informasi pagination via cursor
 */
type PointsResponse = {
  ulok_points: Point[];
  kplt_points: Point[];
  meta?: {
    ulok_next_cursor?: string | null;
    kplt_next_cursor?: string | null;
  };
};

/**
 * fetcher
 * -------
 * Fetcher standar untuk SWR.
 * Melempar error jika status HTTP bukan 2xx.
 */
const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

/**
 * UseMapParams
 * ------------
 * Parameter opsional untuk memfilter titik peta:
 *
 * - year: filter tahun
 * - lsId: ID spesialis/location supervisor
 * - branchId: filter cabang (opsional)
 * - ulokOnlyOk: hanya tampilkan ulok dengan status OK
 * - ulokWithoutKplt: tampilkan ULok yang belum ada titik KPLT
 * - search: pencarian berbasis nama
 */
type UseMapParams = {
  year: number | null;
  lsId: string | null;
  branchId?: string | null;
  ulokOnlyOk?: boolean;
  ulokWithoutKplt?: boolean;
  search?: string | null;
};

/**
 * useDashboardMap Hook
 * --------------------
 * Hook utama untuk mengambil titik ULok dan KPLT pada peta dashboard.
 *
 * Fitur Utama:
 * - Client-side data fetching menggunakan SWR
 * - Auto-refresh mount & manual refresh melalui `refreshPoints()`
 * - Filter berdasarkan:
 *   • tahun
 *   • branch
 *   • LS (location supervisor)
 *   • status ULok (OK)
 *   • pencarian nama
 * - Mendukung bounding box (viewport map) agar data lebih relevan
 * - SWR diset keepPreviousData supaya perpindahan map tidak membuat UI berkedip
 *
 * Alur Kerja:
 * - Mengelola state bounding box (bbox)
 * - Generate query string secara memoized berdasarkan filter
 * - Mengambil data menggunakan SWR dengan URL hasil query string
 * - Return titik ULok & KPLT yang siap dirender pada peta
 *
 * Contoh Penggunaan:
 * ------------------
 * const {
 *   ulokUntukPeta,
 *   kpltUntukPeta,
 *   isMapLoading,
 *   setBbox,
 * } = useDashboardMap({
 *   year: 2025,
 *   lsId: "LS-01",
 *   ulokOnlyOk: true,
 * });
 */
export function useDashboardMap(params: UseMapParams) {
  const {
    year,
    lsId,
    branchId = null,
    ulokOnlyOk = true,
    ulokWithoutKplt = false,
    search = null,
  } = params;

  /**
   * Bounding Box State
   * ------------------
   * Diset melalui `setBoundsFromMap()` setiap kali peta digerakkan.
   */
  const [bbox, setBbox] = useState<BBox>(null);

  /**
   * qs (Query String)
   * -----------------
   * Dibuat menggunakan useMemo agar tidak regenerate berlebihan.
   * Parameter dinamis:
   * - filter tahun, LS, cabang
   * - toggle ulokOnlyOk & ulokWithoutKplt
   * - pencarian
   * - bounding box map (jika ada)
   * - page_size default 1500
   */
  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (lsId) q.set("ls_id", lsId);
    if (branchId) q.set("branch_id", branchId);
    if (search) q.set("search", search);
    if (ulokOnlyOk) q.set("ulok_only_ok", "true");
    if (ulokWithoutKplt) q.set("ulok_without_kplt", "true");

    // Bounding box
    if (bbox) {
      q.set("min_lat", String(bbox.min_lat));
      q.set("min_lng", String(bbox.min_lng));
      q.set("max_lat", String(bbox.max_lat));
      q.set("max_lng", String(bbox.max_lng));
    }

    // Default page size untuk map (besar agar tidak mem-paginasi terlalu cepat)
    q.set("page_size", "1500");

    return q.toString();
  }, [year, lsId, branchId, search, ulokOnlyOk, ulokWithoutKplt, bbox]);

  /**
   * SWR Fetching
   * ------------
   * Mengambil titik ULok dan KPLT melalui endpoint:
   * /api/dashboard?{queryString}
   *
   * keepPreviousData:
   *    mempertahankan data sebelumnya saat query berubah → UI lebih halus
   *
   * revalidateOnFocus:
   *    dimatikan agar map tidak reload ketika user fokus ulang ke tab
   */
  const { data, error, isLoading, mutate } = useSWR<PointsResponse>(
    `/api/dashboard?${qs}`,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  /**
   * setBoundsFromMap
   * ----------------
   * Setter untuk bounding box berdasarkan viewport map.
   * Biasanya dipanggil dari event onMoveEnd map (Leaflet/Mapbox).
   */
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

  // Titik siap pakai untuk ditampilkan pada peta
  const ulokUntukPeta = data?.ulok_points ?? [];
  const kpltUntukPeta = data?.kplt_points ?? [];

  return {
    ulokUntukPeta,
    kpltUntukPeta,
    isMapLoading: isLoading,
    mapError: error as Error | undefined,
    setBbox: setBoundsFromMap,
    refreshPoints: mutate, // manual re-fetch
  };
}
