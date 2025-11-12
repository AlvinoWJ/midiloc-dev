// hooks/progress_kplt/useNotarisProgress.tsx
"use client";

import { useEffect, useState } from "react";

interface NotarisData {
  par_online?: string | null;
  tanggal_par?: string | null;
  validasi_legal?: string | null;
  tanggal_validasi_legal?: string | null;
  tanggal_plan_notaris?: string | null;
  tanggal_notaris?: string | null;
  status_notaris?: string | null;
  status_pembayaran?: string | null;
  tanggal_pembayaran?: string | null;
  final_status_notaris?: string | null;
  tgl_selesai_notaris?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface UseNotarisProgressResult {
  data: NotarisData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNotarisProgress(
  progressId: string | undefined
): UseNotarisProgressResult {
  const [data, setData] = useState<NotarisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchNotaris() {
    if (!progressId) {
      setError("progressId tidak valid");
      setData(null);
      setLoading(false);
      return;
    }

    setData(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/progress/${progressId}/notaris`);
      const json = await res.json();

      if (
        res.status === 404 ||
        json.error?.toLowerCase().includes("not found")
      ) {
        setData(null);
        setLoading(false);
        return;
      }

      if (!res.ok)
        throw new Error(json.error || "Gagal mengambil data Notaris");

      if (!json?.data) {
        setData(null);
        setLoading(false);
        return;
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotaris();
  }, [progressId]);

  return { data, loading, error, refetch: fetchNotaris };
}
