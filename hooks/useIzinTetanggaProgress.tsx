// hooks/useIzinTetanggaProgress.tsx
"use client";

import { useEffect, useState } from "react";
import { stripServerControlledFieldsIT } from "@/lib/validations/izin_tetangga";

// 1. Definisikan interface data sesuai skema Izin Tetangga
interface IzinTetanggaData {
  nominal?: number | null;
  tanggal_terbit?: string | null;
  file_izin_tetangga?: string | null;
  file_bukti_pembayaran?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  final_status_it?: string | null;
  tgl_selesai_izintetangga?: string | null;
}

interface UseIzinTetanggaProgressResult {
  data: IzinTetanggaData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useIzinTetanggaProgress(
  progressId: string | undefined
): UseIzinTetanggaProgressResult {
  const [data, setData] = useState<IzinTetanggaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchIzinTetangga() {
    if (!progressId) {
      setError("progressId tidak valid");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Ubah endpoint API
      const res = await fetch(`/api/progress/${progressId}/izin_tetangga`);
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
        throw new Error(json.error || "Gagal mengambil data Izin Tetangga");

      if (!json?.data) {
        setData(null);
        setLoading(false);
        return;
      }

      // 3. Gunakan strip function yang sesuai
      const clean = stripServerControlledFieldsIT(json.data);

      // 4. Ambil field yang relevan
      const importantFields: IzinTetanggaData = {
        nominal: clean.nominal ?? null,
        tanggal_terbit: clean.tanggal_terbit ?? null,
        file_izin_tetangga: json.data.file_izin_tetangga ?? null, // Ambil path file dari data mentah
        file_bukti_pembayaran: json.data.file_bukti_pembayaran ?? null, // Ambil path file dari data mentah
        final_status_it: json.data.final_status_it ?? null,
        created_at: clean.created_at ?? null,
        tgl_selesai_izintetangga: json.data.tgl_selesai_izintetangga ?? null,
      };

      setData(importantFields);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIzinTetangga();
  }, [progressId]);

  return { data, loading, error, refetch: fetchIzinTetangga };
}
