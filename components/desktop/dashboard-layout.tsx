// components/desktop/dashboard-layout.tsx
"use client";

import React, { useMemo } from "react";
import { DashboardPageProps } from "@/types/common";
import { StatsCard } from "../ui/statscard";
import { DonutChart } from "../ui/donurchart";
import { BarChart } from "../ui/barchart";
import PetaLoader from "@/components/map/PetaLoader";

export default function DesktopDashboardLayout(props: DashboardPageProps) {
  const {
    propertiData, // Mengganti nama variabel agar lebih jelas
    isLoading,
    isError,
    setYear,
    selectedSpecialistId,
    onSpecialistChange,
  } = props;

  const isLocationManager = propertiData?.filters?.role === "location manager";

  // 🔹 Proses KPI dinamis (per specialist kalau dipilih)
  const dynamicStatsData = useMemo(() => {
    if (!propertiData) return [];

    let kpis = propertiData.kpis;

    // Kalau ada specialist dipilih → pakai datanya
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

  // 🔹 Data donut & bar dinamis (ikut specialist kalau dipilih)
  const { ulokDonut, kpltDonut, ulokBar, kpltBar } = useMemo(() => {
    if (!propertiData) return {};

    // default pakai data total dari API
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
    let ulokBar = propertiData.perbulan_ulok.map((item) => ({
      month: item.bulan.substring(0, 3),
      approved: item.ulok_approves ?? 0,
      status: (item.total_ulok ?? 0) - (item.ulok_approves ?? 0),
    }));
    let kpltBar = propertiData.perbulan_kplt.map((item) => ({
      month: item.bulan.substring(0, 3),
      approved: item.kplt_approves ?? 0,
      status: (item.total_kplt ?? 0) - (item.kplt_approves ?? 0),
    }));

    // kalau ada specialist dipilih → hitung ulang berdasarkan breakdown
    if (selectedSpecialistId && propertiData.breakdown?.rows) {
      const specialistRow = propertiData.breakdown.rows.find(
        (row) => row.user_id === selectedSpecialistId
      );

      if (specialistRow) {
        // 🔸 Donut ULOK/KPLT → hanya 2 kategori (OK vs Belum OK)
        ulokDonut = [
          { status: "OK", label: "Approve", value: specialistRow.ulok_ok },
          {
            status: "In Progress",
            label: "Belum Approve",
            value: specialistRow.ulok_total - specialistRow.ulok_ok,
          },
        ];
        kpltDonut = [
          { status: "OK", label: "Approve", value: specialistRow.kplt_ok },
          {
            status: "In Progress",
            label: "Belum Approve",
            value: specialistRow.kplt_total - specialistRow.kplt_ok,
          },
        ];

        // 🔸 Bar chart per bulan → di breakdown tidak ada data bulanan,
        // jadi bisa bikin data dummy per bulan (semua 0 kecuali total akhir).
        // Kalau API nanti support perbulan per specialist, tinggal ganti mapping-nya.
        ulokBar = propertiData.perbulan_ulok.map((item) => ({
          month: item.bulan.substring(0, 3),
          approved: 0,
          status: 0,
        }));
        kpltBar = propertiData.perbulan_kplt.map((item) => ({
          month: item.bulan.substring(0, 3),
          approved: 0,
          status: 0,
        }));

        // Atau kalau mau langsung taruh totalnya di bulan terakhir:
        if (ulokBar.length > 0) {
          ulokBar[ulokBar.length - 1] = {
            month: "Total",
            approved: specialistRow.ulok_ok,
            status: specialistRow.ulok_total - specialistRow.ulok_ok,
          };
        }
        if (kpltBar.length > 0) {
          kpltBar[kpltBar.length - 1] = {
            month: "Total",
            approved: specialistRow.kplt_ok,
            status: specialistRow.kplt_total - specialistRow.kplt_ok,
          };
        }
      }
    }

    return { ulokDonut, kpltDonut, ulokBar, kpltBar };
  }, [propertiData, selectedSpecialistId]);

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
                  <p className="text-gray-500 mt-1">
                    Menampilkan data untuk cabang:{" "}
                    <span className="font-semibold text-gray-700">
                      {propertiData.filters.branch_name}
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {/* --- FILTER BARU HANYA UNTUK MANAGER --- */}
                  {isLocationManager && propertiData.breakdown && (
                    <select
                      value={selectedSpecialistId || ""}
                      onChange={(e) =>
                        onSpecialistChange(e.target.value || null)
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Semua Specialist</option>
                      {/* Ambil daftar specialist dari `propertiData.breakdown.rows` */}
                      {propertiData.breakdown.rows.map((specialist) => (
                        <option
                          key={specialist.user_id}
                          value={specialist.user_id}
                        >
                          {specialist.nama}
                        </option>
                      ))}
                    </select>
                  )}
                  {/* Filter Tahun */}
                  <select
                    value={
                      propertiData.filters.year || new Date().getFullYear()
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
  );
}
