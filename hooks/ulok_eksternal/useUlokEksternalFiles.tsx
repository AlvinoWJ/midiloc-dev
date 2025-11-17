"use client";

import { useState, useCallback } from "react";

export type FileMode = "redirect" | "proxy";

interface useUlokEksternalFileOptions {
  mode?: FileMode;
  download?: boolean;
  expiresIn?: number;
}

export function useUlokEksternalFile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate URL endpoint
  const getUrl = (id: string, opts?: useUlokEksternalFileOptions): string => {
    const params = new URLSearchParams();

    if (opts?.mode) params.set("mode", opts.mode);
    if (opts?.download) params.set("download", "1");
    if (opts?.expiresIn) params.set("expiresIn", String(opts.expiresIn));

    return `/api/ulok_eksternal/file/${id}?${params.toString()}`;
  };

  /**
   * 1. Redirect Mode → return direct signed URL (string)
   * 2. Proxy Mode → return Blob (image/pdf/video)
   */
  const fetchFile = useCallback(
    async (id: string, opts?: useUlokEksternalFileOptions) => {
      setLoading(true);
      setError(null);

      try {
        const url = getUrl(id, opts);

        if (opts?.mode === "proxy") {
          // Proxy mode → fetch file blob
          const res = await fetch(url);

          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || "Failed to download file");
          }

          const blob = await res.blob();
          return blob; // return Blob for preview
        }

        // Redirect mode → return signed URL only (no fetch)
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
   * Helper: Open signed URL in new tab (redirect mode)
   */
  const openFileInNewTab = (id: string, opts?: useUlokEksternalFileOptions) => {
    const url = getUrl(id, opts);
    window.open(url, "_blank");
  };

  return {
    loading,
    error,
    fetchFile,
    openFileInNewTab,
  };
}
