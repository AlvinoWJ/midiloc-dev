// hooks/progress_kplt/usePerizinanProgress.tsx
"use client";

import { useEffect, useState } from "react";
import { stripServerControlledFieldsPerizinan } from "@/lib/validations/perizinan";

interface PerizinanData {
  tgl_sph?: string | null;
  tgl_st_berkas?: string | null;
  tgl_gambar_denah?: string | null;
  tgl_spk?: string | null;
  tgl_rekom_notaris?: string | null;
  nominal_sph?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  final_status_perizinan?: string | null;
  tgl_selesai_perizinan?: string | null;
}

interface UsePerizinanProgressResult {
  data: PerizinanData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePerizinanProgress(
  progressId: string | undefined
): UsePerizinanProgressResult {
  const [data, setData] = useState<PerizinanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPerizinan() {
    if (!progressId) {
      setError("progressId tidak valid");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Ubah endpoint API
      const res = await fetch(`/api/progress/${progressId}/perizinan`);
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
        throw new Error(json.error || "Gagal mengambil data Perizinan");

      if (!json?.data) {
        setData(null);
        setLoading(false);
        return;
      }

      // 3. Gunakan strip function yang sesuai
      const clean = stripServerControlledFieldsPerizinan(json.data);

      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPerizinan();
  }, [progressId]);

  return { data, loading, error, refetch: fetchPerizinan };
}
