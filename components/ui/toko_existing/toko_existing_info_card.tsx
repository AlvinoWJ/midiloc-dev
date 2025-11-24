// components/ui/toko_existing/toko_existing_info_card.tsx
import React from "react";
import Link from "next/link";
import { MapPin, Calendar, CornerDownRight } from "lucide-react";

interface TokoExistingInfoCardProps {
  id: string;
  nama: string;
  alamat: string;
  tgl_go: string;
  kode_toko: string;
  habis_sewa: string;
  detailPath: string;
}

const statusColorMap: Record<TokoExistingInfoCardProps["kode_toko"], string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-red-100 text-red-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export function TokoExistingInfoCard({
  id,
  nama,
  alamat,
  tgl_go,
  kode_toko,
  habis_sewa,
  detailPath,
}: TokoExistingInfoCardProps) {
  const statusClasses = statusColorMap[status] || "bg-gray-100 text-gray-700";

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          {/* Header Status */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 pr-4">
              {nama}
            </h3>
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${statusClasses}`}
            >
              {kode_toko}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
              <p className="line-clamp-2">{alamat}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p>Grand Opening: {tgl_go}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 text-red-500 text-center font-bold flex-shrink-0">
                #
              </span>
              <p>Habis Sewa: {habis_sewa}</p>
            </div>
          </div>
        </div>

        {/* Link Detail */}
        <Link href={`${detailPath}${id}`} passHref legacyBehavior>
          <a className="mt-4 flex items-center justify-center gap-2 bg-red-500 text-white font-medium py-2 rounded-lg hover:bg-red-600 transition-colors w-full">
            Lihat Detail
            <CornerDownRight className="w-4 h-4" />
          </a>
        </Link>
      </div>
    </div>
  );
}
