"use client";

import useSWR, { useSWRConfig } from "swr";
import { useEffect, useMemo, useRef, useState } from "react";

type UlokRow = {
  id: string;
  nama_ulok: string | null;
  approval_status: string;
  alamat: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
};

type ApiResponse = {
  success: boolean;
  scope: "recent" | "history";
  block: { blockPage: number; blockSize: number };
  pagination: {
    total: number;
    totalPagesUi: number;
    withCount: "planned" | "exact" | "none";
    pageSizeUi: number;
  };
  filters: {
    month: number | null;
    year: number | null;
    search: string | null;
    specialist_id: string | null;
  };
  data: UlokRow[];
  error?: string;
  message?: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || json?.message || "Request failed");
  }
  return json as ApiResponse;
};

function buildApiUrl(params: {
  scope: "recent" | "history";
  blockPage: number;
  withCount: "planned" | "exact" | "none";
  search?: string;
  month?: number | "";
  year?: number | "";
  specialistId?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("scope", params.scope);
  qs.set("page", String(params.blockPage)); // page = nomor blok
  qs.set("withCount", params.withCount); // planned/exact/none
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.month) qs.set("month", String(params.month));
  if (params.year) qs.set("year", String(params.year));
  if (params.specialistId) qs.set("specialist_id", params.specialistId);
  // limit tidak perlu dikirim (BE sudah 90)
  return `/api/ulok?${qs.toString()}`;
}

function classNames(...cx: Array<string | false | null | undefined>) {
  return cx.filter(Boolean).join(" ");
}

export default function UlokPaginationBlockPage() {
  // Filter/query
  const [scope, setScope] = useState<"recent" | "history">("recent");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [withCount, setWithCount] = useState<"planned" | "exact" | "none">(
    "planned"
  );
  const [specialistId, setSpecialistId] = useState("");

  // UI pagination: 9/item, 10 halaman/blok
  const pageSizeUi = 9;
  const pagesPerBlock = 10;
  const [clientPage, setClientPage] = useState(1);

  // Hitung blok & slice
  const blockIndex = useMemo(
    () => Math.floor((clientPage - 1) / pagesPerBlock),
    [clientPage]
  );
  const blockPage = blockIndex + 1;
  const localPageIndex = (clientPage - 1) % pagesPerBlock; // 0..9
  const sliceStart = localPageIndex * pageSizeUi;
  const sliceEnd = sliceStart + pageSizeUi;

  // SWR key untuk blok aktif
  const currentKey = useMemo(
    () =>
      buildApiUrl({
        scope,
        blockPage,
        withCount, // planned = ringan + dapat total
        search,
        month,
        year,
        specialistId: specialistId || undefined,
      }),
    [scope, blockPage, withCount, search, month, year, specialistId]
  );

  const {
    data: currentData,
    error,
    isLoading,
    mutate,
  } = useSWR<ApiResponse>(currentKey, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 5000,
  });

  // Prefetch 1 blok ke depan (data saja)
  const { mutate: globalMutate, cache } = useSWRConfig();
  const prefetchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentData?.data?.length) return;
    if (localPageIndex < pagesPerBlock - 2) return; // halaman 9/10 di blok

    const nextKey = buildApiUrl({
      scope,
      blockPage: blockPage + 1,
      withCount: "none", // data saja
      search,
      month,
      year,
      specialistId: specialistId || undefined,
    });

    if (!prefetchedRef.current.has(nextKey) && !cache.get(nextKey)) {
      prefetchedRef.current.add(nextKey);
      globalMutate(nextKey, fetcher(nextKey), { revalidate: false });
    }
  }, [
    currentData?.data?.length,
    localPageIndex,
    pagesPerBlock,
    blockPage,
    scope,
    search,
    month,
    year,
    specialistId,
    cache,
    globalMutate,
  ]);

  // Slice 9 item dari blok 90
  const uiRows = useMemo(() => {
    if (!currentData?.data) return [];
    return currentData.data.slice(sliceStart, sliceEnd);
  }, [currentData?.data, sliceStart, sliceEnd]);

  // Total halaman UI
  const totalItems = currentData?.pagination?.total ?? 0;
  const uiTotalPages =
    currentData?.pagination?.totalPagesUi ??
    (totalItems ? Math.ceil(totalItems / pageSizeUi) : 0);

  function goPage(p: number) {
    if (p < 1) p = 1;
    if (uiTotalPages && p > uiTotalPages) p = uiTotalPages;
    setClientPage(p);
  }

  // Reset saat filter berubah
  useEffect(() => {
    setClientPage(1);
    prefetchedRef.current.clear();
  }, [scope, search, month, year, withCount, specialistId]);

  // Window pagination sederhana
  function pageWindow(current: number, total: number, spread = 2) {
    if (!total || total <= 1) return [1];
    const pages: number[] = [];
    const start = Math.max(1, current - spread);
    const end = Math.min(total, current + spread);
    for (let i = start; i <= end; i++) pages.push(i);
    if (start > 1) pages.unshift(1);
    if (start > 2) pages.splice(1, 0, -1);
    if (end < total - 1) pages.push(-1);
    if (end < total) pages.push(total);
    return pages;
  }
  const pagesToShow = pageWindow(clientPage, uiTotalPages, 2);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">
        ULOK Pagination (BE 90/blok, FE 9/halaman)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Scope</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
          >
            <option value="recent">recent (In Progress)</option>
            <option value="history">history (OK/NOK)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Search</label>
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="Cari nama_ulok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm w-24">withCount</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={withCount}
            onChange={(e) => setWithCount(e.target.value as any)}
          >
            <option value="planned">planned (cepat)</option>
            <option value="exact">exact (mahal)</option>
            <option value="none">none (tanpa total)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Month</label>
          <input
            className="border rounded px-2 py-1 w-full"
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) =>
              setMonth(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Year</label>
          <input
            className="border rounded px-2 py-1 w-full"
            type="number"
            min={1970}
            max={2100}
            value={year}
            onChange={(e) =>
              setYear(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Specialist</label>
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="UUID / kosong"
            value={specialistId}
            onChange={(e) => setSpecialistId(e.target.value)}
          />
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Blok aktif: {blockPage} • Halaman UI: {clientPage} • Local idx:{" "}
        {localPageIndex + 1}/10 • Total item: {totalItems} • Total halaman:{" "}
        {uiTotalPages}
      </div>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Nama</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Alamat</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Lat</th>
              <th className="text-left p-2">Lng</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="p-2" colSpan={7}>
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td className="p-2 text-red-600" colSpan={7}>
                  {(error as any)?.message || "Fetch error"}
                </td>
              </tr>
            )}
            {!isLoading && !error && uiRows.length === 0 && (
              <tr>
                <td className="p-2" colSpan={7}>
                  No data
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              uiRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{row.id}</td>
                  <td className="p-2">{row.nama_ulok ?? "-"}</td>
                  <td className="p-2">{row.approval_status}</td>
                  <td className="p-2">{row.alamat ?? "-"}</td>
                  <td className="p-2">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{row.latitude ?? "-"}</td>
                  <td className="p-2">{row.longitude ?? "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="px-3 py-1 border rounded"
          disabled={clientPage <= 1}
          onClick={() => goPage(clientPage - 1)}
        >
          Prev
        </button>

        {pagesToShow.map((p, idx) =>
          p === -1 ? (
            <span key={`ellipsis-${idx}`} className="px-2">
              …
            </span>
          ) : (
            <button
              key={p}
              className={classNames(
                "px-3 py-1 border rounded",
                p === clientPage && "bg-black text-white"
              )}
              onClick={() => goPage(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="px-3 py-1 border rounded"
          disabled={uiTotalPages > 0 && clientPage >= uiTotalPages}
          onClick={() => goPage(clientPage + 1)}
        >
          Next
        </button>

        <button
          className="ml-auto px-3 py-1 border rounded"
          onClick={() => mutate()}
        >
          Refresh blok
        </button>
      </div>
    </div>
  );
}
