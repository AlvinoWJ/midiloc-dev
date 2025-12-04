"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

/**
 * Representasi objek file tunggal dari API.
 */
export interface ApiFile {
  name: string;
  field: string | null;
  size: number | null;
  last_modified: string | null;
  href: string; // URL untuk download/preview
}

/**
 * Struktur response JSON dari endpoint `/api/files/[module]/[id]`.
 */
export interface ApiFilesListResponse {
  modulesFile: string;
  id: string;
  ulok_id: string;
  folder: string;
  count: number;
  files: ApiFile[];
}

/**
 * Custom Hook: useFile
 * --------------------
 * Mengambil daftar file dari server berdasarkan modul dan ID entitas.
 * * Fitur Utama:
 * 1. Fetching data file secara manual (tanpa SWR).
 * 2. Auto-mapping: Mengasosiasikan file dengan field tertentu berdasarkan nama file.
 * 3. Versioning sederhana: Memilih file terbaru jika ada duplikat nama field.
 * * @param modules - Nama modul (misal: "izin_tetangga", "notaris").
 * @param id - ID dari entitas yang memiliki file tersebut.
 */
export function useFile(modules: string | null, id: string | undefined) {
  const [data, setData] = useState<ApiFilesListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fungsi fetch data.
   * Dibungkus useCallback agar referensi fungsinya stabil dan tidak memicu useEffect berulang.
   */
  const fetchFiles = useCallback(async () => {
    // Guard: Jangan fetch jika parameter belum lengkap
    if (!modules || !id) return;

    setLoading(true);
    setError(null);
    try {
      // Menggunakan credentials: "include" agar cookies auth terkirim ke API
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

  // Efek 1: Jalankan fetch otomatis saat komponen mount atau parameter berubah
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  /**
   * Smart Mapping Logic (useMemo).
   * ------------------------------
   * Mengubah array file mentah menjadi Map yang mudah diakses berdasarkan key.
   * Berguna untuk menampilkan file spesifik di UI (misal: tombol "Lihat File SPH").
   */
  const filesMap = useMemo(() => {
    const map = new Map<string, ApiFile>();
    if (!data?.files) return map;

    // Daftar kata kunci file yang diharapkan ada dalam sistem
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

      // Cari apakah nama file mengandung salah satu knownKey
      const matchingKey = knownKeys.find((key) =>
        nameLower.includes(key.toLowerCase())
      );

      if (matchingKey) {
        // Logika Versioning Sederhana:
        // Jika key sudah ada di map, bandingkan nama filenya.
        // Jika nama file sekarang > nama file di map (secara string/alphabetical),
        // maka file sekarang dianggap lebih baru (asumsi nama file mengandung timestamp).
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
    files: data?.files ?? [], // Array mentah semua file
    filesMap, // Map file yang sudah dikategorikan (terbaru)
    loading,
    error,
    refresh: fetchFiles, // Fungsi manual untuk trigger refresh (pengganti mutate SWR)
  };
}
