// components/ui/progress_kplt/ProgressStatusCard.tsx
"use client";

import React from "react";

interface ProgressStatusCardProps {
  title: string;
  status: string | null | undefined;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
}

// Pindahkan helper ke sini agar bisa dipakai di semua card
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "-"; // Menangani format tanggal yang tidak valid
  }
};

const getStatus = (status: string | null | undefined) => {
  if (status === "Selesai") return "Done";
  if (status === "Belum") return "In Progress";
  if (status === "batal") return "Batal";
  return "Pending";
};

export const ProgressStatusCard: React.FC<ProgressStatusCardProps> = ({
  title,
  status,
  startDate,
  endDate,
}) => {
  return (
    <div className="mt-8 max-w-2xl w-full bg-white shadow-md rounded-2xl border border-gray-100 p-6 text-center animate-in fade-in duration-300 mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-3">
        <strong>Status:</strong> {getStatus(status)}
      </p>
      <p className="text-sm text-gray-500">
        <strong>Mulai:</strong> {formatDate(startDate)} |{" "}
        <strong>Selesai:</strong> {formatDate(endDate)}
      </p>
    </div>
  );
};
