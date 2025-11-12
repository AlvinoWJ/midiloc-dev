"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps, Properti } from "@/types/common";
import DashboardLayout from "@/components/layout/dashboard_layout";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status} ${t}`);
    }
    return r.json();
  });
// >>>>>>> origin/debug

type ActiveMapFilter = "ulok" | "kplt" | "progress_kplt";

export default function DashboardPage() {
  const { user } = useUser();

  const [year, setYear] = useState<number | null>(new Date().getFullYear());
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    string | null
  >(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [activeMapFilter, setActiveMapFilter] = useState<ActiveMapFilter>(
    "ulok"
  );

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (selectedSpecialistId) q.set("ls_id", selectedSpecialistId);
    if (selectedBranchId) q.set("branch_id", selectedBranchId);
    // Jika perlu viewport untuk peta, bisa ditambahkan param min_lat,dst. di sini dan di BE
    return q.toString();
  }, [year, selectedSpecialistId, selectedBranchId]);

  // --- Fetcher 1: Data Dashboard (ULOK & KPLT) ---
  const { 
    data: dashboardData, 
    error: dashboardError, 
    isLoading: isDashboardLoading 
  } = useSWR<{ summary: any; points: any }>(
    `/api/dashboard?${qs}`,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  // --- PERUBAHAN 3: Fetcher 2 - Ambil data Progress KPLT ---
  // Kita ambil semua (per_page besar) karena ini untuk peta
  const { 
    data: progressData, 
    error: progressError, 
    isLoading: isProgressLoading 
  } = useSWR(
    // Kita akan selalu fetch data progress untuk disiapkan
    `/api/progress?per_page=9999`, // Ambil semua data
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const summary = dashboardData?.summary ?? null;
  const points = dashboardData?.points ?? null;
  const progressPoints = progressData?.data ?? null;

 // --- PERUBAHAN 4: Modifikasi 'propertiUntukPeta' ---
  const propertiUntukPeta = useMemo(() => {
    // Tipe kembalian eksplisit untuk data peta
    let mapData: Properti[] = [];

    if (activeMapFilter === "ulok") {
      if (!points) return [];
      // Tambahkan 'type' agar PetaLokasiInteraktif tahu
      mapData = (points.ulok_points ?? []).map((p: any) => ({ ...p, type: 'ulok' }));
    } 
    
    else if (activeMapFilter === "kplt") {
      if (!points) return [];
      // Tambahkan 'type'
      mapData = (points.kplt_points ?? []).map((p: any) => ({ ...p, type: 'kplt' }));
    }

    else if (activeMapFilter === "progress_kplt") {
      if (!progressPoints) return [];
      
      // Kita proses data progress di sini agar formatnya konsisten
      mapData = progressPoints.map((p: any) => {
        // 'kplt_id' adalah object dari join (sesuai API /api/progress)
        const kpltObj = Array.isArray(p.kplt_id) && p.kplt_id.length > 0
          ? p.kplt_id[0]
          : (p.kplt_id ?? {}); // Fallback jika bukan array

 return {
          id: p.id, // ID unik dari progress_kplt
          status: p.status, // Status dari progress_kplt
          created_at: p.created_at,
          nama: kpltObj.nama_kplt ?? 'Progress KPLT', // Nama dari KPLT induk
          // Gunakan lat/long dari kpltObj
          latitude: kpltObj.latitude,
          longitude: kpltObj.longitude,
          kplt_id_induk: kpltObj.id, // Simpan ID KPLT induk jika perlu
          type: 'progress_kplt' // Tipe baru
        };
      }).filter((p: any) => p.latitude && p.longitude); // Pastikan hanya yg ada lokasinya
    }

    return mapData;

  }, [points, progressPoints, activeMapFilter]); // Tambahkan progressPoints

  const isLoading = isDashboardLoading || isProgressLoading; // Gabungkan status loading
  const error = dashboardError || progressError; // Gabungkan error

  const dashboardProps: DashboardPageProps = {
    propertiData: summary ?? undefined,
    propertiUntukPeta,
    user,
    isLoading, // Kirim status loading gabungan
    isMapLoading: isLoading, // Kirim status loading gabungan
    isError: !!error, // Kirim status error gabungan
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