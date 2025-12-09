"use client";

/**
 * DashboardLayout
 * ---------------
 * Layout utama untuk halaman Dashboard Performa.
 * Halaman ini berfungsi sebagai pusat visualisasi data yang mencakup:
 * - Kartu Statistik (KPI Utama)
 * - Grafik Donut (Persentase Status)
 * - Grafik Bar (Tren Per Bulan)
 * - Peta Interaktif (Sebaran Lokasi)
 *
 * Fitur Utama:
 * - **Filtering Bertingkat**: Tahun, Cabang (untuk Manager), dan Specialist.
 * - **Role-Based View**: Tampilan filter menyesuaikan role user (GM, RM, BM, LM).
 * - **Dynamic Map Filters**: Filter peta dapat berubah antara ULOK, KPLT, dan Progress KPLT.
 * - **Data Calculation**: Melakukan perhitungan ulang KPI di sisi client saat filter specialist aktif.
 */

import React, { useMemo, useEffect, useState } from "react";
import { DashboardPageProps } from "@/types/common";
import { StatsCard } from "../ui/statscard";
import { DonutChart } from "../ui/donutchart";
import { BarChart } from "../ui/barchart";
import dynamic from "next/dynamic";
import { DashboardSkeleton } from "../ui/skleton";
import YearPicker from "../ui/yearpicker";

/**
 * Lazy load component peta untuk optimasi performa awal (Client-side only).
 */
const PetaLokasiInteraktif = dynamic(
  () => import("@/components/map/PetaLokasiInteraktif"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <p>Memuat Peta...</p>
      </div>
    ),
  }
);

// --- Konfigurasi Legend Grafik ---
const ulokLegendConfig = [
  { status: "In Progress", label: "In Progress" },
  { status: "OK", label: "Approve (OK)" },
  { status: "NOK", label: "Reject (NOK)" },
];
const kpltLegendConfig = [
  { status: "In Progress", label: "In Progress" },
  { status: "Waiting for Forum", label: "Waiting for Forum" },
  { status: "OK", label: "Approve (OK)" },
  { status: "NOK", label: "Reject (NOK)" },
];
const ulokBarLegendConfig = [
  { key: "inProgress", label: "In Progress" },
  { key: "approved", label: "Approved" },
  { key: "nok", label: "Reject (NOK)" },
];
const kpltBarLegendConfig = [
  { key: "inProgress", label: "In Progress" },
  { key: "waitingforforum", label: "Waiting for Forum" },
  { key: "approved", label: "Approved (OK)" },
  { key: "nok", label: "Reject (NOK)" },
];

interface BranchOption {
  branch_id: string;
  nama_cabang: string;
}

// --- Definisi Tipe Filter Peta ---
type ActiveMapFilter = "ulok" | "kplt" | "progress_kplt";

/**
 * Opsi status dropdown pada peta yang berubah dinamis tergantung ActiveMapFilter.
 */
const STATUS_OPTIONS = {
  ulok: ["Semua Status", "OK", "NOK", "In Progress"] as const,
  kplt: [
    "Semua Status",
    "OK",
    "NOK",
    "In Progress",
    "Waiting for Forum",
  ] as const,
  progress_kplt: [
    "Semua Status",
    "Not Started",
    "Mou",
    "Izin Tetangga",
    "Perizinan",
    "Notaris",
    "Renovasi",
    "Grand Opening",
  ] as const,
};

type AnyStatus =
  | (typeof STATUS_OPTIONS.ulok)[number]
  | (typeof STATUS_OPTIONS.kplt)[number]
  | (typeof STATUS_OPTIONS.progress_kplt)[number];

export default function DashboardLayout(props: DashboardPageProps) {
  /**
   * Destructuring props utama.
   * - propertiData: Data agregat untuk chart dan KPI.
   * - propertiUntukPeta: Array raw data lokasi untuk pin di peta.
   * - on...Change: Handler untuk perubahan filter dari parent component.
   */
  const {
    propertiData,
    propertiUntukPeta,
    isLoading,
    isMapLoading,
    isError,
    setYear,
    selectedSpecialistId,
    onSpecialistChange,
    selectedBranchId,
    onBranchChange,
    activeMapFilter,
    onMapFilterChange,
  } = props;

  /**
   * Menentukan role user untuk logika tampilan filter.
   */
  const userRole = propertiData?.filters?.role?.toLowerCase?.() || "";
  const isLocationManager = userRole === "location manager";
  const isBranchManager = userRole === "branch manager";
  const isRegionalManager = userRole === "regional manager";
  const isGeneralManager = userRole === "general manager";

  /**
   * State lokal untuk filter status spesifik pada Peta.
   */
  const [statusValue, setStatusValue] = useState<AnyStatus>("Semua Status");

  /**
   * Effect untuk mereset filter status peta jika tipe peta berubah.
   * Contoh: Pindah dari "ULOK" ke "Progress KPLT", maka status harus divalidasi ulang.
   */
  useEffect(() => {
    const options = STATUS_OPTIONS[activeMapFilter as ActiveMapFilter];
    // @ts-ignore - Pengecekan dinamis runtime
    if (!options.includes(statusValue)) {
      setStatusValue("Semua Status");
    }
  }, [activeMapFilter, statusValue]);

  /**
   * Cache opsi Cabang (Branch).
   * Digunakan agar dropdown tidak kosong saat data di-refetch parsial.
   */
  const [branchOptionsCache, setBranchOptionsCache] = useState<BranchOption[]>(
    []
  );
  useEffect(() => {
    if (propertiData?.breakdown?.type === "branch") {
      const rows: any[] = propertiData.breakdown.rows ?? [];
      if (!selectedBranchId) {
        setBranchOptionsCache(
          rows.map((row) => ({
            branch_id: String(row.branch_id),
            nama_cabang: String(row.nama_cabang),
          }))
        );
      }
    }
  }, [propertiData?.breakdown, selectedBranchId]);

  const branchOptions: BranchOption[] = selectedBranchId
    ? branchOptionsCache
    : propertiData?.breakdown?.type === "branch"
    ? ((propertiData.breakdown.rows as any[]) ?? []).map((row) => ({
        branch_id: String(row.branch_id),
        nama_cabang: String(row.nama_cabang),
      }))
    : [];

  /**
   * Cache opsi Specialist (LS).
   * Digunakan oleh BM/LM untuk memfilter kinerja tim di bawahnya.
   */
  const [lsOptionsCache, setLsOptionsCache] = useState<
    Array<{ user_id: string; nama: string }>
  >([]);
  useEffect(() => {
    const rows =
      (propertiData?.breakdown?.rows as Array<{
        user_id: string;
        nama: string;
      }>) ?? [];
    if (
      !selectedSpecialistId &&
      propertiData?.breakdown?.type === "user" &&
      (isLocationManager || isBranchManager)
    ) {
      setLsOptionsCache(rows);
    }
  }, [
    propertiData?.breakdown?.rows,
    propertiData?.breakdown?.type,
    selectedSpecialistId,
    isLocationManager,
    isBranchManager,
  ]);

  const lsOptions =
    selectedSpecialistId && propertiData?.breakdown?.type === "user"
      ? lsOptionsCache
      : propertiData?.breakdown?.type === "user" &&
        (isLocationManager || isBranchManager)
      ? (propertiData?.breakdown?.rows as Array<{
          user_id: string;
          nama: string;
        }>) ?? []
      : [];

  /*
   * Menghitung data Kartu Statistik (KPI) secara dinamis.
   * - Jika "Semua Specialist", gunakan data agregat global.
   * - Jika salah satu specialist dipilih, hitung ulang KPI berdasarkan data spesifik user tersebut.
   */
  const dynamicStatsData = useMemo(() => {
    if (!propertiData) return [];
    let kpis = propertiData.kpis;

    // Logika override KPI jika memfilter user tertentu
    if (
      selectedSpecialistId &&
      propertiData.breakdown?.type === "user" &&
      propertiData.breakdown?.rows
    ) {
      const specialistRow = propertiData.breakdown.rows.find(
        (row: any) => row.user_id === selectedSpecialistId
      );
      if (specialistRow) {
        kpis = {
          total_kplt: specialistRow.kplt_total,
          total_ulok: specialistRow.ulok_total,
          total_kplt_approves: specialistRow.kplt_ok,
          total_ulok_approves: specialistRow.ulok_ok,
          presentase_kplt_approves:
            specialistRow.kplt_total > 0
              ? (specialistRow.kplt_ok / specialistRow.kplt_total) * 100
              : 0,
          presentase_ulok_approves:
            specialistRow.ulok_total > 0
              ? (specialistRow.ulok_ok / specialistRow.ulok_total) * 100
              : 0,
        };
      }
    }

    const formatPercent = (val: number = 0) =>
      `${Number(val || 0).toFixed(1)}%`;

    return [
      {
        title: "Total ULOK",
        value: Number(kpis?.total_ulok ?? 0).toLocaleString("id-ID"),
        icon: "/icons/folder.svg",
        color: "blue" as const,
      },
      {
        title: "Total KPLT",
        value: Number(kpis?.total_kplt ?? 0).toLocaleString("id-ID"),
        icon: "/icons/kplt_ungu.svg",
        color: "purple" as const,
      },
      {
        title: "Total KPLT OK",
        value: Number(kpis?.total_kplt_approves ?? 0).toLocaleString("id-ID"),
        icon: "/icons/approve.svg",
        color: "green" as const,
      },
      {
        title: "Persentase ULOK OK",
        value: formatPercent(Number(kpis?.presentase_ulok_approves ?? 0)),
        icon: "/icons/persentase.svg",
        color: "blue" as const,
      },
      {
        title: "Persentase KPLT OK",
        value: formatPercent(Number(kpis?.presentase_kplt_approves ?? 0)),
        icon: "/icons/persentase_approve.svg",
        color: "green" as const,
      },
    ];
  }, [propertiData, selectedSpecialistId]);

  /**
   * Mempersiapkan data untuk Grafik Donut & Bar.
   * Sama seperti KPI, data ini juga menyesuaikan jika ada specialist yang dipilih.
   */
  const { ulokDonut, kpltDonut, ulokBar, kpltBar } = useMemo(() => {
    if (!propertiData)
      return { ulokDonut: [], kpltDonut: [], ulokBar: [], kpltBar: [] };

    let ulokDonut = (propertiData.donut_ulok ?? []).map((item) => ({
      status: item.status,
      label: item.label,
      value: item.count,
    }));
    let kpltDonut = (propertiData.donut_kplt ?? []).map((item) => ({
      status: item.status,
      label: item.label,
      value: item.count,
    }));
    const ulokBar = (propertiData.perbulan_ulok ?? []).map((item) => ({
      month: String(item.bulan ?? "").substring(0, 3),
      approved: item.ulok_ok ?? 0,
      nok: item.ulok_nok ?? 0,
      inProgress: item.ulok_in_progress ?? 0,
    }));
    const kpltBar = (propertiData.perbulan_kplt ?? []).map((item) => ({
      month: String(item.bulan ?? "").substring(0, 3),
      approved: item.kplt_ok ?? 0,
      nok: item.kplt_nok ?? 0,
      inProgress: item.kplt_in_progress ?? 0,
      waitingforforum: item.kplt_waiting_for_forum ?? 0,
    }));

    // Override data donut chart jika specialist dipilih
    if (
      selectedSpecialistId &&
      propertiData.breakdown?.type === "user" &&
      propertiData.breakdown?.rows
    ) {
      const specialistRow = propertiData.breakdown.rows.find(
        (row: any) => row.user_id === selectedSpecialistId
      );
      if (specialistRow) {
        ulokDonut = [
          { status: "OK", label: "Approve", value: specialistRow.ulok_ok },
          { status: "NOK", label: "Reject", value: specialistRow.ulok_nok },
          {
            status: "In Progress",
            label: "In Progress",
            value: specialistRow.ulok_in_progress,
          },
        ].filter((i) => i.value > 0);
        kpltDonut = [
          { status: "OK", label: "Approve", value: specialistRow.kplt_ok },
          { status: "NOK", label: "Reject", value: specialistRow.kplt_nok },
          {
            status: "In Progress",
            label: "In Progress",
            value: specialistRow.kplt_in_progress,
          },
          {
            status: "Waiting for Forum",
            label: "Waiting for Forum",
            value: specialistRow.kplt_waiting_for_forum,
          },
        ].filter((i) => i.value > 0);
      }
    }
    return { ulokDonut, kpltDonut, ulokBar, kpltBar };
  }, [propertiData, selectedSpecialistId]);

  /**
   * Menyiapkan filter status untuk diteruskan ke komponen Peta.
   * Jika "Semua Status", kirim undefined agar peta menampilkan semua pin.
   */
  const childStatusFilter =
    statusValue === "Semua Status" ? undefined : [statusValue];

  /**
   * Render state Error.
   */
  if (isError) {
    return (
      <main className="space-y-4 lg:space-y-6">
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Gagal Memuat Data
            </h3>
            <p className="text-gray-600 mb-4">
              Terjadi kesalahan saat memuat data dashboard.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </main>
    );
  }

  /**
   * Render state Loading (Skeleton).
   */
  if (isLoading || !propertiData) {
    return (
      <main className="space-y-4 lg:space-y-6">
        <DashboardSkeleton />
      </main>
    );
  }

  /**
   * Render Utama Layout Dashboard.
   */
  return (
    <main className="space-y-4 lg:space-y-6">
      <>
        {/* --- Header & Filters Section --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard Performa
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Filter Cabang (Hanya untuk RM/GM) */}
            {(isRegionalManager || isGeneralManager) &&
              branchOptions.length > 0 && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <select
                    value={selectedBranchId || ""}
                    onChange={(e) => onBranchChange(e.target.value || null)}
                    className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer min-w-[200px]"
                  >
                    <option value="">
                      {isGeneralManager
                        ? "Semua Cabang (Nasional)"
                        : "Semua Cabang"}
                    </option>
                    {branchOptions.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.nama_cabang}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {/* Filter Specialist (Untuk LM/BM) */}
            {(isLocationManager || isBranchManager) &&
              propertiData.breakdown?.type === "user" && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <select
                    value={selectedSpecialistId || ""}
                    onChange={(e) => onSpecialistChange(e.target.value || null)}
                    className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer min-w-[200px]"
                  >
                    <option value="">Semua Specialist</option>
                    {lsOptions.map((specialist) => (
                      <option
                        key={(specialist as any).user_id}
                        value={(specialist as any).user_id}
                      >
                        {(specialist as any).nama}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              )}

            {/* Filter Tahun */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <YearPicker
                selectedYear={
                  propertiData.filters.year || new Date().getFullYear()
                }
                onYearChange={setYear}
                minYear={2017}
                maxYear={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>

        {/* --- Stats Cards Section --- */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {dynamicStatsData.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </div>

          {/* --- Charts Section --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DonutChart
              data={ulokDonut || []}
              title="Status ULOK"
              legendConfig={ulokLegendConfig}
            />
            <DonutChart
              data={kpltDonut || []}
              title="Status KPLT"
              legendConfig={kpltLegendConfig}
            />
            <BarChart
              data={ulokBar || []}
              title="Grafik ULOK Per Bulan"
              legendConfig={ulokBarLegendConfig}
            />
            <BarChart
              data={kpltBar || []}
              title="Grafik KPLT Per Bulan"
              legendConfig={kpltBarLegendConfig}
            />
          </div>

          {/* --- Map Section --- */}
          <div className="bg-white p-4 rounded-lg shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold flex-shrink-0">
                Peta Sebaran
              </h3>

              <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
                {/* Filter Tipe Peta */}
                <div className="relative">
                  <select
                    value={activeMapFilter}
                    onChange={(e) =>
                      onMapFilterChange(e.target.value as ActiveMapFilter)
                    }
                    className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer min-w-[140px]"
                  >
                    <option value="ulok">ULOK</option>
                    <option value="kplt">KPLT</option>
                    <option value="progress_kplt">Progress KPLT</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Filter Status Peta (Dynamic) */}
                <div className="relative">
                  <select
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value as any)}
                    className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer min-w-[140px]"
                    title="Filter status peta"
                  >
                    {STATUS_OPTIONS[activeMapFilter as ActiveMapFilter].map(
                      (s) => (
                        <option
                          key={s}
                          value={s}
                          className="py-[2px] leading-tight text-sm"
                        >
                          {s}
                        </option>
                      )
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="h-[400px] w-full">
              <PetaLokasiInteraktif
                data={propertiUntukPeta}
                isLoading={isMapLoading}
                statusFilter={childStatusFilter}
                activeMapFilter={activeMapFilter as ActiveMapFilter}
              />
            </div>
          </div>
        </div>
      </>
    </main>
  );
}
