// hooks/progress_kplt/useRenovasiProgress.tsx
"use client";

import { useEffect, useState } from "react";

// Interface berdasarkan lib/validations/renovasi.ts
interface RenovasiData {
  kode_store?: string | null;
  tipe_toko?: string | null;
  bentuk_objek?: string | null;
  rekom_renovasi?: string | null;
  tgl_rekom_renovasi?: string | null;
  file_rekom_renovasi?: string | null;
  start_spk_renov?: string | null;
  end_spk_renov?: string | null;
  plan_renov?: number | null;
  proses_renov?: number | null;
  deviasi?: number | null;
  tgl_serah_terima?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  final_status_renov?: string | null;
  tgl_selesai_renov?: string | null;
}

interface UseRenovasiProgressResult {
  data: RenovasiData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRenovasiProgress(
  progressId: string | undefined
): UseRenovasiProgressResult {
  const [data, setData] = useState<RenovasiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRenovasi() {
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
      const res = await fetch(`/api/progress/${progressId}/renovasi`);
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
        throw new Error(json.error || "Gagal mengambil data Renovasi");

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
    fetchRenovasi();
  }, [progressId]);

  return { data, loading, error, refetch: fetchRenovasi };
}
