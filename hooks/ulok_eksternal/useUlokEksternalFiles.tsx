"use client";

import { useState, useCallback } from "react";

/**
 * Mode file:
 * - redirect → return URL (tanpa fetch)
 * - proxy → fetch dan return Blob
 */
export type FileMode = "redirect" | "proxy";

/**
 * Opsi tambahan untuk fetch file:
 * - mode → redirect / proxy
 * - download → paksa proses download
 * - expiresIn → masa berlaku signed URL (detik)
 */
interface useUlokEksternalFileOptions {
  mode?: FileMode;
  download?: boolean;
  expiresIn?: number;
}

/**
 * useUlokEksternalFile
 * --------------------
 * Hook untuk mengelola fetching file ULok Eksternal.
 * Mendukung redirect URL dan proxy blob.
 */
export function useUlokEksternalFile() {
  /**
   * State untuk indikator loading dan error.
   */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate URL endpoint ke route file:
   * Format: /api/ulok_eksternal/[id]/files
   *
   * Menambahkan query params seperti:
   * - mode
   * - download=1
   * - expiresIn=3600
   */
  const getUrl = (id: string, opts?: useUlokEksternalFileOptions): string => {
    const params = new URLSearchParams();

    if (opts?.mode) params.set("mode", opts.mode);
    if (opts?.download) params.set("download", "1");
    if (opts?.expiresIn) params.set("expiresIn", String(opts.expiresIn));

    return `/api/ulok_eksternal/${id}/files?${params.toString()}`;
  };

  /**
   * fetchFile()
   * -----------
   * Mengambil file berdasarkan mode:
   *
   * 1. Proxy Mode
   *    - Melakukan fetch ke server
   *    - Validasi status response
   *    - Return Blob (PDF/Image/Video)
   *
   * 2. Redirect Mode
   *    - Tidak melakukan fetch
   *    - Return URL string langsung
   */
  const fetchFile = useCallback(
    async (id: string, opts?: useUlokEksternalFileOptions) => {
      setLoading(true);
      setError(null);

      try {
        const url = getUrl(id, opts);

        // Mode PROXY → fetch file sebagai blob
        if (opts?.mode === "proxy") {
          const res = await fetch(url);

          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || "Failed to download file");
          }

          const blob = await res.blob();
          return blob; // Blob bisa dipakai untuk preview <img> atau <iframe>
        }

        // Mode REDIRECT → return URL saja (tidak fetch)
        return url;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Membuka file di tab baru menggunakan redirect URL.
   * Tidak cocok untuk mode proxy (karena blob tidak bisa dibuka via URL secara langsung).
   */
  const openFileInNewTab = (id: string, opts?: useUlokEksternalFileOptions) => {
    const url = getUrl(id, opts);
    window.open(url, "_blank");
  };

  /**
   * API Hook
   */
  return {
    loading,
    error,
    fetchFile,
    openFileInNewTab,
  };
}
