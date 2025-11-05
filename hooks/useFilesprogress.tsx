"use client";

import useSWR from "swr";
import { useMemo } from "react";

export interface ApiFile {
  name: string;
  field: string | null;
  size: number | null;
  last_modified: string | null;
  href: string;
}

export interface ApiFilesListResponse {
  modulesFile: string;
  id: string;
  ulok_id: string;
  folder: string;
  count: number;
  files: ApiFile[];
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => {
    if (!res.ok) {
      const error = new Error("Gagal mengambil data file");
      // @ts-ignore
      error.status = res.status;
      throw error;
    }
    return res.json();
  });

export function useFile(modules: string | null, id: string | undefined) {
  // Key akan null jika modules or id tidak ada, SWR tidak akan fetch
  const key = modules && id ? `/api/files/${modules}/${id}` : null;

  // 1. Ganti useState/useEffect dengan useSWR
  const {
    data,
    error,
    isLoading,
    mutate, // <-- Ambil fungsi mutate dari SWR
  } = useSWR<ApiFilesListResponse>(key, fetcher, {
    revalidateOnFocus: false,
  });

  const filesMap = useMemo(() => {
    const map = new Map<string, ApiFile>();
    if (!data?.files) return map;

    // Daftar semua field file yang mungkin ada di modul ini
    const knownKeys = [
      "file_izin_tetangga",
      "file_bukti_pembayaran",
      "par_online",
      "file_rekom_renovasi",
      "file_sph",
      "file_bukti_st",
      "file_denah",
      "file_spk",
      "file_rekom_notaris",
    ];

    for (const file of data.files) {
      const nameLower = file.name.toLowerCase();
      const matchingKey = knownKeys.find((key) =>
        nameLower.includes(key.toLowerCase())
      );

      if (matchingKey) {
        // Selalu ambil file terbaru jika ada duplikat nama field
        if (
          !map.has(matchingKey) ||
          file.name > (map.get(matchingKey)?.name || "")
        ) {
          map.set(matchingKey, file);
        }
      }
    }
    return map;
  }, [data?.files]);

  return {
    files: data?.files ?? [], // Daftar file mentah
    filesMap: filesMap, // Peta file yang sudah diproses
    loading: isLoading,
    error: error ? error.message : null,
    refresh: mutate, // 3. Kembalikan fungsi mutate sebagai 'refresh'
  };
}
