// hooks/useMouProgress.ts
"use client";

import { useEffect, useState } from "react";
import { stripServerControlledFields } from "@/lib/validations/mou";

interface MouData {
  tanggal_mou?: string | null;
  nama_pemilik_final?: string | null;
  periode_sewa?: number | null;
  nilai_sewa?: number | null;
  status_pajak?: string | null;
  pembayaran_pph?: string | null;
  cara_pembayaran?: string | null;
  grace_period?: number | null;
  harga_final?: number | null;
  keterangan?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  final_status_mou?: string | null;
  tgl_selesai_mou?: string | null;
}

interface UseMouProgressResult {
  data: MouData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMouProgress(
  progressId: string | undefined
): UseMouProgressResult {
  const [data, setData] = useState<MouData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMou() {
    if (!progressId) {
      setError("progressId tidak valid");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/progress/${progressId}/mou`);
      const json = await res.json();

      if (
        res.status === 404 ||
        json.error?.toLowerCase().includes("not found")
      ) {
        setData(null);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(json.error || "Gagal mengambil data MOU");

      if (!json?.data) {
        setData(null);
        setLoading(false);
        return;
      }

      // Bersihkan field yang dikontrol server
      const clean = stripServerControlledFields(json.data);

      // Ambil hanya field penting yang kamu mau tampilkan
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMou();
  }, [progressId]);

  return { data, loading, error, refetch: fetchMou };
}
