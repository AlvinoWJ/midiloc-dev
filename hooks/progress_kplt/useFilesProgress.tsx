"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

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

export function useFile(modules: string | null, id: string | undefined) {
  const [data, setData] = useState<ApiFilesListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!modules || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${modules}/${id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Gagal mengambil data file (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  }, [modules, id]);

  // Fetch otomatis saat pertama kali
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Mapping file yang dikenal
  const filesMap = useMemo(() => {
    const map = new Map<string, ApiFile>();
    if (!data?.files) return map;

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
    files: data?.files ?? [],
    filesMap,
    loading,
    error,
    refresh: fetchFiles, // ganti mutate dengan fetch ulang manual
  };
}
