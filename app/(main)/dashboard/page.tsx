"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { DashboardPageProps } from "@/types/common";
import DashboardLayout from "@/components/dashboard_layout";
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

export default function DashboardPage() {
  const { user } = useUser();

  const [year, setYear] = useState<number | null>(new Date().getFullYear());
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    string | null
  >(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [activeMapFilter, setActiveMapFilter] = useState<"ulok" | "kplt">(
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

  const { data, error, isLoading } = useSWR<{ summary: any; points: any }>(
    `/api/dashboard?${qs}`,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const summary = data?.summary ?? null;
  const points = data?.points ?? null;

  // Pilih data untuk peta: ulok_points atau kplt_points dari response points
  const propertiUntukPeta = useMemo(() => {
    if (!points) return [];
    return activeMapFilter === "ulok"
      ? points.ulok_points ?? []
      : points.kplt_points ?? [];
  }, [points, activeMapFilter]);

  const dashboardProps: DashboardPageProps = {
    propertiData: summary ?? undefined, // summary sudah mengandung kpis, filters, breakdown, donut, perbulan
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
