"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/statusbadge";
import Link from "next/link";
import { useState } from "react";

/**
 * InfoCardProps
 * Props yang digunakan untuk menampilkan data ULok dalam bentuk card.
 */
type InfoCardProps = {
  id: string; // ID unik data
  nama: string; // Nama lokasi / pengusul
  alamat: string; // Alamat lokasi
  created_at: string; // Tanggal dibuat (ISO string)
  status: string; // Status ULok (In Progress, Approved, dsb)
  detailPath: string; // Path menuju halaman detail
  has_file_intip?: boolean; // Status kelengkapan file intip
  has_form_ukur?: boolean; // Status kelengkapan form ukur
};

export function InfoCard({
  id,
  nama,
  alamat,
  created_at,
  status,
  detailPath,
  has_file_intip,
  has_form_ukur,
}: InfoCardProps) {
  // State untuk menampilkan tooltip badge
  const [showTooltip, setShowTooltip] = useState(false);

  // Format tanggal sesuai lokal Indonesia
  const formattedDate = new Date(created_at).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  /**
   * Hitung jumlah data yang belum lengkap.
   * Jika has_file_intip === false → dianggap missing
   * Jika has_form_ukur === false → dianggap missing
   */
  const missingDataCount = [
    has_file_intip === false,
    has_form_ukur === false,
  ].filter(Boolean).length;

  /**
   * Menentukan warna badge berdasarkan jumlah data yang hilang.
   * Hijau → lengkap
   * Merah → ada data yang hilang
   */
  const getBadgeColor = () => {
    if (missingDataCount === 0) return "bg-green-500";
    return "bg-red-500";
  };

  /**
   * Menentukan pesan tooltip.
   * Contoh: "Data Intip kosong" atau "Data Intip & Form Ukur kosong"
   */
  const getTooltipMessage = () => {
    if (missingDataCount === 0) return "Data lengkap";

    const missing = [];
    if (!has_file_intip) missing.push("Data Intip");
    if (!has_form_ukur) missing.push("Form Ukur");

    return `${missing.join(" & ")} kosong`;
  };

  // Cek apakah status adalah "In Progress"
  const isInProgress = status.toLowerCase() === "in progress";

  // Badge hanya muncul jika:
  // 1. Ada data yang hilang
  // 2. Status masih "In Progress"
  const shouldShowBadge = missingDataCount > 0 && isInProgress;

  return (
    // Bungkus card dengan Link menuju halaman detail
    <Link href={`${detailPath}/${id}`} className="block">
      <Card className="w-full min-h-[192px] flex flex-col justify-between shadow-md hover:shadow-[1px_1px_6px_rgba(0,0,0,0.25)] transition-shadow duration-300 relative">
        {/* Badge indikator data yang belum lengkap */}
        {shouldShowBadge && (
          <div
            className="absolute top-3 right-3 z-10"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {/* Badge jumlah data hilang */}
            <div
              className={`${getBadgeColor()} text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-110`}
            >
              {missingDataCount}
            </div>

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute top-[-40px] right-0 bg-gray-800 text-white text-xs py-2 px-3 rounded-md whitespace-nowrap shadow-lg animate-fade-in">
                {getTooltipMessage()}
                <div className="absolute bottom-[-4px] right-3 w-2 h-2 bg-gray-800 transform rotate-45"></div>
              </div>
            )}
          </div>
        )}

        {/* Header card: Nama, alamat, dan icon edit */}
        <CardHeader className="flex flex-row justify-between items-start space-y-0 pr-7">
          <div className="flex-1 min-w-0 pr-2">
            <CardTitle className="text-lg lg:text-xl capitalize line-clamp-1">
              {nama}
            </CardTitle>

            <CardDescription className="line-clamp-1 text-gray-700 text-sm lg:text-base font-medium mt-1">
              {alamat}
            </CardDescription>
          </div>

          {/* Icon edit (statik / dekoratif) */}
          <Image
            src="/icons/Edit.png"
            alt="edit Logo"
            width={24}
            height={24}
            className="text-gray-500 flex-shrink-0 lg:w-[27px] lg:h-[27px]"
          />
        </CardHeader>

        {/* Footer card: badge status + tanggal dibuat */}
        <CardFooter className="flex justify-between items-center gap-4 pt-2">
          <StatusBadge status={status} /> {/* Badge status ULok */}
          <span className="text-gray-700 text-m lg:text-base font-medium">
            {formattedDate}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
