// components/desktop/dashboard-layout.tsx
"use client";

import React, { useMemo } from "react";
import { DashboardPageProps } from "@/types/common";
import { StatsCard } from "../ui/statscard";
import { DonutChart } from "../ui/donurchart";
import { BarChart } from "../ui/barchart";
import dynamic from "next/dynamic";

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

// 🔹 KONFIGURASI LEGEND STATIS UNTUK DONUT CHART
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

// 🔹 KONFIGURASI LEGEND UNTUK BAR CHART
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

export default function DesktopDashboardLayout(props: DashboardPageProps) {
  const {
    propertiData,
    propertiUntukPeta,
    isLoading,
    isError,
    setYear,
    selectedSpecialistId,
    onSpecialistChange,
  } = props;

  const isLocationManager = propertiData?.filters?.role === "location manager";

  // 🔹 Proses KPI dinamis (tidak ada perubahan, sudah sesuai)
  const dynamicStatsData = useMemo(() => {
    if (!propertiData) return [];
    let kpis = propertiData.kpis;

    if (selectedSpecialistId && propertiData.breakdown?.rows) {
      const specialistRow = propertiData.breakdown.rows.find(
        (row) => row.user_id === selectedSpecialistId
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

    const formatPercent = (val: number = 0) => `${val.toFixed(1)}%`;

    return [
      {
        title: "Total ULOK",
        value: kpis.total_ulok.toLocaleString("id-ID"),
        icon: "/icons/folder.svg",
        color: "blue" as const,
      },
      {
        title: "Total KPLT",
        value: kpis.total_kplt.toLocaleString("id-ID"),
        icon: "/icons/kplt_ungu.svg",
        color: "purple" as const,
      },
      {
        title: "Total KPLT OK",
        value: kpis.total_kplt_approves.toLocaleString("id-ID"),
        icon: "/icons/approve.svg",
        color: "green" as const,
      },
      {
        title: "Persentase ULOK OK",
        value: formatPercent(kpis.presentase_ulok_approves),
        icon: "/icons/persentase.svg",
        color: "blue" as const,
      },
      {
        title: "Persentase KPLT OK",
        value: formatPercent(kpis.presentase_kplt_approves),
        icon: "/icons/persentase_approve.svg",
        color: "green" as const,
      },
    ];
  }, [propertiData, selectedSpecialistId]);

  // 🔹 Data donut & bar dinamis disesuaikan
  const { ulokDonut, kpltDonut, ulokBar, kpltBar } = useMemo(() => {
    if (!propertiData) return {};

    // Tampilan default (semua specialist)
    let ulokDonut = propertiData.donut_ulok.map((item) => ({
      status: item.status,
      label: item.label,
      value: item.count,
    }));
    let kpltDonut = propertiData.donut_kplt.map((item) => ({
      status: item.status,
      label: item.label,
      value: item.count,
    }));
    // Data Bar Chart akan selalu menampilkan data total
    let ulokBar = propertiData.perbulan_ulok.map((item) => ({
      month: item.bulan.substring(0, 3),
      approved: item.ulok_ok ?? 0,
      nok: item.ulok_nok ?? 0,
      inProgress: item.ulok_in_progress ?? 0,
    }));
    let kpltBar = propertiData.perbulan_kplt.map((item) => ({
      month: item.bulan.substring(0, 3),
      approved: item.kplt_ok ?? 0,
      nok: item.kplt_nok ?? 0,
      inProgress: item.kplt_in_progress ?? 0,
      waiting: item.kplt_waiting_for_forum ?? 0,
    }));

    // Tampilan jika ada specialist yang dipilih
    if (selectedSpecialistId && propertiData.breakdown?.rows) {
      const specialistRow = propertiData.breakdown.rows.find(
        (row) => row.user_id === selectedSpecialistId
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
        ].filter((item) => item.value > 0);

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
        ].filter((item) => item.value > 0);
      }
    }

    return { ulokDonut, kpltDonut, ulokBar, kpltBar };
  }, [propertiData, selectedSpecialistId]);

  // 🔹 Logika filter peta (tidak ada perubahan)
  const filteredProperti = useMemo(() => {
    const dataToFilter = propertiUntukPeta || [];
    if (dataToFilter.length === 0) return [];

    const selectedYear = propertiData?.filters.year;
    if (!selectedYear) return dataToFilter;

    return dataToFilter.filter((lokasi) => {
      if (!lokasi.created_at) return false;
      const lokasiYear = new Date(lokasi.created_at).getFullYear();
      return lokasiYear === selectedYear;
    });
  }, [propertiUntukPeta, propertiData?.filters.year]);

  console.log("ulokBar:", ulokBar);
  console.log("kpltBar:", kpltBar);

  return (
    <div className="flex">
      <main className="flex-1 p-6">
        {isLoading ? (
          // SKELETON LOADING STATE (sudah bagus)
          <div className="space-y-6">
            <div className="h-9 w-1/3 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-[400px] bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        ) : isError ? (
          // ERROR STATE (sudah bagus)
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
        ) : (
          // CONTENT LOADED STATE
          propertiData && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    Dashboard Performa
                  </h1>
                  <p className="text-gray-500 mt-2">
                    Menampilkan data untuk cabang:{" "}
                    <span className="font-semibold text-gray-700">
                      {propertiData.filters.branch_id}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* --- FILTER BARU HANYA UNTUK MANAGER --- */}
                  {isLocationManager && propertiData.breakdown && (
                    <div className="relative group">
                      {/* Icon Users */}
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
                        onChange={(e) =>
                          onSpecialistChange(e.target.value || null)
                        }
                        className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer min-w-[200px]"
                      >
                        <option value="">Semua Specialist</option>
                        {propertiData.breakdown.rows.map((specialist) => (
                          <option
                            key={specialist.user_id}
                            value={specialist.user_id}
                          >
                            {specialist.nama}
                          </option>
                        ))}
                      </select>

                      {/* Tombol X untuk Reset Specialist - Muncul jika ada yang dipilih */}
                      {selectedSpecialistId && (
                        <button
                          onClick={() => onSpecialistChange(null)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors z-10"
                          title="Hapus filter specialist"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Icon Chevron Down - Muncul jika tidak ada yang dipilih */}
                      {!selectedSpecialistId && (
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
                      )}
                    </div>
                  )}

                  {/* Year Filter */}
                  <div className="relative group">
                    {/* Icon Calendar */}
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

                    <select
                      value={
                        propertiData.filters.year || new Date().getFullYear()
                      }
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="appearance-none w-full sm:w-auto bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer min-w-[140px]"
                    >
                      <option value={2025}>2025</option>
                      <option value={2024}>2024</option>
                      <option value={2023}>2023</option>
                    </select>

                    {/* Tombol X untuk Reset Tahun - Muncul jika bukan tahun default */}
                    {propertiData.filters.year &&
                      propertiData.filters.year !==
                        new Date().getFullYear() && (
                        <button
                          onClick={() => setYear(new Date().getFullYear())}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors z-10"
                          title="Reset ke tahun sekarang"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}

                    {/* Icon Chevron Down - Muncul jika tahun default */}
                    {(!propertiData.filters.year ||
                      propertiData.filters.year ===
                        new Date().getFullYear()) && (
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
                    )}
                  </div>

                  {/* Anda bisa menambahkan filter cabang di sini jika perlu */}
                </div>
              </div>

              <div className="space-y-6">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                {/* Charts Section */}
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

                {/* Map Section */}
                <div className="bg-white p-4 rounded-lg shadow-[1px_1px_6px_rgba(0,0,0,0.25)] ">
                  <h3 className="text-lg font-semibold mb-2">Peta Sebaran</h3>
                  <div className="h-[400px] w-full">
                    <PetaLokasiInteraktif
                      data={filteredProperti}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
