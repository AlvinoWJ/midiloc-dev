// hooks/progress_kplt/useGrandOpeningProgress.tsx
"use client";

import { useEffect, useState } from "react";

// Interface berdasarkan lib/validations/grand_opening.ts
interface GrandOpeningData {
  rekom_go_vendor?: string | null;
  tgl_rekom_go_vendor?: string | null;
  tgl_go?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  final_status_go?: string | null;
  tgl_selesai_go?: string | null;
}

interface UseGrandOpeningProgressResult {
  data: GrandOpeningData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGrandOpeningProgress(
  progressId: string | undefined
): UseGrandOpeningProgressResult {
  const [data, setData] = useState<GrandOpeningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchGrandOpening() {
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
      const res = await fetch(`/api/progress/${progressId}/grand_opening`);
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
        throw new Error(json.error || "Gagal mengambil data Grand Opening");

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
    fetchGrandOpening();
  }, [progressId]);

  return { data, loading, error, refetch: fetchGrandOpening };
}
