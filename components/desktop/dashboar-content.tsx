// components/dashboard/DashboardContent.tsx
"use client";
import React from "react";
import { StatsCard } from "../ui/statscard";
import { DonutChart } from "../ui/donurchart ";
import { BarChart } from "../ui/barchart";
import PetaLoader from "@/components/map/PetaLoader";
import { DashboardPageProps } from "@/types/common";

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
    icon: "/icons/folder_ungu.svg",
    color: "purple" as const,
  },
  {
    title: "Total KPLT",
    value: "1,654",
    icon: "/icons/approve.svg",
    color: "green" as const,
  },
  {
    title: "Persentase ULOK",
    value: "78.5%",
    icon: "/icons/persentase.svg",
    color: "blue" as const,
  },
  {
    title: "Persentase KPLT",
    value: "86.0%",
    icon: "/icons/persentase_approve.svg",
    color: "green" as const,
  },
];

const donutChartData = [
  { label: "Approve", value: 73.3, color: "#22c55e" },
  { label: "Pending", value: 26.7, color: "#f59e0b" },
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

export default function DashboardContent(props: DashboardPageProps) {
  const { propertiData } = props;

  return (
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
        <DonutChart data={donutChartData} title="Persentase ULOK Approve" />
        <BarChart data={barChartData} title="Grafik ULOK Per Bulan" />
      </div>

      {/* Map Section */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <div className="h-[400px] w-full">
          <PetaLoader data={propertiData} />
        </div>
      </div>
    </div>
  );
}
