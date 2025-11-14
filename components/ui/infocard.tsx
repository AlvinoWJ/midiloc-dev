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

type InfoCardProps = {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string;
  detailPath: string;
  has_file_intip?: boolean;
  has_form_ukur?: boolean;
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
  const [showTooltip, setShowTooltip] = useState(false);

  // Format tanggal jadi lebih rapi
  const formattedDate = new Date(created_at).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const missingDataCount = [
    has_file_intip === false,
    has_form_ukur === false,
  ].filter(Boolean).length;

  // Tentukan warna badge berdasarkan jumlah data kosong
  const getBadgeColor = () => {
    if (missingDataCount === 0) return "bg-green-500";
    return "bg-red-500";
  };

  // Generate pesan tooltip
  const getTooltipMessage = () => {
    if (missingDataCount === 0) return "Data lengkap";
    const missing = [];
    if (!has_file_intip) missing.push("Data Intip");
    if (!has_form_ukur) missing.push("Form Ukur");
    return `${missing.join(" & ")} kosong`;
  };

  const isInProgress = status.toLowerCase() === "in progress";
  const shouldShowBadge = missingDataCount > 0 && isInProgress;

  return (
    <Link href={`${detailPath}/${id}`} className="block">
      <Card className="w-full min-h-[192px] flex flex-col justify-between shadow-[1px_1px_6px_rgba(0,0,0,0.25)] hover:shadow-lg transition-shadow duration-300 relative">
        {/* Badge Notifikasi */}
        {shouldShowBadge && (
          <div
            className="absolute top-4 right-4 z-10"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
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

        <CardHeader className="flex flex-row justify-between items-start space-y-0">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl capitalize truncate">
              {nama}
            </CardTitle>
            <CardDescription className="truncate w-[230px] text-gray-700 text-m font-medium">
              {alamat}
            </CardDescription>
          </div>
          <Image
            src="/icons/Edit.png"
            alt="edit Logo"
            width={27}
            height={27}
            className="text-gray-500"
          />
        </CardHeader>

        <CardFooter className="flex justify-between items-center gap-4">
          <StatusBadge status={status} />
          <span className="text-gray-700 text-m font-medium">
            {formattedDate}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
