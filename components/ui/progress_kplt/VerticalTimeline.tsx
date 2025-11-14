// components/ui/progress_kplt/VerticalProgressTimeline.tsx
"use client";

import React from "react";

export interface ProgressStep {
  id: string;
  progress_id: string;
  nama_tahap: string;
  status: "Done" | "In Progress" | "Pending" | "Batal";
  start_date: string | null;
  end_date: string | null;
  urutan: number;
}

interface VerticalProgressTimelineProps {
  steps: ProgressStep[];
  activeStep: number | null;
  onStepClick: (index: number) => void;
}

const formatDate = (date: string | null) => {
  if (!date) return "";
  const d = new Date(date);
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function VerticalProgressTimeline({
  steps,
  activeStep,
  onStepClick,
}: VerticalProgressTimelineProps) {
  const formatDateRange = (
    startDate: string | null,
    endDate: string | null
  ) => {
    if (!startDate) return null;

    const formattedStartDate = formatDate(startDate);

    if (!endDate) {
      return formattedStartDate;
    }

    return `${formattedStartDate} - ${formatDate(endDate)}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Done":
        return "Selesai";
      case "In Progress":
        return "Sedang Berjalan";
      case "Pending":
        return "Belum Dijadwalkan";
      case "Batal":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">Timeline Progress</h2>
      </div>

      <div className="relative">
        {steps.map((step, index) => {
          const isDone = step.status === "Done";
          const isInProgress = step.status === "In Progress";
          const isBatal = step.status === "Batal";
          const isActive = activeStep === index;

          const dotColor = isDone
            ? "bg-submit"
            : isInProgress
            ? "bg-yellow-500"
            : isBatal
            ? "bg-red-500"
            : "bg-gray-300";

          const isLastItem = index === steps.length - 1;
          const dateRange = formatDateRange(step.start_date, step.end_date);

          return (
            <div
              key={step.id}
              className={`relative ${
                !isLastItem ? "pb-10" : ""
              } cursor-pointer group`}
              onClick={() => onStepClick(index)}
            >
              {/* Garis vertikal penghubung */}
              {!isLastItem && (
                <div className="absolute top-6 left-[9px] bottom-0 w-[2px] bg-gray-200" />
              )}

              <div className="flex items-start gap-4">
                {/* Dot timeline - 20px */}
                <div
                  className={`relative z-10 flex-shrink-0 w-5 h-5 rounded-full transition-all ${dotColor} ${
                    isActive ? "ring-2 ring-black " : ""
                  }`}
                />

                {/* Content */}
                <div className="flex-1">
                  {/* Nama Step - 18px */}
                  <h3
                    className={`text-lg font-semibold mb-1 ${
                      isActive ? "text-gray-900" : "text-gray-800"
                    }`}
                  >
                    {step.nama_tahap}
                  </h3>

                  {/* Tanggal atau Status */}
                  {dateRange ? (
                    <p className="text-sm text-gray-500">{dateRange}</p>
                  ) : (
                    <span
                      className={`inline-block text-xs px-3 py-1 rounded-full ${
                        isDone
                          ? "bg-green-100 text-green-700"
                          : isInProgress
                          ? "bg-blue-100 text-blue-700"
                          : isBatal
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {getStatusText(step.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
