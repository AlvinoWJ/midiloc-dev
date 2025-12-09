/**
 * TokoExistingInfoCard
 * --------------------
 * Komponen kartu informasi untuk menampilkan detail toko existing.
 *
 * Informasi yang ditampilkan:
 * - Nama toko (title)
 * - Alamat toko
 * - Tanggal Grand Opening (diformat ke format Indonesia)
 * - Status habis sewa (dihitung dalam Tahun/Bulan/Hari)
 * - Tombol untuk menuju halaman detail toko
 *
 * Fitur Utama:
 * - Format tanggal ke bahasa Indonesia
 * - Perhitungan sisa sewa secara dinamis berdasarkan tanggal hari ini
 * - Style card yang konsisten menggunakan komponen UI shadcn
 */

import React from "react";
import Link from "next/link";
import { Calendar, Hash, MapPin } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TokoExistingInfoCardProps {
  id: string;
  nama: string;
  alamat: string;
  tgl_go: string;
  kode_toko: string;
  habis_sewa: string;
  detailPath: string; // path ke halaman detail
}

export function TokoExistingInfoCard({
  id,
  nama,
  alamat,
  tgl_go,
  kode_toko,
  habis_sewa,
  detailPath,
}: TokoExistingInfoCardProps) {
  /**
   * formatTanggal
   * -------------------
   * Mengubah string tanggal menjadi format tanggal Indonesia:
   * contoh: "2023-12-01" → "1 Desember 2023"
   */
  const formatTanggal = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * hitungSisaSewa
   * -------------------
   * Menghitung sisa waktu sewa dari tanggal hari ini ke tanggal habis sewa.
   *
   * Output:
   * - "2 Tahun 3 Bulan"
   * - "3 Bulan 12 Hari"
   * - "Sudah Habis" (jika tanggal sudah lewat)
   * - "Hari Ini Habis" (jika tepat hari ini)
   */
  const hitungSisaSewa = (dateString: string) => {
    if (!dateString) return "-";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(dateString);
    endDate.setHours(0, 0, 0, 0);

    // Jika sudah lewat
    if (endDate < today) return "Sudah Habis";

    let years = endDate.getFullYear() - today.getFullYear();
    let months = endDate.getMonth() - today.getMonth();
    let days = endDate.getDate() - today.getDate();

    // Koreksi hari negatif
    if (days < 0) {
      months--;
      const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    // Koreksi bulan negatif
    if (months < 0) {
      years--;
      months += 12;
    }

    const parts = [];

    if (years > 0) {
      parts.push(`${years} Tahun`);
      if (months > 0) parts.push(`${months} Bulan`);
    } else {
      if (months > 0) parts.push(`${months} Bulan`);
      if (days > 0) parts.push(`${days} Hari`);
    }

    if (parts.length === 0)
      return days === 0 ? "Hari Ini Habis" : "Segera Habis";

    return parts.join(" ");
  };

  return (
    <Card className="w-full min-h-[192px] flex flex-col justify-between shadow-md hover:shadow-[1px_1px_6px_rgba(0,0,0,0.25)] transition-shadow duration-300">
      {/* -------------------- Isi Konten Kartu -------------------- */}
      <CardContent className="flex-grow space-y-2 py-3">
        {/* Title + Kode Toko */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <CardTitle className="text-lg lg:text-xl capitalize line-clamp-1 flex-grow">
            {nama}
          </CardTitle>

          {/* Badge kode toko */}
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded border border-blue-400">
            {kode_toko}
          </span>
        </div>

        {/* Alamat */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="font-medium">{alamat}</span>
        </div>

        {/* Grand Opening */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="font-medium">
            Grand Opening: {formatTanggal(tgl_go)}
          </span>
        </div>

        {/* Sisa Sewa */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Hash className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="font-medium">
            Habis Sewa: {hitungSisaSewa(habis_sewa)}
          </span>
        </div>
      </CardContent>

      {/* -------------------- Footer (Button Detail) -------------------- */}
      <CardFooter className="flex justify-between items-center gap-3 p-3">
        <Link href={`${detailPath}${id}`} passHref className="w-full">
          <Button
            size="sm"
            className="w-full bg-red-500 hover:bg-red-600 rounded text-white gap-2 h-9 text-sm font-semibold"
          >
            Lihat Detail
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
