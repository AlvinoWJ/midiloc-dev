import Link from "next/link";
import { Edit3 } from "lucide-react";
import { StatusBadge } from "@/components/shared/statusbadge";
import { formatDate } from "@/utils/ulok-utils";

interface MobileInfoCardProps {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string;
}

export default function MobileInfoCard({
  id,
  nama_ulok,
  alamat,
  created_at,
  approval_status,
}: MobileInfoCardProps) {
  const formattedDate = formatDate(created_at);

  return (
    <Link href={`/usulan_lokasi/detail/${id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 active:scale-[0.98]">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-lg font-semibold text-gray-900 capitalize mb-1 line-clamp-1">
              {nama_ulok}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {alamat}
            </p>
          </div>
          <div className="flex-shrink-0 p-1">
            <Edit3 size={20} className="text-gray-400" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <StatusBadge status={approval_status} size="sm" />
          <span className="text-xs text-gray-500 font-medium">
            {formattedDate}
          </span>
        </div>
      </div>
    </Link>
  );
}
