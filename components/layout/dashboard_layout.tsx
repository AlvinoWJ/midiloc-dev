"use client";

import React, { useMemo, useEffect, useState } from "react";
import { DashboardPageProps } from "@/types/common";
import { StatsCard } from "../ui/statscard";
import { DonutChart } from "../ui/donutchart";
import { BarChart } from "../ui/barchart";
import dynamic from "next/dynamic";
import { DashboardSkeleton } from "../ui/skleton";
import YearPicker from "../ui/yearpicker";

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

// Legends
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

// --- PERUBAHAN 1: Tambahkan Tipe dan Status untuk Progress KPLT ---
type ActiveMapFilter = "ulok" | "kplt" | "progress_kplt"; 

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
  "Grand Opening"
] as const,
};

// Tipe gabungan untuk state status
type AnyStatus = 
  | (typeof STATUS_OPTIONS.ulok)[number]
  | (typeof STATUS_OPTIONS.kplt)[number]
  | (typeof STATUS_OPTIONS.progress_kplt)[number];

export default function DashboardLayout(props: DashboardPageProps) {
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

  const userRole = propertiData?.filters?.role?.toLowerCase?.() || "";

  // Tambahan peran
  const isLocationManager = userRole === "location manager";
  const isBranchManager = userRole === "branch manager"; // BARU: BM ikut pola LM
  const isRegionalManager = userRole === "regional manager";
  const isGeneralManager = userRole === "general manager"; // BARU: GM bisa filter semua cabang

// --- PERUBAHAN 2: Tipe state statusValue diperbarui ---
const [statusValue, setStatusValue] = useState<AnyStatus>("Semua Status");

 // --- PERUBAHAN 3: useEffect diperbarui untuk 3 tipe ---
useEffect(() => {
    // Tentukan opsi yang valid berdasarkan filter Tipe
 const options = STATUS_OPTIONS[activeMapFilter as ActiveMapFilter];
    
    // @ts-ignore - Biarkan untuk pengecekan dinamis
 if (!options.includes(statusValue)) {
   setStatusValue("Semua Status");
  }
 }, [activeMapFilter, statusValue]);

  // Branch options cache (untuk RM/GM)
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

  // LS options cache (untuk LM/BM)
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

  // KPI
  const dynamicStatsData = useMemo(() => {
    if (!propertiData) return [];
    let kpis = propertiData.kpis;

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

  // Donut & Bar
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

  // Filter peta berdasar tahun (FE)
  const filteredProperti = useMemo(() => {
    const dataToFilter = Array.isArray(propertiUntukPeta)
      ? propertiUntukPeta
      : [];
    if (dataToFilter.length === 0) return [];

    const selectedYear = propertiData?.filters?.year;
    if (!selectedYear) return dataToFilter;

    return dataToFilter.filter((lokasi: any) => {
      if (!lokasi.created_at) return false;
      const y = new Date(lokasi.created_at).getFullYear();
      return y === selectedYear;
    });
  }, [propertiUntukPeta, propertiData?.filters?.year]);

  const getYearDate = (year: number | undefined | null) => {
    const yearToUse = year || new Date().getFullYear();
    return new Date(yearToUse, 0, 1);
  };

  // Bentuk statusFilter untuk komponen peta
  const currentStatusOptions =
    activeMapFilter === "ulok" ? STATUS_OPTIONS.ulok : STATUS_OPTIONS.kplt;    activeMapFilter === "ulok" ? STATUS_OPTIONS.ulok : STATUS_OPTIONS.kplt;

  const childStatusFilter =
    statusValue === "Semua Status" ? undefined : [statusValue];


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

  if (isLoading || !propertiData) {
    return (
      <main className="space-y-4 lg:space-y-6">
        <DashboardSkeleton />
      </main>
    );
  }

  return (
    <main className="space-y-4 lg:space-y-6">
      <>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard Performa
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* --- FILTER BRANCH (untuk RM / GM) --- */}
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

            {/* --- FILTER SPECIALIST (untuk LM & BM) --- */}
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

            {/* --- FILTER TAHUN --- */}
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

        <div className="space-y-6">
          {/* KPI */}
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

          {/* Charts */}
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

          {/* Map */}
          <div className="bg-white p-4 rounded-lg shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
            {/* */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold flex-shrink-0">
                Peta Sebaran
              </h3>

              {/* */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
                {/* Dropdown ULOK/KPLT */}
                <div className="relative">
                  {" "}
                  {/* DIBUNGKUS DIV RELATIVE */}
                  <select
                    value={activeMapFilter}
                    onChange={(e) =>
                      onMapFilterChange(e.target.value as ActiveMapFilter)
                    }
                    // --- pl-10 diubah menjadi pl-4 ---
                    className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer min-w-[140px]"
                  >
                    <option value="ulok">ULOK</option>
                    <option value="kplt">KPLT</option>
                    <option value="progress_kplt">Progress KPLT</option>
                  </select>
                  {/* --- PANAH BAWAH BARU --- */}
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

                {/* Dropdown Status (sejajar dengan ULOK/KPLT) */}
                <div className="relative">
                  {" "}
                  {/* DIBUNGKUS DIV RELATIVE */}
                 <select
  value={statusValue}
  onChange={(e) => setStatusValue(e.target.value as any)}
  className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer min-w-[140px]"
  title="Filter status peta"
>
  {(STATUS_OPTIONS[activeMapFilter as ActiveMapFilter]).map((s) => (
    <option
      key={s}
      value={s}
      className="py-[2px] leading-tight text-sm"
    >
      {s}
    </option>
  ))}
</select>

                  {/* --- PANAH BAWAH BARU --- */}
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
