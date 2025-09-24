// components/desktop/dashboard-layout.tsx
"use client";
import React from "react"; // Tambahkan React jika belum ada
import { useSidebar } from "@/hooks/useSidebar";
import Sidebar from "@/components/desktop/sidebar";
import Navbar from "@/components/desktop/navbar";
import { DashboardPageProps } from "@/types/common";

// Imports yang dipindahkan dari DashboardContent
import { StatsCard } from "../ui/statscard";
import { DonutChart } from "../ui/donurchart";
import { BarChart } from "../ui/barchart";
import PetaLoader from "@/components/map/PetaLoader";

// Data yang dipindahkan dari DashboardContent
const statsData = [
  {
    title: "Total ULOK",
    value: "2,847",
    icon: "/icons/folder.svg",
    color: "blue" as const,
  },
  {
    title: "Total KPLT",
    value: "1,923",
    icon: "/icons/kplt_ungu.svg",
    color: "purple" as const,
  },
  {
    title: "Total KPLT OK",
    value: "1,654",
    icon: "/icons/approve.svg",
    color: "green" as const,
  },
  {
    title: "Persentase ULOK OK",
    value: "78.5%",
    icon: "/icons/persentase.svg",
    color: "blue" as const,
  },
  {
    title: "Persentase KPLT OK",
    value: "86.0%",
    icon: "/icons/persentase_approve.svg",
    color: "green" as const,
  },
];

const donutChartData = [
  { label: "Approve", value: 74 },
  { label: "Pending", value: 26 },
];

const barChartData = [
  { month: "Jan", approved: 45, pending: 20 },
  { month: "Feb", approved: 52, pending: 25 },
  { month: "Mar", approved: 35, pending: 30 },
  { month: "Apr", approved: 48, pending: 22 },
  { month: "May", approved: 65, pending: 35 },
  { month: "Jun", approved: 58, pending: 28 },
  { month: "Jul", approved: 70, pending: 40 },
  { month: "Aug", approved: 45, pending: 25 },
  { month: "Sep", approved: 82, pending: 45 },
  { month: "Oct", approved: 68, pending: 30 },
  { month: "Nov", approved: 75, pending: 35 },
  { month: "Dec", approved: 85, pending: 38 },
];

export default function DesktopDashboardLayout(props: DashboardPageProps) {
  const { propertiData, isLoading, isError } = props;
  const { isCollapsed } = useSidebar();

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
            // Skeleton Loading State
            <div className="space-y-6">
              <div className="h-9 w-1/3 bg-gray-200 rounded animate-pulse"></div>

              {/* Stats Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-200 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>

              {/* Charts Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>

              {/* Map Skeleton */}
              <div className="h-[400px] bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ) : isError ? (
            // Error State
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
            // Content Loaded State
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                  Dashboard Performa
                </h1>
                <div className="flex items-center space-x-2">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Tahun</option>
                    <option>2024</option>
                    <option>2023</option>
                  </select>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>2025</option>
                    <option>2024</option>
                    <option>2023</option>
                  </select>
                </div>
              </div>

              {/* KODE DARI DASHBOARDCONTENT DIMASUKKAN DI SINI */}
              <div className="space-y-6">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {statsData.map((stat, index) => (
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
                    data={donutChartData}
                    title="Persentase ULOK Approve"
                  />
                  <BarChart data={barChartData} title="Grafik ULOK Per Bulan" />
                </div>

                {/* Map Section */}
                <div className="bg-white p-4 rounded-lg shadow-md shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
                  <div className="h-[400px] w-full">
                    <PetaLoader data={propertiData} />
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
