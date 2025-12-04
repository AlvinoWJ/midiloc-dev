"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps, Properti } from "@/types/common";
import DashboardLayout from "@/components/layout/dashboard_layout";
import useSWR from "swr";

/**
 * Default fetcher untuk SWR
 * -------------------------
 * - Melakukan fetch dengan error handling yang diperjelas.
 * - Jika response gagal, error akan dilempar dengan status + isi pesan dari server.
 */
const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status} ${t}`);
    }
    return r.json();
  });

/** Tipe filter aktif untuk peta */
type ActiveMapFilter = "ulok" | "kplt" | "progress_kplt";

export default function DashboardPage() {
  /** Data user (diambil dari context) */
  const { user } = useUser();

  /**
   * --------------------------------
   * STATE DASHBOARD
   * --------------------------------
   * - year → tahun laporan
   * - selectedSpecialistId → filter berdasarkan ID LS
   * - selectedBranchId → filter cabang
   * - activeMapFilter → menentukan kelompok titik peta yang ditampilkan
   */
  const [year, setYear] = useState<number | null>(new Date().getFullYear());
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    string | null
  >(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [activeMapFilter, setActiveMapFilter] =
    useState<ActiveMapFilter>("ulok");

  /**
   * --------------------------------
   * MEMBANGUN QUERY STRING
   * --------------------------------
   * Menghasilkan query parameter untuk API dashboard.
   * Hanya mengirim parameter yang diperlukan.
   */
  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (selectedSpecialistId) q.set("ls_id", selectedSpecialistId);
    if (selectedBranchId) q.set("branch_id", selectedBranchId);
    return q.toString();
  }, [year, selectedSpecialistId, selectedBranchId]);

  /**
   * --------------------------------
   * FETCHER 1 – DATA DASHBOARD
   * --------------------------------
   * Mengambil:
   * - summary → total ULok, KPLT, dsb.
   * - points → titik koordinat ULok & KPLT untuk peta
   */
  const {
    data: dashboardData,
    error: dashboardError,
    isLoading: isDashboardLoading,
  } = useSWR<{ summary: any; points: any }>(`/api/dashboard?${qs}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  /**
   * --------------------------------
   * FETCHER 2 – DATA PROGRESS KPLT
   * --------------------------------
   * Data progress digunakan untuk peta (progress_kplt)
   * → per_page = 9999 karena ingin mengambil semua data
   */
  const {
    data: progressData,
    error: progressError,
    isLoading: isProgressLoading,
  } = useSWR(`/api/progress?per_page=9999`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  /** Ekstraksi data hasil fetch */
  const summary = dashboardData?.summary ?? null;
  const points = dashboardData?.points ?? null;
  const progressPoints = progressData?.data ?? null;

  /**
   * --------------------------------
   * FILTER DATA PETA BERDASARKAN TAB AKTIF
   * --------------------------------
   * Menghasilkan data titik peta:
   * - ULok
   * - KPLT
   * - Progress KPLT (format khusus)
   */
  const propertiUntukPeta = useMemo(() => {
    let mapData: Properti[] = [];

    // === 1. ULok ==================================
    if (activeMapFilter === "ulok") {
      if (!points) return [];
      mapData = (points.ulok_points ?? []).map((p: any) => ({
        ...p,
        type: "ulok",
      }));
    }

    // === 2. KPLT ==================================
    else if (activeMapFilter === "kplt") {
      if (!points) return [];
      mapData = (points.kplt_points ?? []).map((p: any) => ({
        ...p,
        type: "kplt",
      }));
    }

    // === 3. Progress KPLT ==========================
    else if (activeMapFilter === "progress_kplt") {
      if (!progressPoints) return [];

      mapData = progressPoints
        .map((p: any) => {
          const kpltObj =
            Array.isArray(p.kplt_id) && p.kplt_id.length > 0
              ? p.kplt_id[0]
              : p.kplt_id ?? {};

          return {
            id: p.id,
            status: p.status,
            created_at: p.created_at,
            nama: kpltObj.nama_kplt ?? "Progress KPLT",
            latitude: kpltObj.latitude,
            longitude: kpltObj.longitude,
            kplt_id_induk: kpltObj.id,
            type: "progress_kplt",
          };
        })
        .filter((p: any) => p.latitude && p.longitude);
    }

    return mapData;
  }, [points, progressPoints, activeMapFilter]);

  /** Status gabungan */
  const isLoading = isDashboardLoading || isProgressLoading;
  const error = dashboardError || progressError;

  /** Props final untuk DashboardLayout */
  const dashboardProps: DashboardPageProps = {
    propertiData: summary ?? undefined,
    propertiUntukPeta,
    user,
    isLoading,
    isMapLoading: isLoading,
    isError: !!error,
    setYear,
    selectedSpecialistId,
    onSpecialistChange: setSelectedSpecialistId,
    selectedBranchId,
    onBranchChange: setSelectedBranchId,
    activeMapFilter,
    onMapFilterChange: setActiveMapFilter,
  };

  return <DashboardLayout {...dashboardProps} />;
}
