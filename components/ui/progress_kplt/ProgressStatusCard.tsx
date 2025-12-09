"use client";

import React from "react";

/**
 * Interface untuk props kartu status.
 * Mengizinkan nilai null/undefined untuk mengakomodasi data API yang mungkin kosong.
 */
interface ProgressStatusCardProps {
  title: string;
  status: string | null | undefined;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
}

/**
 * Helper: Format tanggal ke format lokal Indonesia (dd MMMM yyyy).
 * Menangani kasus string tanggal kosong, null, atau tidak valid.
 */
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "-"; // Fallback jika format tanggal invalid
  }
};

/**
 * Helper: Mapping status dari backend ke label UI yang seragam.
 * - "Selesai" -> "Done"
 * - "Belum"   -> "In Progress"
 * - "batal"   -> "Batal"
 * - Lainnya   -> "Pending"
 */
const getStatus = (status: string | null | undefined) => {
  if (status === "Selesai") return "Done";
  if (status === "Belum") return "In Progress";
  if (status === "batal") return "Batal";
  return "Pending";
};

/**
 * Komponen ProgressStatusCard.
 * Digunakan untuk menampilkan ringkasan status dari sebuah tahapan (stage)
 * dalam workflow KPLT (misal: "Status Perizinan", "Status Renovasi").
 */
export const ProgressStatusCard: React.FC<ProgressStatusCardProps> = ({
  title,
  status,
  startDate,
  endDate,
}) => {
  return (
    <div className="w-full bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-2xl border border-gray-100 p-6 text-center animate-in fade-in duration-300">
      {/* Judul Tahapan (misal: "Perizinan") */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>

      {/* Label Status Terformat */}
      <p className="text-lg text-gray-600 mb-3">
        <strong>Status:</strong> {getStatus(status)}
      </p>

      {/* Periode Waktu (Mulai - Selesai) */}
      <p className="text-base text-gray-500">
        <strong>Mulai:</strong> {formatDate(startDate)} |{" "}
        <strong>Selesai:</strong> {formatDate(endDate)}
      </p>
    </div>
  );
};
