// components/desktop/dashboard-layout.tsx
"use client";

import React, { useMemo } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import { DashboardPageProps } from "@/types/common";

// UI Components
import { StatsCard } from "../ui/statscard";
import { DonutChart } from "../ui/donurchart";
import { BarChart } from "../ui/barchart";
import PetaLoader from "@/components/map/PetaLoader";

export default function DesktopDashboardLayout(props: DashboardPageProps) {
  const {
    propertiData: dashboardData, // Mengganti nama variabel agar lebih jelas
    isLoading,
    isError,
    setYear,
    // setBranchId, // Anda bisa uncomment jika ada filter cabang
  } = props;
  const { isCollapsed } = useSidebar();

  // 1. MEMPROSES DATA KPI UNTUK STATS CARD
  // Gunakan useMemo agar kalkulasi tidak diulang setiap kali render
  const dynamicStatsData = useMemo(() => {
    if (!dashboardData) return [];
    const { kpis } = dashboardData;
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
  }, [dashboardData]);

  // 2. MEMPROSES DATA UNTUK SEMUA CHART
  const { ulokDonut, kpltDonut, ulokBar, kpltBar } = useMemo(() => {
    if (!dashboardData) return {};
    // Donut charts: Ubah 'count' menjadi 'value' sesuai kebutuhan komponen
    const ulokDonut = dashboardData.donut_ulok.map((item) => ({
      status: item.status,
      label: item.label,
      value: item.count,
    }));
    const kpltDonut = dashboardData.donut_kplt.map((item) => ({
      status: item.status,
      label: item.label,
      value: item.count,
    }));

    // Bar charts: Ubah 'bulan' menjadi 'month' dan hitung 'pending'
    const ulokBar = dashboardData.perbulan_ulok.map((item) => ({
      month: item.bulan.substring(0, 3),
      approved: item.ulok_approves ?? 0,
      status: (item.total_ulok ?? 0) - (item.ulok_approves ?? 0),
    }));
    const kpltBar = dashboardData.perbulan_kplt.map((item) => ({
      month: item.bulan.substring(0, 3),
      approved: item.kplt_approves ?? 0,
      status: (item.total_kplt ?? 0) - (item.kplt_approves ?? 0),
    }));

    return { ulokDonut, kpltDonut, ulokBar, kpltBar };
  }, [dashboardData]);

  return (
    <div className="flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[270px]"
        }`}
      >
        <Navbar />
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
            dashboardData && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                      Dashboard Performa
                    </h1>
                    <p className="text-gray-500 mt-1">
                      Menampilkan data untuk cabang:{" "}
                      <span className="font-semibold text-gray-700">
                        {dashboardData.filters.branch_name}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={
                        dashboardData.filters.year || new Date().getFullYear()
                      }
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value={2025}>2025</option>
                      <option value={2024}>2024</option>
                      <option value={2023}>2023</option>
                    </select>
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
                    <DonutChart data={ulokDonut || []} title="Status ULOK" />
                    <DonutChart data={kpltDonut || []} title="Status KPLT" />
                    <BarChart data={ulokBar || []} title="Grafik ULOK " />
                    <BarChart data={kpltBar || []} title="Grafik KPLT" />
                  </div>

                  {/* Map Section */}
                  <div className="bg-white p-4 rounded-lg shadow-md shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
                    <h3 className="text-lg font-semibold mb-2">Peta Sebaran</h3>
                    <div className="h-[400px] w-full">
                      {/* CATATAN: Response API saat ini tidak menyertakan data koordinat (lat/lng).
                          Anda perlu menyesuaikan API atau komponen ini jika data peta ada di tempat lain. */}
                      <PetaLoader data={[]} />
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </main>
      </div>
    </div>
  );
}
